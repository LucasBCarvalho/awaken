import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { ACHIEVEMENTS, AchievementDef, MAX_TIER_POINTS, TIERS, tierDescription } from '../../core/achievements';

@Component({
  selector: 'aw-achievements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon],
  template: `
    <ion-content>
      <div class="wrap">
        <header class="top">
          <h2 class="display">Conquistas</h2>
          <button class="x" type="button" (click)="close()" aria-label="Fechar"><ion-icon name="close" /></button>
        </header>

        <div class="summary">
          <div class="big num">{{ points() }}<span>/{{ max }}</span></div>
          <div class="muted">níveis de conquista desbloqueados</div>
          <div class="tiers-legend">
            @for (t of tiers; track t.name; let i = $index) {
              <span class="leg" [style.--tc]="t.color"><ion-icon name="trophy" /> {{ t.name }} <b class="num">{{ countAt(i) }}</b></span>
            }
          </div>
        </div>

        <div class="filters">
          @for (c of categories; track c) {
            <button type="button" class="choice" [class.on]="cat() === c" (click)="cat.set(c)">{{ c }}</button>
          }
        </div>

        @for (a of list(); track a.id) {
          @let tier = tierOf(a);
          @let val = value(a);
          <div class="ach" [class.maxed]="tier >= 5" [style.--tc]="tier ? tiers[tier - 1].color : 'rgba(122,139,168,.5)'">
            <div class="medal" [class.locked]="!tier"><ion-icon [name]="a.icon" /></div>
            <div class="body">
              <div class="name">{{ a.name }}
                @if (tier) { <span class="tier">{{ tiers[tier - 1].name }}</span> }
              </div>
              @if (tier < 5) {
                <div class="desc">{{ desc(a, tier) }}</div>
                <div class="bar"><i [style.transform]="'scaleX(' + Math.min(1, val / a.targets[tier]) + ')'" [style.background]="tiers[tier].color"></i></div>
                <div class="meta">
                  <span class="num">{{ fmt(val) }} / {{ fmt(a.targets[tier]) }}</span>
                  <span class="rew">Próximo: {{ tiers[tier].name }} · +{{ tiers[tier].gold }} ouro@if (tiers[tier].crystals) { · +{{ tiers[tier].crystals }} cristais }@if (tier === 4) { · título }</span>
                </div>
              } @else {
                <div class="desc">Todos os níveis concluídos. Título "{{ a.name }}" desbloqueado.</div>
              }
              <div class="pips" aria-hidden="true">
                @for (t of tiers; track t.name; let i = $index) {
                  <i [class.on]="i < tier" [style.--pc]="t.color"></i>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .wrap { padding: 8px 16px calc(24px + env(safe-area-inset-bottom)); }
    .top { display: flex; justify-content: space-between; align-items: center; margin: 10px 0 12px; }
    h2.display { margin: 0; font-size: 1.3rem; color: var(--gold); }
    .x { width: 44px; height: 44px; border: 0; background: transparent; color: var(--text-muted); font-size: 1.5rem; }
    .summary { text-align: center; padding: 14px; border-radius: 14px; background: linear-gradient(160deg, rgba(245,196,81,.12), rgba(11,18,32,.9)); border: 1px solid rgba(245,196,81,.35); }
    .big { font-size: 2.4rem; font-weight: 600; color: var(--gold); line-height: 1; }
    .big span { font-size: 1rem; color: var(--text-muted); }
    .tiers-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 12px; margin-top: 10px; font-size: .78rem; }
    .leg { display: inline-flex; align-items: center; gap: 4px; color: var(--tc); }
    .leg b { color: var(--text-primary); }
    .filters { display: flex; gap: 6px; overflow-x: auto; margin: 14px -16px 10px; padding: 0 16px 4px; scrollbar-width: none; }
    .filters .choice { flex: none; min-height: 38px; font-size: .82rem; }
    .ach { display: flex; gap: 12px; padding: 12px; margin-bottom: 8px; border-radius: 14px; background: var(--bg-abyss); border: 1px solid rgba(47,139,255,.14); }
    .ach.maxed { border-color: color-mix(in srgb, var(--tc) 60%, transparent); box-shadow: 0 0 14px color-mix(in srgb, var(--tc) 25%, transparent); }
    .medal { flex: none; width: 52px; height: 52px; display: grid; place-items: center; font-size: 1.5rem; color: var(--tc);
      clip-path: polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
      background: color-mix(in srgb, var(--tc) 22%, #0b1220); }
    .medal.locked { color: #4a5872; background: #101a2c; }
    .body { flex: 1; min-width: 0; }
    .name { font-weight: 700; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
    .tier { font-family: var(--font-display); font-size: .7rem; letter-spacing: .1em; text-transform: uppercase; color: var(--tc); border: 1px solid var(--tc); padding: 0 6px; border-radius: 99px; }
    .desc { font-size: .84rem; color: #c8d6ec; margin-top: 2px; }
    .bar { height: 5px; border-radius: 3px; background: rgba(255,255,255,.07); overflow: hidden; margin-top: 8px; }
    .bar i { display: block; height: 100%; transform-origin: left; transition: transform .4s; }
    .meta { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 4px; font-size: .72rem; color: var(--text-muted); }
    .rew { color: var(--gold); }
    .pips { display: flex; gap: 4px; margin-top: 8px; }
    .pips i { width: 18px; height: 4px; border-radius: 2px; background: rgba(255,255,255,.1); }
    .pips i.on { background: var(--pc); box-shadow: 0 0 4px var(--pc); }
  `,
})
export class AchievementsComponent {
  private readonly store = inject(GameStore);
  private readonly modalCtrl = inject(ModalController);
  readonly tiers = TIERS;
  readonly max = MAX_TIER_POINTS;
  readonly Math = Math;
  readonly categories = ['Todas', ...new Set(ACHIEVEMENTS.map((a) => a.category))];
  readonly cat = signal('Todas');

  readonly list = computed(() => {
    const c = this.cat();
    const s = this.store.state();
    return ACHIEVEMENTS.filter((a) => c === 'Todas' || a.category === c).sort((a, b) => {
      // em andamento primeiro (mais perto do próximo nível), concluídas por último
      const ta = s.achievements[a.id] ?? 0;
      const tb = s.achievements[b.id] ?? 0;
      if ((ta >= 5) !== (tb >= 5)) return ta >= 5 ? 1 : -1;
      return this.ratio(b) - this.ratio(a);
    });
  });
  readonly points = computed(() => Object.values(this.store.state().achievements).reduce((a, b) => a + b, 0));

  tierOf(a: AchievementDef): number {
    return this.store.state().achievements[a.id] ?? 0;
  }
  value(a: AchievementDef): number {
    return a.metric(this.store.state());
  }
  private ratio(a: AchievementDef): number {
    const t = this.tierOf(a);
    return t >= 5 ? 1 : this.value(a) / a.targets[t];
  }
  countAt(i: number): number {
    return Object.values(this.store.state().achievements).filter((t) => t > i).length;
  }
  desc = tierDescription;
  fmt(n: number): string {
    return n.toLocaleString('pt-BR');
  }
  close(): void {
    this.modalCtrl.dismiss();
  }
}
