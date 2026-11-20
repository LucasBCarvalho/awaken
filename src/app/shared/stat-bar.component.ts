import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// scaleX em vez de width para animar sem recalcular layout.
@Component({
  selector: 'aw-stat-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'max()',
    '[class]': '"kind-" + kind()',
  },
  template: `
    @if (showText()) {
      <div class="row">
        <span class="lbl">{{ label() }}</span>
        <span class="num">{{ value() }}<span class="muted">/{{ max() }}</span></span>
      </div>
    }
    <div class="track">
      <div class="fill" [style.transform]="'scaleX(' + ratio() + ')'"></div>
      <div class="shine glow-fx" aria-hidden="true"></div>
    </div>
  `,
  styles: `
    :host { display: block; --from: var(--system-blue); --to: var(--system-glow); --h: 6px; }
    :host(.kind-hp) { --from: #d92a4a; --to: #ff6b84; }
    :host(.kind-mana) { --from: #4b2bb0; --to: #9d7bff; }
    :host(.kind-xp) { --h: 7px; }
    .row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; font-size: 0.72rem; }
    .lbl { font-family: var(--font-display); font-weight: 700; letter-spacing: 0.1em; color: var(--text-muted); }
    .num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--text-primary); }
    .muted { color: var(--text-muted); }
    .track { position: relative; height: var(--h); border-radius: 99px; background: rgba(255,255,255,0.07); overflow: hidden; }
    .fill { position: absolute; inset: 0; transform-origin: left center; border-radius: inherit;
      background: linear-gradient(90deg, var(--from), var(--to));
      box-shadow: 0 0 10px color-mix(in srgb, var(--to) 60%, transparent);
      transition: transform 600ms cubic-bezier(.2,.8,.2,1); will-change: transform; }
    .shine { position: absolute; top: 0; bottom: 0; width: 30%; left: -30%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
      animation: shine 2.8s ease-in-out infinite; }
    :host(:not(.kind-xp)) .shine { display: none; }
    @keyframes shine { 0%, 60% { transform: translateX(0); } 100% { transform: translateX(460%); } }
  `,
})
export class StatBarComponent {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input('');
  readonly kind = input<'xp' | 'hp' | 'mana'>('xp');
  readonly showText = input(false);
  readonly ratio = computed(() => Math.max(0, Math.min(1, this.value() / Math.max(1, this.max()))));
}
