import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { AttributeKey, Difficulty, Quest, QuestType } from '../../core/models';
import { ATTRIBUTES, ATTRIBUTE_KEYS, DIFFICULTY, TYPE_LABEL, TYPE_MULT } from '../../core/rules';
import { quickParse } from '../../core/quick-parse';

@Component({
  selector: 'aw-quest-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon],
  template: `
    <ion-content>
      <div class="sheet">
        <header class="top">
          <h2 class="display">{{ quest() ? 'Editar missão' : 'Nova missão' }}</h2>
          <button class="x" type="button" (click)="close()" aria-label="Fechar"><ion-icon name="close" /></button>
        </header>

        @if (!quest()) {
          <label class="field quick">
            <span>Criação rápida</span>
            <div class="qrow">
              <input #q type="text" placeholder="ex.: correr 5 km toda terça e quinta" [value]="quick()" (input)="quick.set(q.value)"
                (keydown.enter)="applyQuick()" enterkeyhint="go" />
              <button class="btn sm" type="button" (click)="applyQuick()" [disabled]="!quick().trim()">
                <ion-icon name="sparkles" />
              </button>
            </div>
            @if (parsedHint()) { <small class="hint">{{ parsedHint() }}</small> }
          </label>
        }

        <label class="field">
          <span>Título</span>
          <input #t type="text" maxlength="60" placeholder="O que você vai fazer?" [value]="title()" (input)="title.set(t.value)" />
        </label>

        <div class="field">
          <span>Ciclo</span>
          <div class="choice-row">
            @for (ty of types; track ty) {
              <button type="button" class="choice" [class.on]="type() === ty" (click)="type.set(ty)" [disabled]="!!quest()">{{ typeLabel[ty] }}</button>
            }
          </div>
        </div>

        @if (type() === 'daily') {
          <div class="field">
            <span>Dias ativos</span>
            <div class="choice-row days">
              @for (d of dayNames; track $index) {
                <button type="button" class="choice" [class.on]="weekdays().includes($index)" (click)="toggleDay($index)"
                  [attr.aria-pressed]="weekdays().includes($index)">{{ d }}</button>
              }
            </div>
          </div>
        }

        <div class="field">
          <span>Atributo</span>
          <div class="choice-row">
            @for (a of attrs; track a) {
              <button type="button" class="choice attr" [class.on]="attribute() === a" [style.--ac]="attrInfo[a].color" (click)="attribute.set(a)">
                <ion-icon [name]="attrInfo[a].icon" /> {{ a }}
              </button>
            }
          </div>
          <small class="hint">{{ attrInfo[attribute()].name }} · {{ attrInfo[attribute()].area }}</small>
        </div>

        <div class="grid2">
          <label class="field">
            <span>Meta</span>
            <input #tg type="number" inputmode="numeric" min="1" max="9999" [value]="target()" (input)="target.set(+tg.value || 1)" />
          </label>
          <label class="field">
            <span>Unidade</span>
            <input #u type="text" maxlength="12" placeholder="pág., min, km…" [value]="unit()" (input)="unit.set(u.value)" />
          </label>
        </div>

        <div class="field">
          <span>Dificuldade</span>
          <div class="choice-row">
            @for (d of diffs; track d) {
              <button type="button" class="choice" [class.on]="difficulty() === d" (click)="difficulty.set(d)" [disabled]="d === 'epic' && !allowEpic()">
                {{ diffInfo[d].label }}
              </button>
            }
          </div>
          <small class="hint">Sugestão do Sistema: <b>{{ diffInfo[suggested()].label }}</b> · Recompensa: <span class="num">+{{ xpPreview() }} XP</span></small>
        </div>

        <button class="btn block" type="button" (click)="save()" [disabled]="!valid()">
          {{ quest() ? 'Salvar' : 'Criar missão' }}
        </button>
      </div>
    </ion-content>
  `,
  styles: `
    .sheet { padding: 8px 18px calc(24px + env(safe-area-inset-bottom)); }
    .top { display: flex; justify-content: space-between; align-items: center; margin: 10px 0 12px; }
    h2 { margin: 0; font-size: 1.35rem; color: var(--system-cyan); }
    .x { width: 44px; height: 44px; border: 0; background: transparent; color: var(--text-muted); font-size: 1.5rem; }
    .qrow { display: flex; gap: 8px; }
    .qrow input { flex: 1; }
    .qrow .btn { min-height: 48px; width: 52px; padding: 0; font-size: 1.2rem; }
    .quick input { border-color: rgba(123, 63, 228, .5); }
    .hint { display: block; color: var(--text-muted); margin-top: 6px; font-size: .8rem; }
    .days .choice { flex: 1; padding: 0; min-width: 40px; }
    .choice.attr.on { border-color: var(--ac); background: color-mix(in srgb, var(--ac) 18%, transparent); box-shadow: none; }
    .choice ion-icon { vertical-align: -2px; }
    .choice:disabled { opacity: .35; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `,
})
export class QuestEditorComponent implements OnInit {
  private readonly store = inject(GameStore);
  private readonly modalCtrl = inject(ModalController);

  readonly quest = input<Quest | null>(null);
  readonly initialType = input<QuestType>('daily');

  readonly types: QuestType[] = ['daily', 'weekly', 'monthly', 'todo'];
  readonly typeLabel = TYPE_LABEL;
  readonly attrs = ATTRIBUTE_KEYS;
  readonly attrInfo = ATTRIBUTES;
  readonly diffs: Difficulty[] = ['trivial', 'easy', 'medium', 'hard', 'epic'];
  readonly diffInfo = DIFFICULTY;
  readonly dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  readonly quick = signal('');
  readonly parsedHint = signal('');
  readonly title = signal('');
  readonly type = signal<QuestType>('daily');
  readonly attribute = signal<AttributeKey>('AGI');
  readonly difficulty = signal<Difficulty>('easy');
  readonly target = signal(1);
  readonly unit = signal('');
  readonly weekdays = signal<number[]>([0, 1, 2, 3, 4, 5, 6]);
  private difficultyTouched = false;

  readonly suggested = computed(() => this.store.suggestDifficulty(this.title(), this.target(), this.unit()));
  /** Anti-farm: Épica só em semanais, mensais ou avulsas. */
  readonly allowEpic = computed(() => this.type() !== 'daily');
  readonly xpPreview = computed(() => Math.round(DIFFICULTY[this.difficulty()].xp * TYPE_MULT[this.type()]));
  readonly valid = computed(() => this.title().trim().length > 0 && this.target() >= 1 && (this.type() !== 'daily' || this.weekdays().length > 0));

  ngOnInit(): void {
    const q = this.quest();
    if (q) {
      this.title.set(q.title);
      this.type.set(q.type);
      this.attribute.set(q.attribute);
      this.difficulty.set(q.difficulty);
      this.target.set(q.target);
      this.unit.set(q.unit);
      this.weekdays.set([...q.weekdays]);
      this.difficultyTouched = true;
    } else {
      this.type.set(this.initialType());
    }
  }

  applyQuick(): void {
    if (!this.quick().trim()) return;
    const p = quickParse(this.quick());
    this.title.set(p.title);
    this.type.set(p.type);
    this.weekdays.set(p.weekdays);
    this.target.set(p.target);
    this.unit.set(p.unit);
    this.attribute.set(p.attribute);
    if (!this.difficultyTouched) this.difficulty.set(this.store.suggestDifficulty(p.title, p.target, p.unit));
    const days = p.type === 'daily' && p.weekdays.length < 7 ? ' · ' + p.weekdays.map((d) => ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d]).join(', ') : '';
    this.parsedHint.set(`Entendido: ${TYPE_LABEL[p.type]}${days} · ${p.attribute}${p.target > 1 ? ` · ${p.target} ${p.unit}` : ''}`);
  }

  toggleDay(d: number): void {
    this.weekdays.update((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d].sort()));
  }

  save(): void {
    if (!this.valid()) return;
    const data = {
      title: this.title().trim(),
      attribute: this.attribute(),
      difficulty: this.difficulty() === 'epic' && !this.allowEpic() ? 'hard' : this.difficulty(),
      target: Math.max(1, Math.round(this.target())),
      unit: this.unit().trim(),
      weekdays: this.type() === 'daily' ? this.weekdays() : [0, 1, 2, 3, 4, 5, 6],
    } as const;
    const q = this.quest();
    if (q) this.store.updateQuest(q.id, data);
    else this.store.addQuest({ ...data, type: this.type() });
    this.modalCtrl.dismiss(true);
  }

  close(): void {
    this.modalCtrl.dismiss(false);
  }
}
