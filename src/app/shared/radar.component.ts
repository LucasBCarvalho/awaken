import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AttributeKey } from '../core/models';
import { ATTRIBUTE_KEYS } from '../core/rules';

/** Gráfico de radar hexagonal dos 6 atributos. */
@Component({
  selector: 'aw-radar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'aria()' },
  template: `
    <svg viewBox="0 0 240 240" width="100%">
      @for (r of rings; track r) {
        <polygon [attr.points]="ring(r)" fill="none" stroke="rgba(47,139,255,0.22)" stroke-width="1" />
      }
      @for (p of axes(); track p.key) {
        <line x1="120" y1="120" [attr.x2]="p.x" [attr.y2]="p.y" stroke="rgba(47,139,255,0.18)" />
        <text [attr.x]="p.lx" [attr.y]="p.ly" text-anchor="middle" dominant-baseline="central"
          fill="#A6F0FF" font-family="Rajdhani, sans-serif" font-weight="700" font-size="13">{{ p.key }}</text>
      }
      <polygon [attr.points]="shape()" fill="rgba(92,200,255,0.22)" stroke="#5CC8FF" stroke-width="2" stroke-linejoin="round" />
      @for (d of dots(); track $index) {
        <circle [attr.cx]="d[0]" [attr.cy]="d[1]" r="3" fill="#A6F0FF" />
      }
    </svg>
  `,
  styles: `:host { display: block; max-width: 280px; margin: 0 auto; }`,
})
export class RadarComponent {
  readonly values = input.required<Record<AttributeKey, number>>();
  readonly rings = [0.25, 0.5, 0.75, 1];
  private readonly R = 88;

  private pt(i: number, scale: number): [number, number] {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [120 + Math.cos(a) * this.R * scale, 120 + Math.sin(a) * this.R * scale];
  }

  ring(scale: number): string {
    return ATTRIBUTE_KEYS.map((_, i) => this.pt(i, scale).join(',')).join(' ');
  }

  readonly max = computed(() => Math.max(5, ...Object.values(this.values())) * 1.15);
  readonly axes = computed(() =>
    ATTRIBUTE_KEYS.map((key, i) => {
      const [x, y] = this.pt(i, 1);
      const [lx, ly] = this.pt(i, 1.2);
      return { key, x, y, lx, ly };
    }),
  );
  readonly dots = computed(() => ATTRIBUTE_KEYS.map((k, i) => this.pt(i, Math.max(0.06, this.values()[k] / this.max()))));
  readonly shape = computed(() => this.dots().map((d) => d.join(',')).join(' '));
  readonly aria = computed(() => 'Atributos: ' + ATTRIBUTE_KEYS.map((k) => `${k} ${this.values()[k]}`).join(', '));
}
