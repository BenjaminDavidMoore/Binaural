import { Injectable, computed, signal } from '@angular/core';
import { Album, AlbumTrack } from './albums';

export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'custom';
export type Mode = 'off' | 'noise' | 'music';
export type NoiseColor = 'white' | 'pink' | 'brown';

const RAMP = 0.02;
const HARMONIC_COUNT = 8;

@Injectable({ providedIn: 'root' })
export class BinauralAudioService {
  readonly leftFreq = signal(200);
  readonly rightFreq = signal(210);
  readonly waveform = signal<Waveform>('sine');
  readonly customHarmonics = signal<number[]>(
    Array.from({ length: HARMONIC_COUNT }, (_, i) => (i === 0 ? 1 : 0))
  );

  readonly mode = signal<Mode>('off');
  readonly noiseColor = signal<NoiseColor>('pink');
  readonly album = signal<Album | null>(null);
  readonly trackIndex = signal(0);
  readonly ambientVolume = signal(0.35);
  readonly trackLoading = signal(false);
  readonly trackError = signal<string | null>(null);

  readonly masterVolume = signal(0.25);
  readonly isPlaying = signal(false);

  readonly carrier = computed(() => (this.leftFreq() + this.rightFreq()) / 2);
  readonly beat = computed(() => Math.abs(this.rightFreq() - this.leftFreq()));
  readonly isSynced = computed(() => this.leftFreq() === this.rightFreq());

  readonly currentTrack = computed<AlbumTrack | null>(() => {
    const a = this.album();
    if (!a || a.tracks.length === 0) return null;
    const i = this.trackIndex() % a.tracks.length;
    return a.tracks[i];
  });

  private ctx: AudioContext | null = null;
  private oscL: OscillatorNode | null = null;
  private oscR: OscillatorNode | null = null;
  private gainL: GainNode | null = null;
  private gainR: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private musicEl: HTMLAudioElement | null = null;
  private musicNode: MediaElementAudioSourceNode | null = null;

  setLeftFreq(hz: number) {
    const v = this.clampFreq(hz);
    this.leftFreq.set(v);
    this.applyFreq(this.oscL, v);
  }

  setRightFreq(hz: number) {
    const v = this.clampFreq(hz);
    this.rightFreq.set(v);
    this.applyFreq(this.oscR, v);
  }

  nudgeLeft(delta: number) {
    this.setLeftFreq(this.leftFreq() + delta);
  }

  nudgeRight(delta: number) {
    this.setRightFreq(this.rightFreq() + delta);
  }

  setCarrier(hz: number) {
    const b = this.beat();
    const half = b / 2;
    this.setLeftFreq(hz - half);
    this.setRightFreq(hz + half);
  }

  setBeat(hz: number) {
    const c = this.carrier();
    const half = Math.max(0, hz) / 2;
    this.setLeftFreq(c - half);
    this.setRightFreq(c + half);
  }

  nudgeCarrier(delta: number) {
    this.setCarrier(this.carrier() + delta);
  }

  nudgeBeat(delta: number) {
    this.setBeat(this.beat() + delta);
  }

  sync() {
    const c = this.carrier();
    this.setLeftFreq(c);
    this.setRightFreq(c);
  }

  nudgeSync(delta: number) {
    const target = this.carrier() + delta;
    this.setLeftFreq(target);
    this.setRightFreq(target);
  }

  smartNudge(delta: number) {
    if (this.isSynced()) this.nudgeSync(delta);
    else this.nudgeBeat(delta);
  }

  setWaveform(w: Waveform) {
    this.waveform.set(w);
    this.applyWaveform();
  }

  setCustomHarmonic(index: number, amplitude: number) {
    const arr = [...this.customHarmonics()];
    arr[index] = amplitude;
    this.customHarmonics.set(arr);
    if (this.waveform() === 'custom') this.applyWaveform();
  }

  setMode(m: Mode) {
    this.mode.set(m);
    if (this.isPlaying()) this.refreshAmbient();
  }

  setNoiseColor(c: NoiseColor) {
    this.noiseColor.set(c);
    if (this.isPlaying() && this.mode() === 'noise') this.refreshAmbient();
  }

  setAlbum(a: Album | null) {
    const isSameAlbum = a?.id === this.album()?.id;
    this.album.set(a);
    if (!isSameAlbum) this.trackIndex.set(0);
    if (this.isPlaying() && this.mode() === 'music') this.refreshAmbient();
  }

  setAmbientVolume(v: number) {
    this.ambientVolume.set(this.clamp01(v));
    if (this.noiseGain && this.ctx) {
      this.noiseGain.gain.linearRampToValueAtTime(
        this.ambientVolume() * 0.5,
        this.ctx.currentTime + RAMP
      );
    }
  }

  setMasterVolume(v: number) {
    this.masterVolume.set(this.clamp01(v));
    if (this.masterGain && this.ctx && this.isPlaying()) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.masterVolume(),
        this.ctx.currentTime + RAMP
      );
    }
  }

  async start() {
    if (this.isPlaying()) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.connect(ctx.destination);

    const pannerL = ctx.createStereoPanner();
    pannerL.pan.value = -1;
    const pannerR = ctx.createStereoPanner();
    pannerR.pan.value = 1;

    this.gainL = ctx.createGain();
    this.gainR = ctx.createGain();
    this.gainL.gain.value = 0.5;
    this.gainR.gain.value = 0.5;

    this.oscL = ctx.createOscillator();
    this.oscR = ctx.createOscillator();
    this.applyOscillatorType(this.oscL);
    this.applyOscillatorType(this.oscR);
    this.oscL.frequency.value = this.leftFreq();
    this.oscR.frequency.value = this.rightFreq();

    this.oscL.connect(this.gainL).connect(pannerL).connect(this.masterGain);
    this.oscR.connect(this.gainR).connect(pannerR).connect(this.masterGain);

    this.oscL.start();
    this.oscR.start();

    // Build ambient layer (incl. music el.play()) synchronously, before awaiting
    // ctx.resume(). On iOS Safari, awaiting resume breaks the user-gesture chain,
    // and any subsequent HTMLAudioElement.play() call gets blocked.
    this.refreshAmbient();

    this.masterGain.gain.linearRampToValueAtTime(this.masterVolume(), now + 0.4);

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.isPlaying.set(true);
  }

  async stop() {
    if (!this.isPlaying() || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.3);

    const oscL = this.oscL;
    const oscR = this.oscR;
    const noise = this.noiseSource;
    const stopAt = now + 0.35;
    try {
      oscL?.stop(stopAt);
      oscR?.stop(stopAt);
      noise?.stop(stopAt);
    } catch {
      /* already stopped */
    }

    await new Promise((r) => setTimeout(r, 360));
    this.teardownMusic();
    this.teardownNoise();
    this.oscL = null;
    this.oscR = null;
    this.gainL = null;
    this.gainR = null;
    this.masterGain = null;
    this.isPlaying.set(false);
  }

  async toggle() {
    if (this.isPlaying()) await this.stop();
    else await this.start();
  }

  private applyFreq(osc: OscillatorNode | null, hz: number) {
    if (!osc || !this.ctx) return;
    const now = this.ctx.currentTime;
    osc.frequency.cancelScheduledValues(now);
    osc.frequency.setValueAtTime(osc.frequency.value, now);
    osc.frequency.linearRampToValueAtTime(hz, now + RAMP);
  }

  private applyWaveform() {
    if (this.oscL) this.applyOscillatorType(this.oscL);
    if (this.oscR) this.applyOscillatorType(this.oscR);
  }

  private applyOscillatorType(osc: OscillatorNode) {
    const w = this.waveform();
    if (w === 'custom' && this.ctx) {
      const harm = this.customHarmonics();
      const real = new Float32Array(harm.length + 1);
      const imag = new Float32Array(harm.length + 1);
      for (let i = 0; i < harm.length; i++) {
        imag[i + 1] = harm[i];
      }
      const wave = this.ctx.createPeriodicWave(real, imag, {
        disableNormalization: false,
      });
      osc.setPeriodicWave(wave);
    } else {
      osc.type = w as OscillatorType;
    }
  }

  private refreshAmbient() {
    if (!this.ctx || !this.masterGain) return;
    this.teardownNoise();
    this.teardownMusic();

    const mode = this.mode();
    if (mode === 'off') return;

    const g = this.ctx.createGain();
    g.gain.value = this.ambientVolume() * 0.5;
    g.connect(this.masterGain);
    this.noiseGain = g;

    if (mode === 'noise') {
      this.startNoise();
    } else if (mode === 'music') {
      this.startMusic();
    }
  }

  private startNoise() {
    if (!this.ctx || !this.noiseGain) return;
    const buffer = this.makeNoiseBuffer(this.ctx, this.noiseColor());
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.noiseGain);
    src.start();
    this.noiseSource = src;
  }

  private startMusic() {
    if (!this.ctx || !this.noiseGain) return;
    const album = this.album();
    if (!album || album.tracks.length === 0) {
      this.trackError.set('no album selected');
      return;
    }
    this.trackError.set(null);
    this.trackLoading.set(true);

    const el = new Audio();
    el.crossOrigin = 'anonymous';
    el.preload = 'auto';
    el.addEventListener('ended', this.handleTrackEnded);
    el.addEventListener('canplay', () => this.trackLoading.set(false));
    el.addEventListener('error', () => {
      this.trackLoading.set(false);
      this.trackError.set('failed to load track');
    });

    const track = album.tracks[this.trackIndex() % album.tracks.length];
    el.src = track.url;
    this.musicEl = el;

    // Call play() before wiring into Web Audio. iOS Safari can silently mute an
    // element that's routed through createMediaElementSource before its first play.
    el.play().catch((err) => {
      this.trackError.set(err?.message ?? 'playback blocked');
    });

    const node = this.ctx.createMediaElementSource(el);
    node.connect(this.noiseGain);
    this.musicNode = node;
  }

  private handleTrackEnded = () => {
    const album = this.album();
    if (!album || album.tracks.length === 0 || !this.musicEl) return;
    const next = (this.trackIndex() + 1) % album.tracks.length;
    this.trackIndex.set(next);
    this.trackError.set(null);
    this.trackLoading.set(true);
    this.musicEl.src = album.tracks[next].url;
    this.musicEl.play().catch((err) => {
      this.trackLoading.set(false);
      this.trackError.set(err?.message ?? 'playback blocked');
    });
  };

  skipNext() {
    const album = this.album();
    if (!album || !this.isPlaying() || this.mode() !== 'music') return;
    this.handleTrackEnded();
  }

  skipPrev() {
    const album = this.album();
    if (!album || album.tracks.length === 0 || !this.musicEl) return;
    if (!this.isPlaying() || this.mode() !== 'music') return;
    const prev = (this.trackIndex() - 1 + album.tracks.length) % album.tracks.length;
    this.trackIndex.set(prev);
    this.trackError.set(null);
    this.trackLoading.set(true);
    this.musicEl.src = album.tracks[prev].url;
    this.musicEl.play().catch((err) => {
      this.trackLoading.set(false);
      this.trackError.set(err?.message ?? 'playback blocked');
    });
  }

  private teardownNoise() {
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
      } catch {
        /* already stopped */
      }
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.noiseGain) {
      this.noiseGain.disconnect();
      this.noiseGain = null;
    }
  }

  private teardownMusic() {
    if (this.musicEl) {
      this.musicEl.pause();
      this.musicEl.removeEventListener('ended', this.handleTrackEnded);
      this.musicEl.removeAttribute('src');
      this.musicEl.load();
      this.musicEl = null;
    }
    if (this.musicNode) {
      this.musicNode.disconnect();
      this.musicNode = null;
    }
    this.trackLoading.set(false);
  }

  private makeNoiseBuffer(ctx: AudioContext, color: NoiseColor): AudioBuffer {
    const seconds = 2;
    const length = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (color === 'white') {
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } else if (color === 'pink') {
      // Paul Kellet's pink noise algorithm
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.11;
      }
    } else {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    return buffer;
  }

  private clampFreq(hz: number): number {
    if (!Number.isFinite(hz)) return 0;
    return Math.max(20, Math.min(2000, Math.round(hz * 10) / 10));
  }

  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }
}
