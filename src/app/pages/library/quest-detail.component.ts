import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { ATTRIBUTES, DIFFICULTY, TYPE_LABEL } from '../../core/rules';
import { LEVEL_LABEL, LIBRARY_MAP, hasLevels } from '../../core/library';
import { GuideViewComponent } from '../../shared/guide-view.component';

@Component({
  selector: 'aw-quest-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, GuideViewComponent],
  template: `
    <ion-content>
      @if (quest(); as q) {
        <div class="wrap" [style.--ac]="info[q.attribute].color">
          <header class="top">
            <span class="chip attr">{{ q.attribute }} · {{ info[q.attribute].name }}</span>
            <button class="x" type="button" (click)="close()" aria-label="Fechar"><ion-icon name="close" /></button>
          </header>
          <h2 class="title">{{ q.title }}</h2>
          <div class="chips">
            <span class="chip">{{ typeLabel[q.type] }}</span>
            <span class="chip">{{ diff(q.difficulty) }}</span>
            @if (template() && q.level && multi()) { <span class="chip violet">{{ levelLabel[q.level] }}</span> }
            <span class="chip">+{{ reward().xp }} XP</span>
            <span class="chip gold">+{{ reward().gold }} ouro</span>
          </div>

          @if (q.status !== 'pending') {
            <div class="status" [class.ok]="q.status === 'done'">
              <ion-icon [name]="q.status === 'done' ? 'checkmark-circle' : 'time'" />
              {{ q.status === 'done' ? 'Missão concluída neste período.' : q.status === 'skipped' ? 'Adiada sem penalidade.' : 'Falhou no período anterior.' }}
            </div>
          }

          @if (q.target > 1) {
            <div class="prog">
              <div class="track"><div class="fill" [style.transform]="'scaleX(' + ratio() + ')'"></div></div>
              <span class="num">{{ q.progress }}/{{ q.target }} {{ q.unit }}</span>
            </div>
          }

          @if (template(); as t) {
            <p class="sum">{{ t.summary }}</p>
            <aw-guide-view [template]="t" [level]="q.level ?? 1" [checks]="q.checks ?? null" [readonly]="q.status !== 'pending'" (toggle)="store.toggleCheck(q.id, $event)" />
          } @else {
            <p class="muted sum">Missão personalizada. Para ter um guia passo a passo, use uma missão da Biblioteca.</p>
          }

          @if (q.status === 'pending') {
            <div class="cta">
              @if (!q.checks && q.target > 1) {
                <div class="counter">
                  <button class="btn ghost" type="button" (click)="store.increment(q.id, 1)">+1</button>
                  @if (step() > 1) { <button class="btn ghost" type="button" (click)="store.increment(q.id, step())">+{{ step() }}</button> }
                  <button class="btn" type="button" (click)="finish()">Concluir</button>
                </div>
              } @else if (q.checks) {
                <button class="btn ghost block" type="button" (click)="finish()">Marcar tudo como feito</button>
              } @else {
                <button class="btn block" type="button" (click)="finish()">Concluir missão</button>
              }
            </div>
          }
        </div>
      }
    </ion-content>
  `,
  styles: `
    .wrap { padding: 8px 16px calc(24px + env(safe-area-inset-bottom)); }
    .top { display: flex; justify-content: space-between; align-items: center; margin: 10px 0 6px; }
    .x { width: 44px; height: 44px; border: 0; background: transparent; color: var(--text-muted); font-size: 1.5rem; }
    .chip.attr { color: var(--ac); border-color: color-mix(in srgb, var(--ac) 40%, transparent); background: color-mix(in srgb, var(--ac) 12%, transparent); }
    .title { font-family: var(--font-display); font-weight: 700; font-size: 1.5rem; letter-spacing: .02em; margin: 0 0 8px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .status { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.05); color: var(--text-muted); }
    .status.ok { color: var(--success); background: rgba(61,220,151,.1); }
    .prog { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
    .track { flex: 1; height: 8px; border-radius: 99px; background: rgba(255,255,255,.07); overflow: hidden; }
    .fill { height: 100%; transform-origin: left; background: linear-gradient(90deg, var(--system-blue), var(--system-glow)); transition: transform .4s ease; }
    .num { font-family: var(--font-mono); font-size: .85rem; color: var(--text-muted); }
    .sum { color: #c8d6ec; line-height: 1.5; margin: 14px 0 0; }
    .cta { position: sticky; bottom: 0; padding: 16px 0 4px; background: linear-gradient(transparent, var(--bg-surface) 30%); }
    .counter { display: flex; gap: 8px; }
    .counter .btn { flex: 1; }
  `,
})
export class QuestDetailComponent {
  protected readonly store = inject(GameStore);
  private readonly modalCtrl = inject(ModalController);

  readonly questId = input.required<string>();
  readonly info = ATTRIBUTES;
  readonly typeLabel = TYPE_LABEL;
  readonly levelLabel = LEVEL_LABEL;

  readonly quest = computed(() => this.store.state().quests.find((q) => q.id === this.questId()) ?? null);
  readonly template = computed(() => {
    const id = this.quest()?.templateId;
    return id ? LIBRARY_MAP[id] ?? null : null;
  });
  readonly multi = computed(() => !!this.template() && hasLevels(this.template()!));
  readonly reward = computed(() => {
    this.store.state();
    const q = this.quest();
    return q ? this.store.previewReward(q) : { xp: 0, gold: 0 };
  });
  readonly ratio = computed(() => {
    const q = this.quest();
    return q ? (q.status === 'done' ? 1 : q.progress / q.target) : 0;
  });
  readonly step = computed(() => {
    const t = this.quest()?.target ?? 1;
    return t >= 40 ? 10 : t >= 15 ? 5 : 1;
  });

  diff(d: keyof typeof DIFFICULTY): string {
    return DIFFICULTY[d].label;
  }

  finish(): void {
    this.store.complete(this.questId());
    this.modalCtrl.dismiss();
  }

  close(): void {
    this.modalCtrl.dismiss();
  }
}
