import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent, IonIcon, IonToggle, ModalController } from '@ionic/angular';
import { ACHIEVEMENTS, MAX_TIER_POINTS, TIERS } from '../../core/achievements';
import { AchievementsComponent } from './achievements.component';
import { GameStore } from '../../core/game.store';
import { AttributeKey, ClassKey } from '../../core/models';
import { ATTRIBUTES, ATTRIBUTE_KEYS, ATTRIBUTE_XP_STEP, MAX_HP, MAX_MANA, addDays } from '../../core/rules';
import { CLASSES } from '../../core/catalog';
import { SystemWindowComponent } from '../../shared/system-window.component';
import { StatBarComponent } from '../../shared/stat-bar.component';
import { RadarComponent } from '../../shared/radar.component';
import { RankBadgeComponent } from '../../shared/rank-badge.component';

const SHADOW_DAYS = 66;

@Component({
  selector: 'aw-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, IonToggle, SystemWindowComponent, StatBarComponent, RadarComponent, RankBadgeComponent],
  template: `
    <ion-content>
      <div class="page top">
        <aw-system-window header="STATUS" [animate]="false">
          <div class="id">
            <aw-rank-badge [rank]="s().rank" [size]="58" />
            <div class="idt">
              <div class="nm">{{ s().hunterName }}</div>
              <div class="muted sm">Classe: <b class="hl">{{ className() }}</b></div>
              <div class="muted sm">Título: <b class="gold">{{ s().title ?? '—' }}</b></div>
            </div>
            <div class="lv"><span>NÍVEL</span><b class="num">{{ s().level }}</b></div>
          </div>
          <div class="bars">
            <aw-stat-bar kind="hp" label="HP" [value]="s().hp" [max]="maxHp" [showText]="true" />
            <aw-stat-bar kind="mana" label="MP" [value]="s().mana" [max]="maxMana" [showText]="true" />
          </div>

          <div class="attrs">
            @for (a of attrKeys; track a) {
              <div class="attr" [style.--ac]="info[a].color">
                <ion-icon [name]="info[a].icon" />
                <div class="an">
                  <b>{{ a }}</b><span class="muted gap">{{ info[a].name }}</span>
                  <div class="ax"><i [style.transform]="'scaleX(' + s().attributeXp[a] / step + ')'"></i></div>
                </div>
                <span class="av num">{{ s().attributes[a] }}</span>
                @if (s().freePoints > 0) {
                  <button class="plus" type="button" (click)="store.allocatePoint(a)" [attr.aria-label]="'Adicionar ponto em ' + info[a].name">+</button>
                }
              </div>
            }
          </div>
          @if (s().freePoints > 0) {
            <p class="free">Pontos disponíveis: <b class="num">{{ s().freePoints }}</b></p>
          }
        </aw-system-window>

        <button type="button" class="ach-card" (click)="openAchievements()">
          <ion-icon name="trophy" />
          <span class="ach-txt"><b>Conquistas</b><small>{{ achPoints() }}/{{ achMax }} níveis · próximo: {{ nextAch() }}</small></span>
          <span class="ach-pips">
            @for (t of tiers; track t.name; let i = $index) { <i [style.background]="t.color" [style.opacity]="tierCount(i) ? 1 : .2"></i> }
          </span>
          <ion-icon name="chevron-forward" />
        </button>

        @if (s().level >= 10 && !s().heroClass) {
          <div class="section-label">Despertar · escolha sua classe</div>
          <div class="classes">
            @for (c of classKeys; track c) {
              <button type="button" class="cls" (click)="pickClass(c)">
                <ion-icon [name]="classes[c].icon" />
                <b>{{ classes[c].name }}</b>
                <small>{{ classes[c].description }}</small>
              </button>
            }
          </div>
        }

        <div class="section-label">Radar de atributos</div>
        <div class="card"><aw-radar [values]="s().attributes" />
          @if (weakest(); as w) { <p class="muted sm c">Área mais negligenciada: <b [style.color]="info[w].color">{{ info[w].name }}</b> ({{ info[w].area }})</p> }
        </div>

        <div class="section-label">Consistência · 12 semanas</div>
        <div class="card">
          <div class="heat" role="img" [attr.aria-label]="'Mapa de consistência das últimas 12 semanas'">
            @for (d of heat(); track d.date) {
              <i [style.opacity]="d.level === 0 ? 1 : 1" [class]="'l' + d.level" [attr.title]="d.date"></i>
            }
          </div>
          <div class="stats">
            <div><b class="num">{{ s().totalCompleted }}</b><span>missões</span></div>
            <div><b class="num">{{ s().streak }}</b><span>sequência</span></div>
            <div><b class="num">{{ s().streakMax }}</b><span>recorde</span></div>
            <div><b class="num">{{ weekXp() }}</b><span>XP 7 dias</span></div>
          </div>
        </div>

        <div class="section-label">Exército de Sombras</div>
        <div class="card">
          <p class="muted sm">Uma Diária cumprida por {{ shadowDays }} dias pode ser extraída como Sombra, um hábito dominado.</p>
          @for (q of shadows(); track q.id) {
            <div class="shadow">
              <span class="sn">{{ q.title }}</span>
              <div class="sbar"><i [style.transform]="'scaleX(' + Math.min(1, q.totalCompletions / shadowDays) + ')'"></i></div>
              <span class="num sm">{{ q.totalCompletions }}/{{ shadowDays }}</span>
            </div>
          } @empty { <p class="muted sm">Crie Diárias para começar.</p> }
        </div>

        @if (s().titles.length) {
          <div class="section-label">Títulos</div>
          <div class="choice-row">
            <button class="choice" [class.on]="!s().title" (click)="store.setTitle(null)">Nenhum</button>
            @for (t of s().titles; track t) {
              <button class="choice" [class.on]="s().title === t" (click)="store.setTitle(t)">{{ t }}</button>
            }
          </div>
        }

        <div class="section-label">Configurações</div>
        <div class="card settings">
          <div class="set">
            <span>Horário do reset</span>
            <div class="choice-row">
              @for (h of [0, 3, 4, 5]; track h) {
                <button class="choice sm" [class.on]="s().settings.resetHour === h" (click)="store.updateSettings({ resetHour: h })">{{ h }}h</button>
              }
            </div>
          </div>
          <div class="set">
            <span>Dia de descanso</span>
            <div class="choice-row days">
              <button class="choice sm" [class.on]="s().settings.restDay === null" (click)="store.updateSettings({ restDay: null })">—</button>
              @for (d of dayNames; track $index) {
                <button class="choice sm" [class.on]="s().settings.restDay === $index" (click)="store.updateSettings({ restDay: $index })">{{ d }}</button>
              }
            </div>
          </div>
          <div class="set">
            <span>Modo férias / doente <small class="muted">(pausa sequência e HP)</small></span>
            <div class="choice-row">
              <button class="choice sm" [class.on]="!store.onVacation()" (click)="store.setVacation(null)">Off</button>
              <button class="choice sm" (click)="store.setVacation(3)">3 dias</button>
              <button class="choice sm" (click)="store.setVacation(7)">7 dias</button>
              <button class="choice sm" (click)="store.setVacation(14)">14 dias</button>
            </div>
            @if (store.onVacation()) { <small class="muted">Ativo até {{ vacationEnd() }}</small> }
          </div>
          <ion-toggle [checked]="s().settings.haptics" (ionChange)="store.updateSettings({ haptics: $event.detail.checked })">Vibração</ion-toggle>
          <ion-toggle [checked]="s().settings.sound" (ionChange)="store.updateSettings({ sound: $event.detail.checked })">Sons</ion-toggle>
          <ion-toggle [checked]="s().settings.glow" (ionChange)="store.updateSettings({ glow: $event.detail.checked })">Efeitos de brilho</ion-toggle>
          <ion-toggle [checked]="s().settings.reduceMotion" (ionChange)="store.updateSettings({ reduceMotion: $event.detail.checked })">Reduzir movimento</ion-toggle>
        </div>
        <button class="btn danger block reset" type="button" (click)="resetAll()">Apagar todo o progresso</button>
      </div>
    </ion-content>
  `,
  styles: `
    .top { padding-top: calc(env(safe-area-inset-top) + 14px); }
    .sm { font-size: .8rem; } .c { text-align: center; } .hl { color: var(--system-cyan); } .gold { color: var(--gold); }
    .id { display: flex; align-items: center; gap: 12px; }
    .idt { flex: 1; min-width: 0; }
    .nm { font-family: var(--font-display); font-weight: 700; font-size: 1.35rem; letter-spacing: .04em; }
    .lv { display: flex; flex-direction: column; align-items: center; }
    .lv span { font-family: var(--font-display); font-size: .7rem; font-weight: 700; letter-spacing: .12em; color: var(--text-muted); }
    .lv b { font-size: 2rem; font-weight: 600; color: var(--system-cyan); line-height: 1; }
    .bars { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
    .attrs { display: flex; flex-direction: column; gap: 6px; }
    .attr { display: flex; align-items: center; gap: 10px; min-height: 44px; }
    .attr > ion-icon { color: var(--ac); font-size: 1.2rem; }
    .an { flex: 1; font-size: .85rem; } .an b { font-family: var(--font-display); letter-spacing: .06em; } .gap { margin-left: 6px; }
    .ax { height: 3px; margin-top: 4px; border-radius: 2px; background: rgba(255,255,255,.07); overflow: hidden; }
    .ax i { display: block; height: 100%; background: var(--ac); transform-origin: left; transition: transform .4s; }
    .av { font-size: 1.2rem; font-weight: 600; min-width: 32px; text-align: right; }
    .plus { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--system-glow); background: rgba(47,139,255,.18); color: var(--system-cyan); font-size: 1.3rem; font-weight: 700; }
    .free { text-align: center; margin: 12px 0 0; color: var(--system-cyan); }
    .ach-card { width: 100%; display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 14px; border-radius: 14px; font: inherit; color: var(--text-primary); text-align: left;
      border: 1px solid rgba(245,196,81,.45); background: linear-gradient(120deg, rgba(245,196,81,.16), rgba(11,18,32,.9)); }
    .ach-card > ion-icon:first-child { font-size: 1.6rem; color: var(--gold); }
    .ach-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .ach-txt b { font-family: var(--font-display); letter-spacing: .06em; text-transform: uppercase; }
    .ach-txt small { color: var(--text-muted); font-size: .78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ach-pips { display: flex; gap: 3px; } .ach-pips i { width: 6px; height: 16px; border-radius: 2px; }
    .classes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .cls { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 12px; border-radius: 12px; border: 1px solid rgba(123,63,228,.5); background: rgba(123,63,228,.1); color: var(--text-primary); font: inherit; text-align: left; }
    .cls ion-icon { color: #b48cff; font-size: 1.4rem; } .cls b { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .05em; } .cls small { color: var(--text-muted); font-size: .74rem; }
    .heat { display: grid; grid-template-rows: repeat(7, 1fr); grid-auto-flow: column; gap: 3px; }
    .heat i { aspect-ratio: 1; border-radius: 3px; background: rgba(47,139,255,.08); }
    .heat i.l1 { background: rgba(47,139,255,.3); } .heat i.l2 { background: rgba(47,139,255,.55); } .heat i.l3 { background: #2f8bff; } .heat i.l4 { background: #5cc8ff; box-shadow: 0 0 4px #5cc8ff; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 14px; text-align: center; }
    .stats b { display: block; font-size: 1.2rem; color: var(--system-cyan); } .stats span { font-size: .7rem; color: var(--text-muted); }
    .shadow { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
    .sn { flex: 0 0 38%; font-size: .85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sbar { flex: 1; height: 6px; border-radius: 3px; background: rgba(123,63,228,.15); overflow: hidden; }
    .sbar i { display: block; height: 100%; transform-origin: left; background: linear-gradient(90deg, #3a1c71, #7b3fe4); }
    .settings { display: flex; flex-direction: column; gap: 4px; }
    .set { padding: 6px 0 10px; border-bottom: 1px solid rgba(47,139,255,.1); }
    .set > span { display: block; font-size: .9rem; margin-bottom: 8px; }
    .choice.sm { min-height: 40px; padding: 0 10px; font-size: .82rem; }
    .days .choice { flex: 1; min-width: 34px; padding: 0; }
    ion-toggle { --track-background: rgba(255,255,255,.12); --track-background-checked: var(--system-blue); --handle-background-checked: #fff; min-height: 48px; }
    .reset { margin: 22px 0 10px; }
  `,
})
export class ProfilePage {
  protected readonly store = inject(GameStore);
  private readonly alerts = inject(AlertController);
  private readonly router = inject(Router);
  private readonly modals = inject(ModalController);
  readonly s = this.store.state;
  readonly attrKeys = ATTRIBUTE_KEYS;
  readonly info = ATTRIBUTES;
  readonly step = ATTRIBUTE_XP_STEP;
  readonly maxHp = MAX_HP;
  readonly maxMana = MAX_MANA;
  readonly classes = CLASSES;
  readonly classKeys = Object.keys(CLASSES) as ClassKey[];
  readonly dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  readonly shadowDays = SHADOW_DAYS;
  readonly Math = Math;

  readonly className = computed(() => (this.s().heroClass ? CLASSES[this.s().heroClass!].name : 'Não despertado (nível 10)'));
  readonly weakest = computed<AttributeKey | null>(() => {
    const a = this.s().attributes;
    return [...ATTRIBUTE_KEYS].sort((x, y) => a[x] - a[y])[0] ?? null;
  });
  readonly heat = computed(() => {
    const today = this.store.today();
    const map = new Map(this.s().history.map((h) => [h.date, h]));
    const start = addDays(today, -83 - new Date(today + 'T12:00:00').getDay() + 6);
    return Array.from({ length: 84 }, (_, i) => {
      const date = addDays(start, i);
      const h = map.get(date);
      let level = 0;
      if (h && h.total > 0) {
        const r = h.done / h.total;
        level = r >= 1 ? 4 : r >= 0.66 ? 3 : r >= 0.33 ? 2 : r > 0 ? 1 : 0;
      } else if (h && h.xp > 0) level = 1;
      return { date, level };
    });
  });
  readonly weekXp = computed(() => {
    const from = addDays(this.store.today(), -6);
    return this.s().history.filter((h) => h.date >= from).reduce((s, h) => s + h.xp, 0);
  });
  readonly shadows = computed(() => this.s().quests.filter((q) => q.type === 'daily').sort((a, b) => b.totalCompletions - a.totalCompletions));
  readonly vacationEnd = computed(() => {
    const v = this.s().settings.vacationUntil;
    return v ? new Date(v + 'T12:00:00').toLocaleDateString('pt-BR') : '';
  });

  readonly tiers = TIERS;
  readonly achMax = MAX_TIER_POINTS;
  readonly achPoints = computed(() => Object.values(this.s().achievements).reduce((a, b) => a + b, 0));
  readonly nextAch = computed(() => {
    const s = this.s();
    let best: { name: string; r: number } | null = null;
    for (const a of ACHIEVEMENTS) {
      const t = s.achievements[a.id] ?? 0;
      if (t >= 5) continue;
      const r = a.metric(s) / a.targets[t];
      if (!best || r > best.r) best = { name: `${a.name} (${TIERS[t].name})`, r };
    }
    return best?.name ?? 'todas concluídas';
  });
  tierCount(i: number): number {
    return Object.values(this.s().achievements).filter((t) => t > i).length;
  }

  async openAchievements(): Promise<void> {
    const m = await this.modals.create({ component: AchievementsComponent, breakpoints: [0, 1], initialBreakpoint: 1, cssClass: 'sheet', handle: true });
    await m.present();
  }

  async pickClass(c: ClassKey): Promise<void> {
    const a = await this.alerts.create({
      header: `Despertar como ${CLASSES[c].name}?`,
      message: `${CLASSES[c].description} Esta escolha é permanente.`,
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Despertar', handler: () => this.store.chooseClass(c) }],
    });
    await a.present();
  }

  async resetAll(): Promise<void> {
    const a = await this.alerts.create({
      header: 'Apagar todo o progresso?',
      message: 'Nível, itens, missões e histórico serão apagados deste aparelho. Não dá para desfazer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Apagar',
          role: 'destructive',
          handler: async () => {
            await this.store.resetAll();
            this.router.navigateByUrl('/despertar', { replaceUrl: true });
          },
        },
      ],
    });
    await a.present();
  }
}
