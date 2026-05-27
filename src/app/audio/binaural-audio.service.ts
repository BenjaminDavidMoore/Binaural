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
  readonly isAmbientPlaying = signal(false);

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
  private freqGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private oscL: OscillatorNode | null = null;
  private oscR: OscillatorNode | null = null;
  private gainL: GainNode | null = null;
  private gainR: GainNode | null = null;
  private channelMerger: ChannelMergerNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private musicEl: HTMLAudioElement | null = null;
  private musicNode: MediaElementAudioSourceNode | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  // Silent-loop sentinel: a hidden <audio> playing a near-silent WAV keeps the
  // iOS audio session active so the rest of WebAudio continues to play when the
  // PWA is backgrounded or the screen is locked.
  private silentLoop: HTMLAudioElement | null = null;
  private silentLoopUrl: string | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    if (document.visibilityState !== 'visible') return;
    if (!this.anyPlaying() || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        /* user gesture may be required; play button will re-trigger */
      });
    }
    this.acquireWakeLock();
  };

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
    if (this.isAmbientPlaying()) this.refreshAmbient();
  }

  setNoiseColor(c: NoiseColor) {
    this.noiseColor.set(c);
    if (this.isAmbientPlaying() && this.mode() === 'noise') this.refreshAmbient();
  }

  setAlbum(a: Album | null) {
    const isSameAlbum = a?.id === this.album()?.id;
    this.album.set(a);
    if (!isSameAlbum) this.trackIndex.set(0);
    if (this.isAmbientPlaying() && this.mode() === 'music') this.refreshAmbient();
  }

  setAmbientVolume(v: number) {
    this.ambientVolume.set(this.clamp01(v));
    if (this.ambientGain && this.ctx && this.isAmbientPlaying()) {
      this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(
        this.ambientVolume(),
        this.ctx.currentTime + RAMP
      );
    }
  }

  setMasterVolume(v: number) {
    this.masterVolume.set(this.clamp01(v));
    if (this.freqGain && this.ctx && this.isPlaying()) {
      this.freqGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.freqGain.gain.linearRampToValueAtTime(
        this.masterVolume(),
        this.ctx.currentTime + RAMP
      );
    }
  }

  async start() {
    if (this.isPlaying()) return;
    this.ensureContext();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Explicit channel routing: L oscillator → channel 0, R oscillator → channel 1.
    // This is more deterministic than StereoPannerNode hard-panning across
    // browsers, Bluetooth sinks, and older iOS — the merger guarantees each
    // oscillator lands on exactly one output channel.
    this.channelMerger = ctx.createChannelMerger(2);
    this.channelMerger.connect(this.freqGain!);

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

    this.oscL.connect(this.gainL);
    this.gainL.connect(this.channelMerger, 0, 0);
    this.oscR.connect(this.gainR);
    this.gainR.connect(this.channelMerger, 0, 1);

    this.oscL.start();
    this.oscR.start();

    this.freqGain!.gain.cancelScheduledValues(now);
    this.freqGain!.gain.setValueAtTime(0, now);
    this.freqGain!.gain.linearRampToValueAtTime(this.masterVolume(), now + 0.4);

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.isPlaying.set(true);
    this.acquireWakeLock();
    this.startSilentLoop();
    this.updateMediaSession();
  }

  async stop() {
    if (!this.isPlaying() || !this.ctx || !this.freqGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.freqGain.gain.cancelScheduledValues(now);
    this.freqGain.gain.setValueAtTime(this.freqGain.gain.value, now);
    this.freqGain.gain.linearRampToValueAtTime(0, now + 0.3);

    const oscL = this.oscL;
    const oscR = this.oscR;
    const stopAt = now + 0.35;
    try {
      oscL?.stop(stopAt);
      oscR?.stop(stopAt);
    } catch {
      /* already stopped */
    }

    await new Promise((r) => setTimeout(r, 360));
    if (this.channelMerger) {
      this.channelMerger.disconnect();
      this.channelMerger = null;
    }
    this.oscL = null;
    this.oscR = null;
    this.gainL = null;
    this.gainR = null;
    this.isPlaying.set(false);
    if (!this.isAmbientPlaying()) {
      this.releaseWakeLock();
      this.stopSilentLoop();
    }
    this.updateMediaSession();
  }

  async toggle() {
    if (this.isPlaying()) await this.stop();
    else await this.start();
  }

  async startAmbient() {
    if (this.isAmbientPlaying()) return;
    if (this.mode() === 'off') return;
    this.ensureContext();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    this.ambientGain!.gain.cancelScheduledValues(now);
    this.ambientGain!.gain.setValueAtTime(0, now);
    this.ambientGain!.gain.linearRampToValueAtTime(this.ambientVolume(), now + 0.4);

    // Build the ambient source synchronously before awaiting ctx.resume() so
    // that HTMLAudioElement.play() lands inside the user-gesture stack (required
    // by iOS Safari).
    this.startAmbientSource();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.isAmbientPlaying.set(true);
    this.acquireWakeLock();
    this.startSilentLoop();
    this.updateMediaSession();
  }

  async stopAmbient() {
    if (!this.isAmbientPlaying() || !this.ctx || !this.ambientGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.3);

    const noise = this.noiseSource;
    const stopAt = now + 0.35;
    try {
      noise?.stop(stopAt);
    } catch {
      /* already stopped */
    }

    await new Promise((r) => setTimeout(r, 360));
    this.teardownMusic();
    this.teardownNoise();
    this.isAmbientPlaying.set(false);
    if (!this.isPlaying()) {
      this.releaseWakeLock();
      this.stopSilentLoop();
    }
    this.updateMediaSession();
  }

  async toggleAmbient() {
    if (this.isAmbientPlaying()) await this.stopAmbient();
    else await this.startAmbient();
  }

  private ensureContext() {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
      this.ctx = new Ctor();
    }
    if (!this.freqGain) {
      this.freqGain = this.ctx.createGain();
      this.freqGain.gain.value = 0;
      this.freqGain.connect(this.ctx.destination);
    }
    if (!this.ambientGain) {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0;
      this.ambientGain.connect(this.ctx.destination);
    }
  }

  private anyPlaying(): boolean {
    return this.isPlaying() || this.isAmbientPlaying();
  }

  private async acquireWakeLock() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    if (this.wakeLock) return;
    try {
      const sentinel = await (
        navigator as Navigator & {
          wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinel> };
        }
      ).wakeLock.request('screen');
      this.wakeLock = sentinel;
      sentinel.addEventListener('release', () => {
        this.wakeLock = null;
      });
    } catch {
      /* permission denied or unsupported — fail silently */
    }
  }

  private releaseWakeLock() {
    this.wakeLock?.release().catch(() => {
      /* already released */
    });
    this.wakeLock = null;
  }

  /**
   * iOS Safari suspends WebAudio whenever the PWA is backgrounded or the screen
   * locks, unless the page is hosting active media. We hide a tiny <audio>
   * element playing a near-silent looping WAV so the OS sees a live audio
   * session and keeps WebAudio (and the music element) running.
   *
   * The loop must be started inside a user gesture (the play tap) and the
   * payload must contain non-zero samples — pure silence is detected and
   * ignored by iOS.
   */
  private startSilentLoop() {
    if (typeof document === 'undefined') return;
    if (!this.silentLoop) {
      if (!this.silentLoopUrl) {
        this.silentLoopUrl = this.generateNearSilentWavUrl();
      }
      const el = new Audio(this.silentLoopUrl);
      el.loop = true;
      el.preload = 'auto';
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      el.style.cssText =
        'position:fixed;bottom:0;right:0;width:1px;height:1px;opacity:0.001;pointer-events:none;z-index:-1';
      document.body.appendChild(el);
      this.silentLoop = el;
    }
    this.silentLoop.play().catch(() => {
      /* blocked without user gesture — the play button will retry next time */
    });
  }

  private stopSilentLoop() {
    if (!this.silentLoop) return;
    this.silentLoop.pause();
  }

  /**
   * MediaSession registration tells iOS "this tab is a media app". It surfaces
   * lock-screen controls (play/pause from Control Center, AirPods, CarPlay) and
   * is part of what convinces iOS to keep the audio session alive in the
   * background. Action handlers route OS controls back into our service.
   */
  private updateMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const playing = this.anyPlaying();

    if (!playing) {
      ms.playbackState = 'paused';
      return;
    }

    const subtitle = this.isPlaying()
      ? `${Math.round(this.leftFreq())} / ${Math.round(this.rightFreq())} Hz · ${this.beat().toFixed(1)} Hz beat`
      : 'ambient layer';

    try {
      ms.metadata = new MediaMetadata({
        title: 'Binaural — Frequency Lab',
        artist: subtitle,
        album: this.audioContextLabel(),
        artwork: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });
    } catch {
      /* MediaMetadata constructor may not exist on very old browsers */
    }
    ms.playbackState = 'playing';

    const safeSet = (action: MediaSessionAction, handler: (() => void) | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* unsupported action — ignore */
      }
    };
    safeSet('play', () => {
      if (!this.isPlaying()) this.start();
    });
    safeSet('pause', () => {
      if (this.isPlaying()) this.stop();
      if (this.isAmbientPlaying()) this.stopAmbient();
    });
    safeSet('stop', () => {
      if (this.isPlaying()) this.stop();
      if (this.isAmbientPlaying()) this.stopAmbient();
    });
    safeSet('nexttrack', this.mode() === 'music' ? () => this.skipNext() : null);
    safeSet('previoustrack', this.mode() === 'music' ? () => this.skipPrev() : null);
  }

  private audioContextLabel(): string {
    const parts: string[] = [];
    if (this.isPlaying()) parts.push('binaural');
    if (this.isAmbientPlaying()) {
      if (this.mode() === 'noise') parts.push(`${this.noiseColor()} noise`);
      else if (this.mode() === 'music') parts.push(this.album()?.title ?? 'music');
    }
    return parts.join(' + ') || 'binaural session';
  }

  /**
   * Build a tiny WAV (1s mono @ 44.1kHz, ~88KB) holding a few non-zero samples.
   * Stored as a Blob URL so we don't need to bundle a binary asset.
   * iOS rejects truly silent buffers as inactive — the sparse pulses are below
   * audible threshold but enough to keep the audio session classified as live.
   */
  private generateNearSilentWavUrl(): string {
    const sampleRate = 44100;
    const samples = sampleRate; // 1 second
    const dataSize = samples * 2; // 16-bit mono
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    let p = 0;
    const writeStr = (s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i));
    };
    const writeU32 = (n: number) => {
      view.setUint32(p, n, true);
      p += 4;
    };
    const writeU16 = (n: number) => {
      view.setUint16(p, n, true);
      p += 2;
    };

    writeStr('RIFF');
    writeU32(36 + dataSize);
    writeStr('WAVE');
    writeStr('fmt ');
    writeU32(16);
    writeU16(1); // PCM
    writeU16(1); // mono
    writeU32(sampleRate);
    writeU32(sampleRate * 2);
    writeU16(2);
    writeU16(16);
    writeStr('data');
    writeU32(dataSize);

    // ~-90 dB pulses every 100 samples — well below perceptual threshold but
    // non-zero so iOS classifies the element as actively playing.
    for (let i = 0; i < samples; i++) {
      view.setInt16(44 + i * 2, i % 100 === 0 ? 2 : 0, true);
    }

    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
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
    if (!this.ctx || !this.ambientGain) return;
    this.teardownNoise();
    this.teardownMusic();
    if (this.mode() === 'off') return;
    this.startAmbientSource();
  }

  private startAmbientSource() {
    if (this.mode() === 'noise') this.startNoise();
    else if (this.mode() === 'music') this.startMusic();
  }

  private startNoise() {
    if (!this.ctx || !this.ambientGain) return;
    const buffer = this.makeNoiseBuffer(this.ctx, this.noiseColor());
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.ambientGain);
    src.start();
    this.noiseSource = src;
  }

  private startMusic() {
    if (!this.ctx || !this.ambientGain) return;
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
    node.connect(this.ambientGain);
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
    if (!album || !this.isAmbientPlaying() || this.mode() !== 'music') return;
    this.handleTrackEnded();
  }

  skipPrev() {
    const album = this.album();
    if (!album || album.tracks.length === 0 || !this.musicEl) return;
    if (!this.isAmbientPlaying() || this.mode() !== 'music') return;
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
