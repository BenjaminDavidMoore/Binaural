import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BinauralAudioService, Mode, NoiseColor, Waveform } from './audio/binaural-audio.service';
import { Preset, PRESETS } from './audio/presets';
import { ALBUMS, Album } from './audio/albums';
import { VisualizerComponent } from './components/visualizer';

interface BandInfo {
  name: string;
  range: string;
}

@Component({
  selector: 'app-root',
  imports: [VisualizerComponent, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected audio = inject(BinauralAudioService);
  protected presets = PRESETS;
  protected albums = ALBUMS;

  protected band = computed<BandInfo>(() => {
    const b = this.audio.beat();
    if (b < 4) return { name: 'Delta', range: '0.5–4 Hz' };
    if (b < 8) return { name: 'Theta', range: '4–8 Hz' };
    if (b < 13) return { name: 'Alpha', range: '8–13 Hz' };
    if (b < 30) return { name: 'Beta', range: '13–30 Hz' };
    return { name: 'Gamma', range: '30+ Hz' };
  });

  protected waveforms: Waveform[] = ['sine', 'square', 'triangle', 'sawtooth', 'custom'];
  protected modes: Mode[] = ['off', 'noise', 'music'];
  protected modeLabels: Record<Mode, string> = { off: 'none', noise: 'noise', music: 'music' };
  protected noiseColors: NoiseColor[] = ['white', 'pink', 'brown'];

  protected currentTrackPosition = computed(() => {
    const a = this.audio.album();
    if (!a) return null;
    return `${this.audio.trackIndex() + 1} of ${a.tracks.length}`;
  });

  protected onLeftInput(ev: Event) {
    const v = parseFloat((ev.target as HTMLInputElement).value);
    if (Number.isFinite(v)) this.audio.setLeftFreq(v);
  }

  protected onRightInput(ev: Event) {
    const v = parseFloat((ev.target as HTMLInputElement).value);
    if (Number.isFinite(v)) this.audio.setRightFreq(v);
  }

  protected onVolumeInput(ev: Event) {
    const v = parseFloat((ev.target as HTMLInputElement).value);
    this.audio.setMasterVolume(v);
  }

  protected onAmbientVolumeInput(ev: Event) {
    const v = parseFloat((ev.target as HTMLInputElement).value);
    this.audio.setAmbientVolume(v);
  }

  protected onHarmonicInput(ev: Event, i: number) {
    const v = parseFloat((ev.target as HTMLInputElement).value);
    this.audio.setCustomHarmonic(i, v);
  }

  protected applyPreset(p: Preset) {
    this.audio.setCarrier(p.carrier);
    this.audio.setBeat(p.beat);
    this.audio.setWaveform(p.waveform);
  }

  protected selectAlbum(a: Album) {
    this.audio.setAlbum(a);
  }

  protected harmonicIndexes() {
    return this.audio.customHarmonics().map((_, i) => i);
  }
}
