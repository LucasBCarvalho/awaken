import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { GameStore } from '../core/game.store';
import { MAX_HP, MAX_MANA } from '../core/rules';
import { CLASSES } from '../core/catalog';
import { RankBadgeComponent } from './rank-badge.component';
import { StatBarComponent } from './stat-bar.component';

@Component({
  selector: 'aw-hero-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RankBadgeComponent, StatBarComponent, IonIcon],
  template: `
    <div class="hero">
      <div class="row">
        <div class="avatar" aria-hidden="true">{{ initial() }}</div>
        <div class="who">
          <div class="name">{{ s().hunterName }}</div>
          <div class="sub">
            @if (s().title) { <span class="ttl">{{ s().title }}</span> · }
            {{ className() }}
          </div>
        </div>
        <div class="lvl">
          <span class="lbl">NV</span>
          <span class="num">{{ s().level }}</span>
        </div>
        <aw-rank-badge [rank]="s().rank" [size]="46" />
      </div>

      <div class="xp">
        <aw-stat-bar kind="xp" label="XP" [value]="s().xp" [max]="store.xpNeeded()" />
        <div class="xp-txt num">{{ s().xp }} / {{ store.xpNeeded() }} XP</div>
      </div>

      <div class="row2">
        <aw-stat-bar class="b" kind="hp" label="HP" [value]="s().hp" [max]="maxHp" [showText]="true" />
        <aw-stat-bar class="b" kind="mana" label="MP" [value]="s().mana" [max]="maxMana" [showText]="true" />
        <div class="coins">
          <span class="coin gold" aria-label="Ouro"><ion-icon name="ellipse" /> <span class="num">{{ s().gold }}</span></span>
          <span class="coin crystal" aria-label="Cristais de Mana"><ion-icon name="diamond" /> <span class="num">{{ s().crystals }}</span></span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .hero { padding: 6px 0 4px; }
    .row { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 48px; height: 48px; flex: none; border-radius: 12px; display: grid; place-items: center;
      font-family: var(--font-display); font-weight: 700; font-size: 1.5rem; color: var(--system-cyan);
      background: linear-gradient(160deg, #13284a, #0a1324); box-shadow: var(--glow); }
    .who { flex: 1; min-width: 0; }
    .name { font-family: var(--font-display); font-weight: 700; font-size: 1.25rem; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sub { font-size: .78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ttl { color: var(--gold); }
    .lvl { display: flex; flex-direction: column; align-items: center; line-height: 1; }
    .lvl .lbl { font-family: var(--font-display); font-size: .7rem; font-weight: 700; color: var(--text-muted); letter-spacing: .1em; }
    .lvl .num { font-size: 1.5rem; font-weight: 600; color: var(--system-cyan); }
    .xp { margin-top: 12px; }
    .xp-txt { text-align: right; font-size: .7rem; color: var(--text-muted); margin-top: 3px; }
    .row2 { display: flex; gap: 12px; align-items: flex-end; margin-top: 4px; }
    .b { flex: 1; }
    .coins { display: flex; flex-direction: column; gap: 2px; align-items: flex-end; }
    .coin { display: inline-flex; align-items: center; gap: 4px; font-size: .8rem; }
    .coin.gold ion-icon { color: var(--gold); }
    .coin.crystal ion-icon { color: #b48cff; }
  `,
})
export class HeroHeaderComponent {
  protected readonly store = inject(GameStore);
  readonly s = this.store.state;
  readonly maxHp = MAX_HP;
  readonly maxMana = MAX_MANA;
  readonly initial = computed(() => (this.s().hunterName || '?').charAt(0).toUpperCase());
  readonly className = computed(() => {
    const c = this.s().heroClass;
    return c ? CLASSES[c].name : 'Não despertado';
  });
}
