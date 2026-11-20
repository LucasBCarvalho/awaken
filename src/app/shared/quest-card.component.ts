import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding } from '@ionic/angular';
import { Quest } from '../core/models';
import { ATTRIBUTES, DIFFICULTY, SKILL_COST } from '../core/rules';
import { GameStore } from '../core/game.store';

@Component({
  selector: 'aw-quest-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItemSliding, IonItem, IonItemOptions, IonItemOption, IonIcon],
  template: `
    <ion-item-sliding #sl [disabled]="!pending()">
      <ion-item-options side="start" (ionSwipe)="complete(sl)">
        <ion-item-option color="success" expandable (click)="complete(sl)">
          <ion-icon slot="top" name="checkmark" /> Concluir
        </ion-item-option>
      </ion-item-options>

      <ion-item lines="none" class="qitem" [detail]="false">
        <div class="qcard" [class.done]="quest().status === 'done'" [class.skipped]="quest().status === 'skipped'" [style.--ac]="attr().color">
          <button class="check" type="button" (click)="tapCheck()" [disabled]="!pending()"
            [attr.aria-label]="checkLabel()">
            @if (quest().status === 'done') {
              <ion-icon name="checkmark" />
            } @else if (quest().status === 'skipped') {
              <ion-icon name="time" />
            } @else if (quest().checks) {
              <span class="step">{{ quest().progress }}/{{ quest().target }}</span>
            } @else if (quest().target > 1) {
              <span class="step">+{{ step() }}</span>
            }
            <svg class="ring" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="16" />
              <circle class="arc" cx="18" cy="18" r="16" [style.stroke-dashoffset]="100 - ratio() * 100" [style.opacity]="ratio() > 0 ? 1 : 0" pathLength="100" />
            </svg>
          </button>

          <div class="main" role="button" tabindex="0" (click)="open.emit(quest())" (keydown.enter)="open.emit(quest())"
            [attr.aria-label]="'Abrir detalhes de ' + quest().title">
            <div class="title">{{ quest().title }}
              @if (quest().templateId) { <span class="guide"><ion-icon name="book" /> guia</span> }
            </div>
            <div class="chips">
              <span class="chip">+{{ reward().xp }} XP</span>
              <span class="chip gold">+{{ reward().gold }} ouro</span>
              <span class="chip attr"><ion-icon [name]="attr().icon" />{{ quest().attribute }}</span>
              <span class="chip diff">{{ diff().label }}</span>
            </div>
            @if (quest().target > 1) {
              <div class="prog">
                <div class="track"><div class="fill" [style.transform]="'scaleX(' + ratio() + ')'"></div></div>
                <span class="num">{{ quest().progress }}/{{ quest().target }} {{ quest().unit }}</span>
              </div>
            }
            @if (quest().status === 'skipped') {
              <div class="note">Adiada com Mana, sem penalidade</div>
            }
          </div>
        </div>
      </ion-item>

      <ion-item-options side="end">
        @if (quest().type === 'daily') {
          <ion-item-option color="medium" (click)="postpone(sl)">
            <ion-icon slot="top" name="time" /> Adiar ({{ cost }} MP)
          </ion-item-option>
        }
        <ion-item-option (click)="edit.emit(quest()); sl.close()">
          <ion-icon slot="top" name="create" /> Editar
        </ion-item-option>
        <ion-item-option color="danger" (click)="remove.emit(quest()); sl.close()">
          <ion-icon slot="top" name="trash" /> Excluir
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  `,
  styles: `
    :host { display: block; margin-bottom: 10px; }
    ion-item-sliding { border-radius: 14px; overflow: hidden; }
    .qitem { --padding-start: 0; --inner-padding-end: 0; --background: transparent; --min-height: 0; }
    ion-item-option { font-family: var(--font-display); font-weight: 700; letter-spacing: .04em; min-width: 84px; }
    .qcard { width: 100%; display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px;
      background: var(--bg-surface); border: 1px solid rgba(47,139,255,.16); border-left: 3px solid var(--ac); border-radius: 14px;
      transition: opacity .25s ease; }
    .qcard.done, .qcard.skipped { opacity: .5; }
    .qcard.done .title { text-decoration: line-through; text-decoration-color: var(--text-muted); }
    .check { position: relative; flex: none; width: 44px; height: 44px; border-radius: 50%; border: 0; background: transparent;
      color: var(--system-cyan); display: grid; place-items: center; font-size: 1.2rem; cursor: pointer; padding: 0; }
    .check:active { transform: scale(.92); }
    .check ion-icon, .step { position: relative; z-index: 1; }
    .step { font-family: var(--font-mono); font-size: .72rem; font-weight: 600; }
    .ring { position: absolute; inset: 0; transform: rotate(-90deg); }
    .ring circle { fill: none; stroke: rgba(47,139,255,.35); stroke-width: 2.5; }
    .ring .arc { stroke: var(--system-glow); stroke-dasharray: 100; stroke-linecap: round; transition: stroke-dashoffset .4s ease; }
    .done .check { color: var(--success); }
    .done .ring .arc { stroke: var(--success); }
    .main { flex: 1; min-width: 0; }
    .title { font-weight: 600; font-size: 1rem; line-height: 1.3; margin: 2px 0 8px; overflow-wrap: anywhere; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .main { cursor: pointer; }
    .guide { display: inline-flex; align-items: center; gap: 3px; margin-left: 6px; vertical-align: 2px; font-family: var(--font-display); font-weight: 700;
      font-size: .66rem; letter-spacing: .08em; text-transform: uppercase; color: var(--system-blue); text-decoration: none; }
    .chip.attr { color: var(--ac); border-color: color-mix(in srgb, var(--ac) 40%, transparent); background: color-mix(in srgb, var(--ac) 12%, transparent); }
    .chip.diff { color: var(--text-muted); background: transparent; }
    .prog { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
    .track { flex: 1; height: 5px; border-radius: 99px; background: rgba(255,255,255,.07); overflow: hidden; }
    .fill { height: 100%; transform-origin: left; background: linear-gradient(90deg, var(--system-blue), var(--system-glow)); transition: transform .4s ease; }
    .num { font-family: var(--font-mono); font-size: .75rem; color: var(--text-muted); white-space: nowrap; }
    .note { font-size: .75rem; color: var(--text-muted); margin-top: 6px; }
  `,
})
export class QuestCardComponent {
  private readonly store = inject(GameStore);
  readonly quest = input.required<Quest>();
  readonly edit = output<Quest>();
  readonly remove = output<Quest>();
  readonly open = output<Quest>();
  readonly cost = SKILL_COST.postpone;

  readonly pending = computed(() => this.quest().status === 'pending');
  readonly attr = computed(() => ATTRIBUTES[this.quest().attribute]);
  readonly diff = computed(() => DIFFICULTY[this.quest().difficulty]);
  readonly reward = computed(() => {
    this.store.state(); // recalcula com bônus/streak
    return this.store.previewReward(this.quest());
  });
  readonly ratio = computed(() => {
    const q = this.quest();
    return q.status === 'done' ? 1 : q.progress / q.target;
  });
  readonly step = computed(() => {
    const t = this.quest().target;
    return t >= 40 ? 10 : t >= 15 ? 5 : 1;
  });
  readonly checkLabel = computed(() => {
    const q = this.quest();
    if (q.status !== 'pending') return `${q.title}: concluída`;
    if (q.checks) return `Abrir checklist de ${q.title}. ${q.progress} de ${q.target} etapas`;
    return q.target > 1 ? `Adicionar ${this.step()} a ${q.title}. Progresso ${q.progress} de ${q.target}` : `Concluir ${q.title}`;
  });

  tapCheck(): void {
    const q = this.quest();
    if (q.checks) this.open.emit(q);
    else if (q.target > 1) this.store.increment(q.id, this.step());
    else this.store.complete(q.id);
  }

  complete(sl: IonItemSliding): void {
    this.store.complete(this.quest().id);
    sl.close();
  }

  postpone(sl: IonItemSliding): void {
    this.store.postpone(this.quest().id);
    sl.close();
  }
}
