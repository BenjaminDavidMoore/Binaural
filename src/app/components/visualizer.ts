import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { BinauralAudioService } from '../audio/binaural-audio.service';

@Component({
  selector: 'app-visualizer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #cvs class="viz"></canvas>`,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
      }
      .viz {
        width: 100%;
        height: 100%;
        display: block;
        opacity: 0.7;
      }
    `,
  ],
})
export class VisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cvs', { static: true }) cvs!: ElementRef<HTMLCanvasElement>;
  private audio = inject(BinauralAudioService);
  private raf = 0;
  private dpr = window.devicePixelRatio || 1;
  private t = 0;

  ngAfterViewInit() {
    this.resize();
    window.addEventListener('resize', this.onResize);
    this.loop();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
  }

  private onResize = () => this.resize();

  private resize() {
    const c = this.cvs.nativeElement;
    const w = window.innerWidth;
    const h = window.innerHeight;
    c.width = w * this.dpr;
    c.height = h * this.dpr;
    c.style.width = w + 'px';
    c.style.height = h + 'px';
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.draw();
  };

  private draw() {
    const c = this.cvs.nativeElement;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    const cx = w / 2;
    const cy = h / 2;

    // Trailing fade
    ctx.fillStyle = 'rgba(8, 10, 16, 0.08)';
    ctx.fillRect(0, 0, w, h);

    const left = this.audio.leftFreq();
    const right = this.audio.rightFreq();
    const beat = this.audio.beat();
    const playing = this.audio.isPlaying();

    this.t += playing ? 0.012 : 0.004;
    const beatPhase = Math.sin(this.t * Math.max(0.5, beat) * 0.4);
    const intensity = playing ? 0.85 : 0.25;

    // Two interweaving sine waves, one per ear
    this.drawWave(ctx, w, h, cy - h * 0.08, left, this.t, '#60a5fa', intensity);
    this.drawWave(ctx, w, h, cy + h * 0.08, right, this.t * 1.01, '#a78bfa', intensity);

    // Central beat-pulse ring
    const radius = Math.min(w, h) * 0.18 + beatPhase * Math.min(w, h) * 0.04;
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, `rgba(125, 211, 252, ${0.08 * intensity})`);
    grad.addColorStop(1, 'rgba(125, 211, 252, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWave(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    y: number,
    hz: number,
    time: number,
    color: string,
    intensity: number
  ) {
    const amplitude = h * 0.06 * intensity;
    const wavelength = w / Math.max(2, hz / 8);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4 * this.dpr;
    ctx.globalAlpha = 0.35 * intensity;
    for (let x = 0; x <= w; x += 2) {
      const yy = y + Math.sin((x / wavelength) * Math.PI * 2 + time * hz * 0.05) * amplitude;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
