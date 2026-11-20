import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon, ToastController } from '@ionic/angular';
import { GameStore } from '../core/game.store';
import { GameEvent } from '../core/models';
import { ITEM_MAP, ITEM_TYPE_LABEL, SYSTEM_LINES } from '../core/catalog';
import { RARITY } from '../core/rules';
import { ACHIEVEMENT_MAP, TIERS, tierDescription } from '../core/achievements';
import { SystemWindowComponent } from './system-window.component';
import { RankBadgeComponent } from './rank-badge.component';

interface Float {
  id: number;
  xp: number;
  gold: number;
}

@Component({
  selector: 'aw-event-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SystemWindowComponent, RankBadgeComponent, IonIcon],
  template: `
    <!-- Chips de recompensa que sobem até a barra do topo -->
    <div class="floats" aria-hidden="true">
      @for (f of floats(); track f.id) {
        <div class="float">
          <span class="chip">+{{ f.xp }} XP</span>
          @if (f.gold) { <span class="chip gold">+{{ f.gold }} ouro</span> }
        </div>
      }
    </div>
    <div class="sr-only" aria-live="polite">{{ announce() }}</div>

    @if (current(); as e) {
      @switch (e.kind) {
        @case ('levelup') {
          <div class="full levelup" (click)="dismiss()" role="dialog" aria-label="Subiu de nível">
            <div class="rings glow-fx" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="lv-content">
              <div class="lv-tag">[ SISTEMA ]</div>
              <div class="lv-title">LEVEL UP!</div>
              <div class="lv-num num">{{ e.level }}</div>
              <p class="lv-line">{{ line() }}</p>
              <p class="lv-pts">+{{ e.points }} pontos de atributo · HP e Mana restaurados</p>
              <div class="lv-actions">
                <button class="btn" (click)="goProfile($event)">Distribuir pontos</button>
                <button class="btn ghost" (click)="dismiss()">Continuar</button>
              </div>
              <p class="skip">Toque em qualquer lugar para pular</p>
            </div>
          </div>
        }
        @case ('rankup') {
          <div class="full rankup" (click)="dismiss()" role="dialog" aria-label="Novo rank">
            <div class="lv-content">
              <div class="lv-tag">[ PROMOÇÃO CONCLUÍDA ]</div>
              <aw-rank-badge [rank]="e.rank" [size]="140" />
              <div class="lv-title">RANK {{ e.rank }}</div>
              <p class="lv-line">O Sistema reconhece sua evolução. +50 Cristais de Mana.</p>
              <button class="btn" (click)="dismiss()">Aceitar</button>
            </div>
          </div>
        }
        @case ('item') {
          <div class="backdrop" (click)="dismiss()">
            <aw-system-window class="win" header="ITEM OBTIDO" [tone]="itemTone(e.itemId)" (click)="$event.stopPropagation()">
              @if (item(e.itemId); as it) {
                <div class="item" [style.--rc]="rarity(it.rarity).color">
                  <div class="item-icon" [class.pulse]="it.rarity === 'epic' || it.rarity === 'legendary'">
                    <ion-icon [name]="it.icon" />
                  </div>
                  <div class="item-name">{{ it.name }}</div>
                  <div class="item-meta">{{ rarity(it.rarity).label }} · {{ typeLabel(it.type) }}</div>
                  <p class="item-desc">{{ it.description }}</p>
                  <p class="muted src">{{ e.source }}</p>
                </div>
              }
              <button class="btn block" (click)="dismiss()">OK</button>
            </aw-system-window>
          </div>
        }
        @case ('achievement') {
          <div class="backdrop" (click)="dismiss()">
            <aw-system-window class="win" header="CONQUISTA DESBLOQUEADA" tone="gold" (click)="$event.stopPropagation()">
              @if (ach(e.id); as a) {
                <div class="item" [style.--rc]="tiers[e.tier].color">
                  <div class="item-icon medal pulse"><ion-icon [name]="a.icon" /></div>
                  <div class="item-name">{{ a.name }}</div>
                  <div class="item-meta">Nível {{ tiers[e.tier].name }}</div>
                  <p class="item-desc">{{ achDesc(a, e.tier) }}</p>
                  <p class="muted src">+{{ tiers[e.tier].gold }} ouro@if (tiers[e.tier].crystals) { · +{{ tiers[e.tier].crystals }} cristais }@if (e.tier === 4) { · Título "{{ a.name }}" }</p>
                </div>
              }
              <button class="btn block gold" (click)="dismiss()">Coletar</button>
            </aw-system-window>
          </div>
        }
        @case ('system') {
          <div class="backdrop" (click)="dismiss()">
            <aw-system-window class="win" [header]="e.title" [tone]="e.tone ?? 'blue'" (click)="$event.stopPropagation()">
              <p class="msg">{{ e.message }}</p>
              <button class="btn block" [class.danger]="e.tone === 'red'" (click)="dismiss()">Entendido</button>
            </aw-system-window>
          </div>
        }
      }
    }
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 30000; pointer-events: none; }
    :host > * { pointer-events: auto; }
    .floats { position: absolute; left: 0; right: 0; top: calc(env(safe-area-inset-top) + 120px); display: flex; flex-direction: column; align-items: center; pointer-events: none !important; }
    .float { display: flex; gap: 6px; animation: rise 1.3s cubic-bezier(.2,.8,.2,1) both; }
    .float .chip { font-size: .95rem; padding: 6px 12px; background: rgba(8,16,32,.92); box-shadow: 0 0 16px rgba(92,200,255,.35); }
    @keyframes rise { 0% { opacity: 0; transform: translateY(40px) scale(.9); } 20% { opacity: 1; transform: translateY(0) scale(1); } 75% { opacity: 1; } 100% { opacity: 0; transform: translateY(-90px) scale(.85); } }

    .backdrop { position: absolute; inset: 0; background: rgba(2,4,10,.72); display: grid; place-items: center; padding: 24px; animation: fade .2s ease both; }
    .win { width: 100%; max-width: 380px; }
    .msg { margin: 0 0 18px; line-height: 1.5; text-align: center; color: var(--text-primary); }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }

    .item { text-align: center; margin-bottom: 16px; }
    .item-icon { width: 84px; height: 84px; margin: 4px auto 12px; display: grid; place-items: center; font-size: 2.6rem; color: var(--rc);
      border: 2px solid var(--rc); border-radius: 16px; background: color-mix(in srgb, var(--rc) 14%, transparent);
      box-shadow: 0 0 22px color-mix(in srgb, var(--rc) 45%, transparent); }
    .item-icon.medal { border: 0; border-radius: 0; clip-path: polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%); background: color-mix(in srgb, var(--rc) 28%, #0b1220); }
    .item-icon.pulse { animation: pulse 1.6s ease-in-out infinite; }
    @keyframes pulse { 50% { box-shadow: 0 0 40px color-mix(in srgb, var(--rc) 75%, transparent); } }
    .item-name { font-family: var(--font-display); font-weight: 700; font-size: 1.4rem; letter-spacing: .04em; color: var(--rc); }
    .item-meta { font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .1em; margin-top: 2px; }
    .item-desc { margin: 10px 0 0; }
    .src { font-size: .78rem; margin: 6px 0 0; }

    .full { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; overflow: hidden; animation: fade .25s ease both; padding: 24px; }
    .levelup { background: radial-gradient(circle at 50% 45%, rgba(20,50,100,.92), rgba(2,4,10,.97) 65%); }
    .rankup { background: radial-gradient(circle at 50% 45%, rgba(58,28,113,.95), rgba(2,4,10,.97) 65%); }
    .lv-content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; max-width: 360px; }
    .lv-tag { font-family: var(--font-display); font-weight: 700; letter-spacing: .2em; color: var(--system-blue); }
    .lv-title { font-family: var(--font-display); font-weight: 700; font-size: 2.4rem; letter-spacing: .12em; color: var(--system-cyan);
      text-shadow: 0 0 24px rgba(92,200,255,.8); animation: pop .5s cubic-bezier(.2,1.4,.4,1) both; }
    .lv-num { font-size: 5.5rem; font-weight: 600; line-height: 1; color: #fff; text-shadow: 0 0 40px rgba(92,200,255,.9); animation: pop .6s .15s cubic-bezier(.2,1.4,.4,1) both; }
    .lv-line { font-style: italic; color: var(--system-cyan); margin: 8px 0 0; }
    .lv-pts { color: var(--text-muted); font-size: .9rem; margin: 4px 0 14px; }
    .lv-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
    .skip { font-size: .75rem; color: var(--text-muted); margin-top: 10px; }
    @keyframes pop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
    .rings { position: absolute; inset: 0; display: grid; place-items: center; }
    .rings i { position: absolute; width: 160px; height: 160px; border-radius: 50%; border: 2px solid rgba(92,200,255,.7);
      animation: ring 1.8s ease-out infinite; opacity: 0; }
    .rings i:nth-child(2) { animation-delay: .6s; }
    .rings i:nth-child(3) { animation-delay: 1.2s; }
    @keyframes ring { from { transform: scale(.4); opacity: .9; } to { transform: scale(3.2); opacity: 0; } }
  `,
})
export class EventOverlayComponent {
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastController);

  readonly floats = signal<Float[]>([]);
  readonly announce = signal('');
  readonly current = computed<GameEvent | null>(() => {
    const e = this.store.events()[0];
    return e && e.kind !== 'reward' ? e : null;
  });
  readonly line = signal(SYSTEM_LINES.levelUp[0]);
  private seq = 0;
  private undoToast?: HTMLIonToastElement;

  constructor() {
    // Recompensas não bloqueiam: viram chips flutuantes e saem da fila.
    effect(() => {
      const e = this.store.events()[0];
      if (!e || e.kind !== 'reward') return;
      untracked(() => {
        const f = { id: ++this.seq, xp: e.xp, gold: e.gold };
        this.floats.update((l) => [...l, f]);
        this.announce.set(`Missão concluída, mais ${e.xp} XP e ${e.gold} de ouro`);
        setTimeout(() => this.floats.update((l) => l.filter((x) => x.id !== f.id)), 1400);
        this.store.dismissEvent();
        if (this.store.canUndo()) this.showUndo();
      });
    });
    effect(() => {
      if (this.current()?.kind === 'levelup') {
        untracked(() => this.line.set(SYSTEM_LINES.levelUp[Math.floor(Math.random() * SYSTEM_LINES.levelUp.length)]));
      }
    });
  }

  private async showUndo(): Promise<void> {
    await this.undoToast?.dismiss().catch(() => {});
    this.undoToast = await this.toasts.create({
      message: 'Missão concluída',
      duration: 5000,
      position: 'bottom',
      positionAnchor: 'aw-tabbar',
      cssClass: 'sys-toast',
      buttons: [{ text: 'Desfazer', role: 'undo', handler: () => this.store.undo() }],
    });
    await this.undoToast.present();
  }

  dismiss(): void {
    this.store.dismissEvent();
  }

  goProfile(ev: Event): void {
    ev.stopPropagation();
    this.store.dismissEvent();
    this.router.navigateByUrl('/perfil');
  }

  item(id: string) {
    return ITEM_MAP[id];
  }
  readonly tiers = TIERS;
  ach(id: string) {
    return ACHIEVEMENT_MAP[id];
  }
  achDesc = tierDescription;
  rarity(r: keyof typeof RARITY) {
    return RARITY[r];
  }
  typeLabel(t: keyof typeof ITEM_TYPE_LABEL) {
    return ITEM_TYPE_LABEL[t];
  }
  itemTone(id: string): 'blue' | 'violet' | 'gold' {
    const r = ITEM_MAP[id]?.rarity;
    return r === 'legendary' || r === 'mythic' ? 'gold' : r === 'epic' ? 'violet' : 'blue';
  }
}
