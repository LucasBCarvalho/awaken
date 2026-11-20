import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'aw-system-window',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"tone-" + tone()', '[class.animate]': 'animate()' },
  template: `
    <div class="frame">
      <div class="scan glow-fx" aria-hidden="true"></div>
      @if (header()) {
        <header class="head">
          <span class="bracket">[</span>
          <span class="label">{{ header() }}</span>
          <span class="bracket">]</span>
        </header>
      }
      <div class="body"><ng-content /></div>
    </div>
  `,
  styles: `
    :host { display: block; --c: var(--system-blue); --c2: var(--system-glow); filter: drop-shadow(0 0 14px color-mix(in srgb, var(--c) 35%, transparent)); }
    :host(.tone-red) { --c: var(--danger-red); --c2: #ff8095; }
    :host(.tone-violet) { --c: var(--shadow-violet); --c2: #b48cff; }
    :host(.tone-gold) { --c: var(--gold); --c2: #ffe08a; }
    :host-context(body.no-glow) { filter: none; }
    .frame {
      position: relative; overflow: hidden;
      background: linear-gradient(180deg, rgba(14, 26, 46, 0.92), rgba(9, 16, 30, 0.92));
      clip-path: var(--chamfer);
      padding: 18px 18px 20px;
      box-shadow: inset 0 0 0 1px var(--c), inset 0 0 32px color-mix(in srgb, var(--c) 14%, transparent);
    }
    .head { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 12px;
      font-family: var(--font-display); font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; font-size: 0.95rem; color: var(--c2); }
    .bracket { color: var(--c); }
    .label { text-align: center; }
    .body { position: relative; }
    .scan { position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--c2) 18%, transparent) 50%, transparent);
      height: 40%; transform: translateY(-120%); }
    :host(.animate) .frame { animation: materialize 220ms cubic-bezier(.2,.8,.2,1) both; }
    :host(.animate) .scan { animation: scan 700ms 80ms ease-out both; }
    @keyframes materialize { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
    @keyframes scan { from { transform: translateY(-120%); } to { transform: translateY(320%); } }
  `,
})
export class SystemWindowComponent {
  readonly header = input<string>('');
  readonly tone = input<'blue' | 'red' | 'violet' | 'gold'>('blue');
  readonly animate = input(true);
}
