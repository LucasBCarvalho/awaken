import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { AttributeKey, QuestType } from '../../core/models';
import { ATTRIBUTES, ATTRIBUTE_KEYS, DIFFICULTY, TYPE_LABEL, TYPE_MULT } from '../../core/rules';
import { LEVEL_LABEL, LIBRARY, Level, LibraryTemplate, hasLevels, resolveTemplate } from '../../core/library';
import { GuideViewComponent } from '../../shared/guide-view.component';

type AttrFilter = 'ALL' | AttributeKey;
const PLURAL: Record<QuestType, string> = { daily: 'Diárias', weekly: 'Semanais', monthly: 'Mensais', todo: 'missões Avulsas' };

@Component({
  selector: 'aw-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, GuideViewComponent],
  template: `
    <ion-content>
      <div class="wrap">
        @if (!selected()) {
          <header class="top">
            <h2 class="display">Biblioteca de missões</h2>
            <button class="x" type="button" (click)="close()" aria-label="Fechar"><ion-icon name="close" /></button>
          </header>

          <button class="sys" type="button" (click)="askSystem()">
            <ion-icon name="sparkles" />
            <span><b>Sistema, escolha por mim</b><small>Sugere missões para seus atributos mais baixos</small></span>
            <ion-icon name="chevron-forward" />
          </button>

          <div class="filters" role="tablist">
            <button type="button" class="choice" [class.on]="attr() === 'ALL'" (click)="attr.set('ALL')">Todas</button>
            @for (a of attrs; track a) {
              <button type="button" class="choice" [class.on]="attr() === a" [style.--ac]="info[a].color" (click)="attr.set(a)">
                <ion-icon [name]="info[a].icon" /> {{ info[a].name }}
              </button>
            }
          </div>

          @for (g of groups(); track g.key) {
            <div class="section-label">{{ g.label }}</div>
            @for (t of g.items; track t.id) {
              <button type="button" class="tcard" [style.--ac]="info[t.attribute].color" (click)="open(t)">
                <span class="ticon"><ion-icon [name]="info[t.attribute].icon" /></span>
                <span class="tbody">
                  <b>{{ t.title }}</b>
                  <small>{{ t.summary }}</small>
                  <span class="tchips">
                    <span class="chip">{{ typeLabel[t.type] }}</span>
                    @if (isWorkout(t)) { <span class="chip violet">Passo a passo</span> }
                    @if (multi(t)) { <span class="chip">3 níveis</span> }
                    @if (store.hasTemplate(t.id)) { <span class="chip green">Já na sua lista</span> }
                  </span>
                </span>
                <ion-icon name="chevron-forward" class="chev" />
              </button>
            }
          }
        } @else {
          @let t = selected()!;
          <header class="top">
            <button class="back" type="button" (click)="selected.set(null)"><ion-icon name="chevron-forward" class="flip" /> Voltar</button>
            <button class="x" type="button" (click)="close()" aria-label="Fechar"><ion-icon name="close" /></button>
          </header>

          <div class="dhead" [style.--ac]="info[t.attribute].color">
            <span class="ticon big"><ion-icon [name]="info[t.attribute].icon" /></span>
            <div>
              <h2 class="dtitle">{{ t.title }}</h2>
              <span class="chip attr">{{ t.attribute }} · {{ info[t.attribute].name }}</span>
            </div>
          </div>
          <p class="sum">{{ t.summary }}</p>

          @if (multi(t)) {
            <div class="field">
              <span>Nível</span>
              <div class="choice-row">
                @for (l of levels; track l) {
                  <button type="button" class="choice lv" [class.on]="level() === l" (click)="level.set(l)">
                    {{ levelLabel[l] }}
                    @if (l === store.recommendedLevel()) { <small>recomendado</small> }
                  </button>
                }
              </div>
            </div>
          }

          <div class="field">
            <span>Ciclo</span>
            <div class="choice-row">
              @for (ty of typeOptions(); track ty) {
                <button type="button" class="choice" [class.on]="type() === ty" (click)="type.set(ty)">{{ typeLabel[ty] }}</button>
              }
            </div>
            @if (type() === 'daily' && t.weekdays) {
              <small class="hint">Dias sugeridos: {{ days(t.weekdays) }} (você pode mudar depois em Editar)</small>
            }
          </div>

          <div class="reward">
            <span class="chip">+{{ xp() }} XP</span>
            <span class="chip gold">{{ diffLabel() }}</span>
            @if (resolved().target > 1) { <span class="chip">Meta: {{ resolved().target }} {{ resolved().unit }}</span> }
          </div>

          <aw-guide-view [template]="t" [level]="level()" />

          <div class="cta">
            <button class="btn block" type="button" (click)="add()">
              {{ store.hasTemplate(t.id) ? 'Adicionar outra vez' : 'Aceitar missão' }}
            </button>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .wrap { padding: 8px 16px calc(24px + env(safe-area-inset-bottom)); }
    .top { display: flex; justify-content: space-between; align-items: center; margin: 10px 0 12px; min-height: 44px; }
    h2.display { margin: 0; font-size: 1.3rem; color: var(--system-cyan); }
    .x { width: 44px; height: 44px; border: 0; background: transparent; color: var(--text-muted); font-size: 1.5rem; }
    .back { min-height: 44px; border: 0; background: transparent; color: var(--system-cyan); font-family: var(--font-display); font-weight: 700; font-size: 1rem; letter-spacing: .04em; display: flex; align-items: center; gap: 4px; padding: 0; }
    .flip { transform: rotate(180deg); }
    .sys { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px; text-align: left; font: inherit; color: var(--text-primary);
      border: 1px solid rgba(123,63,228,.6); background: linear-gradient(120deg, rgba(123,63,228,.28), rgba(47,139,255,.12)); box-shadow: 0 0 18px rgba(123,63,228,.25); }
    .sys > ion-icon:first-child { font-size: 1.6rem; color: #c3a6ff; }
    .sys span { flex: 1; display: flex; flex-direction: column; }
    .sys small { color: var(--text-muted); font-size: .8rem; }
    .filters { display: flex; gap: 6px; overflow-x: auto; margin: 14px -16px 0; padding: 0 16px 4px; scrollbar-width: none; }
    .filters .choice { flex: none; min-height: 40px; font-size: .82rem; }
    .filters .choice.on { border-color: var(--ac, var(--system-glow)); }
    .filters ion-icon { vertical-align: -2px; color: var(--ac); }
    .tcard { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px; border-radius: 14px; text-align: left; font: inherit; color: var(--text-primary);
      background: var(--bg-abyss); border: 1px solid rgba(47,139,255,.16); border-left: 3px solid var(--ac); }
    .ticon { flex: none; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 1.3rem; color: var(--ac); background: color-mix(in srgb, var(--ac) 14%, transparent); }
    .ticon.big { width: 54px; height: 54px; font-size: 1.7rem; }
    .tbody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .tbody b { font-size: .98rem; }
    .tbody small { color: var(--text-muted); font-size: .8rem; line-height: 1.35; }
    .tchips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
    .chev { color: var(--text-muted); flex: none; }
    .dhead { display: flex; gap: 12px; align-items: center; }
    .dtitle { font-family: var(--font-display); font-weight: 700; font-size: 1.35rem; letter-spacing: .02em; margin: 0 0 4px; }
    .chip.attr { color: var(--ac); border-color: color-mix(in srgb, var(--ac) 40%, transparent); background: color-mix(in srgb, var(--ac) 12%, transparent); }
    .sum { color: #c8d6ec; line-height: 1.5; margin: 12px 0 16px; }
    .choice.lv { flex: 1; display: flex; flex-direction: column; justify-content: center; line-height: 1.1; padding: 6px 4px; }
    .choice.lv small { font-family: var(--font-body); font-size: .62rem; color: var(--success); text-transform: none; letter-spacing: 0; margin-top: 2px; }
    .hint { display: block; color: var(--text-muted); margin-top: 6px; font-size: .8rem; }
    .reward { display: flex; flex-wrap: wrap; gap: 6px; }
    .cta { position: sticky; bottom: 0; padding: 16px 0 4px; background: linear-gradient(transparent, var(--bg-surface) 30%); }
  `,
})
export class LibraryComponent implements OnInit {
  protected readonly store = inject(GameStore);
  private readonly modalCtrl = inject(ModalController);

  readonly initialAttr = input<AttrFilter>('ALL');

  readonly attrs = ATTRIBUTE_KEYS;
  readonly info = ATTRIBUTES;
  readonly typeLabel = TYPE_LABEL;
  readonly levels: Level[] = [1, 2, 3];
  readonly levelLabel = LEVEL_LABEL;

  readonly attr = signal<AttrFilter>('ALL');
  readonly selected = signal<LibraryTemplate | null>(null);
  readonly level = signal<Level>(1);
  readonly type = signal<QuestType>('daily');

  readonly groups = computed(() => {
    const a = this.attr();
    const list = LIBRARY.filter((t) => a === 'ALL' || t.attribute === a);
    const map = new Map<string, LibraryTemplate[]>();
    for (const t of list) {
      const key = a === 'ALL' ? `${ATTRIBUTES[t.attribute].name} · ${t.category}` : t.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return [...map.entries()].map(([label, items]) => ({ key: label, label, items }));
  });

  readonly resolved = computed(() => resolveTemplate(this.selected()!, this.level()));
  readonly xp = computed(() => Math.round(DIFFICULTY[this.resolved().difficulty].xp * TYPE_MULT[this.type()]));
  readonly diffLabel = computed(() => DIFFICULTY[this.resolved().difficulty].label);
  readonly typeOptions = computed<QuestType[]>(() => {
    const t = this.selected();
    if (!t) return [];
    return t.type === 'monthly' ? ['monthly', 'weekly', 'todo'] : t.type === 'weekly' ? ['weekly', 'monthly', 'todo'] : ['daily', 'weekly', 'todo'];
  });

  ngOnInit(): void {
    this.attr.set(this.initialAttr());
  }

  isWorkout(t: LibraryTemplate): boolean {
    return !!(t.steps?.length || Object.values(t.levels ?? {}).some((v) => v?.steps?.length));
  }
  multi = hasLevels;

  days(w: number[]): string {
    return w.map((d) => ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d]).join(', ');
  }

  open(t: LibraryTemplate): void {
    this.selected.set(t);
    this.level.set(hasLevels(t) ? this.store.recommendedLevel() : 1);
    this.type.set(t.type);
  }

  add(): void {
    const t = this.selected()!;
    this.store.addFromLibrary(t.id, this.level(), this.type());
    this.store.emit({ kind: 'system', title: 'MISSÃO ACEITA', message: `"${t.title}" foi adicionada às suas ${PLURAL[this.type()]}.` });
    this.selected.set(null);
  }

  askSystem(): void {
    this.modalCtrl.dismiss('system');
  }

  close(): void {
    this.modalCtrl.dismiss();
  }
}
