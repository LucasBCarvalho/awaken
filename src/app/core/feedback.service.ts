import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/** Háptico e som curto "digital". Tudo opcional e sem bloquear a UI. */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  hapticsOn = true;
  soundOn = true;
  private ctx?: AudioContext;

  tap(): void {
    if (this.hapticsOn) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }

  success(): void {
    if (this.hapticsOn) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    this.beep([880, 1320], 0.06);
  }

  heavy(): void {
    if (this.hapticsOn) Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    this.beep([440, 660, 990, 1320], 0.09);
  }

  warn(): void {
    if (this.hapticsOn) Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
    this.beep([330, 220], 0.12);
  }

  private beep(freqs: number[], step: number): void {
    if (!this.soundOn) return;
    try {
      this.ctx ??= new AudioContext();
      const ctx = this.ctx;
      const t0 = ctx.currentTime;
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = f;
        const start = t0 + i * step;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + step);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + step + 0.02);
      });
    } catch {
      /* áudio indisponível */
    }
  }
}
