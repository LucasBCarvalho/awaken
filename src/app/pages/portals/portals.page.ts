import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { RANKS, nextRank, rankIndex } from '../../core/rules';
import { SystemWindowComponent } from '../../shared/system-window.component';
import { RankBadgeComponent } from '../../shared/rank-badge.component';

@Component({
  selector: 'aw-portals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, SystemWindowComponent, RankBadgeComponent],
  template: `
    <ion-content>
      <div class="page top">
        <h1 class="page-title">Portais</h1>

        @if (next(); as nr) {
          <aw-system-window header="EXAME DE PROMOÇÃO" tone="violet" [animate]="false">
            <div class="exam-head">
              <aw-rank-badge [rank]="s().rank" [size]="48" />
              <ion-icon name="chevron-forward" class="arrow" />
              <aw-rank-badge [rank]="nr.rank" [size]="48" />
            </div>
            @switch (examState()) {
              @case ('locked') {
                <p class="c">Requer nível <b>{{ nr.minLevel }}</b>. Você está no nível {{ s().level }}.</p>
                <div class="lvbar"><i [style.transform]="'scaleX(' + lvRatio() + ')'"></i></div>
              }
              @case ('ready') {
                <p class="c">Desafio de 7 dias: <b>100% das Diárias</b> todos os dias + <b>1 missão Épica</b>.<br /><span class="muted">Falhar não tira nada; você pode tentar de novo em 3 dias.</span></p>
                <button class="btn block" type="button" (click)="store.startExam()">Iniciar Exame</button>
              }
              @case ('active') {
                <div class="exam-days">
                  @for (d of [0, 1, 2, 3, 4, 5, 6]; track d) {
                    <i [class.ok]="d < s().exam!.perfectDays"></i>
                  }
                </div>
                <p class="c num">{{ s().exam!.perfectDays }}/7 dias perfeitos</p>
                <p class="c">Missão Épica: @if (s().exam!.epicDone) { <b class="ok">concluída</b> } @else { <b class="pend">pendente</b> (veja em Avulsas) }</p>
              }
              @case ('cooldown') {
                <p class="c">Nova tentativa disponível em <b>{{ retry() }}</b>.</p>
              }
            }
            <p class="muted sm c">Desbloqueia: {{ nr.unlock }}</p>
          </aw-system-window>
        } @else {
          <aw-system-window header="RANK MÁXIMO" tone="gold"><p class="c">Você alcançou o Rank S.</p></aw-system-window>
        }

        <div class="section-label">Dungeons</div>
        <div class="portal-card" [class.locked]="dungeonsLocked()">
          <div class="vortex glow-fx" aria-hidden="true"></div>
          <div class="pinfo">
            <b class="display">Portais de projeto</b>
            <p>Transforme um projeto grande em uma Dungeon com andares (etapas), prazo e um Chefe final com barra de HP.</p>
            @if (dungeonsLocked()) {
              <span class="chip violet"><ion-icon name="lock-closed" /> Desbloqueia no Rank C</span>
            } @else {
              <span class="chip">Em breve</span>
            }
          </div>
        </div>

        <div class="section-label">Ranks</div>
        <div class="ranks">
          @for (r of ranks; track r.rank) {
            <div class="rk" [class.cur]="r.rank === s().rank" [class.past]="idx(r.rank) < idx(s().rank)">
              <aw-rank-badge [rank]="r.rank" [size]="38" />
              <div><b>Rank {{ r.rank }}</b><span class="muted sm"> &middot; nível {{ r.minLevel }}+</span><br /><small class="muted">{{ r.unlock }}</small></div>
            </div>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .top { padding-top: calc(env(safe-area-inset-top) + 12px); }
    .c { text-align: center; line-height: 1.5; margin: 8px 0; } .sm { font-size: .78rem; }
    .exam-head { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 6px; }
    .arrow { font-size: 1.4rem; color: #b48cff; }
    .lvbar { height: 6px; border-radius: 3px; background: rgba(123,63,228,.18); overflow: hidden; margin: 8px 0; }
    .lvbar i { display: block; height: 100%; transform-origin: left; background: linear-gradient(90deg, #3a1c71, #9d7bff); }
    .exam-days { display: flex; gap: 6px; justify-content: center; margin: 10px 0 4px; }
    .exam-days i { width: 30px; height: 30px; border-radius: 6px; border: 1px solid rgba(123,63,228,.5); background: rgba(123,63,228,.08); }
    .exam-days i.ok { background: #7b3fe4; box-shadow: 0 0 10px #7b3fe4; }
    .ok { color: var(--success); } .pend { color: var(--gold); }
    .portal-card { position: relative; display: flex; gap: 14px; align-items: center; padding: 16px; border-radius: 16px; overflow: hidden;
      background: linear-gradient(135deg, rgba(58,28,113,.35), rgba(11,18,32,.9)); border: 1px solid rgba(123,63,228,.4); }
    .portal-card.locked { filter: saturate(.6); }
    .vortex { flex: none; width: 70px; height: 96px; border-radius: 50%;
      background: radial-gradient(ellipse, rgba(166,240,255,.9), rgba(47,139,255,.6) 30%, rgba(123,63,228,.5) 55%, transparent 72%);
      animation: v 4s ease-in-out infinite; }
    @keyframes v { 50% { transform: scale(1.08) rotate(4deg); } }
    .pinfo p { margin: 6px 0 10px; font-size: .85rem; color: var(--text-muted); }
    .ranks { display: flex; flex-direction: column; gap: 8px; }
    .rk { display: flex; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 12px; background: var(--bg-surface); border: 1px solid rgba(47,139,255,.12); }
    .rk.cur { border-color: var(--system-glow); box-shadow: 0 0 14px rgba(47,139,255,.25); }
    .rk.past { opacity: .55; }
  `,
})
export class PortalsPage {
  protected readonly store = inject(GameStore);
  readonly s = this.store.state;
  readonly ranks = RANKS;
  readonly next = computed(() => nextRank(this.s().rank));
  readonly dungeonsLocked = computed(() => rankIndex(this.s().rank) < 2);
  readonly lvRatio = computed(() => {
    const nr = this.next();
    return nr ? Math.min(1, this.s().level / nr.minLevel) : 1;
  });
  readonly examState = computed<'locked' | 'ready' | 'active' | 'cooldown'>(() => {
    const s = this.s();
    const nr = this.next();
    if (!nr || s.level < nr.minLevel) return 'locked';
    if (s.exam?.status === 'active') return 'active';
    if (s.exam?.status === 'failed' && s.exam.retryAfter && s.exam.retryAfter > this.store.today()) return 'cooldown';
    return 'ready';
  });
  readonly retry = computed(() => {
    const r = this.s().exam?.retryAfter;
    return r ? new Date(r + 'T12:00:00').toLocaleDateString('pt-BR') : '';
  });

  idx(r: Parameters<typeof rankIndex>[0]): number {
    return rankIndex(r);
  }
}
