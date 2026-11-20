import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionSheetController, AlertController, IonContent, IonHeader, IonIcon, IonToolbar, ModalController } from '@ionic/angular';
import { openCreateMenu, openLibrary, openQuestDetail, openRecommend } from '../library/open';
import { GameStore } from '../../core/game.store';
import { ChestKind, Quest, QuestType } from '../../core/models';
import { FOCUS_MINUTES, SKILL_COST, nextResetAt, streakBonus } from '../../core/rules';
import { HeroHeaderComponent } from '../../shared/hero-header.component';
import { QuestCardComponent } from '../../shared/quest-card.component';
import { SystemWindowComponent } from '../../shared/system-window.component';
import { openQuestEditor } from '../quest-editor/open-editor';

const TABS: { key: QuestType; label: string }[] = [
  { key: 'daily', label: 'Diárias' },
  { key: 'weekly', label: 'Semanais' },
  { key: 'monthly', label: 'Mensais' },
  { key: 'todo', label: 'Avulsas' },
];

@Component({
  selector: 'aw-missions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonHeader, IonToolbar, IonIcon, HeroHeaderComponent, QuestCardComponent, SystemWindowComponent],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <div class="page head"><aw-hero-header /></div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page">
        @if (store.inPenalty()) {
          <aw-system-window header="ZONA DE PENALIDADE" tone="red" [animate]="false">
            <p class="pen">XP −25% até sair. Missão de recuperação: complete <b>3 tarefas fáceis</b>.</p>
            <div class="pen-prog num">{{ s().penaltyProgress }}/3</div>
          </aw-system-window>
        }

        <section class="day card" aria-label="Resumo do dia">
          <div class="ring" role="img" [attr.aria-label]="dailyDone() + ' de ' + dailyTotal() + ' diárias concluídas'">
            <svg viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="27" class="bg" />
              <circle cx="32" cy="32" r="27" class="fg" pathLength="100" [style.stroke-dashoffset]="100 - dayRatio() * 100" [style.opacity]="dayRatio() > 0 ? 1 : 0" />
            </svg>
            <div class="ring-txt num">{{ dailyDone() }}/{{ dailyTotal() }}</div>
          </div>
          <div class="day-info">
            <div class="day-title display">Diárias de hoje</div>
            <div class="muted small"><ion-icon name="time" /> Reset em <span class="num">{{ countdown() }}</span></div>
            @if (store.isRestDay()) { <div class="chip green">Dia de descanso · sem penalidade</div> }
            @if (store.onVacation()) { <div class="chip violet">Modo férias ativo</div> }
          </div>
          <div class="streak" [attr.aria-label]="'Sequência de ' + s().streak + ' dias'">
            <ion-icon name="flame" />
            <span class="num">{{ s().streak }}</span>
            @if (bonus() > 0) { <small class="num">+{{ bonus() }}%</small> }
          </div>
        </section>

        <div class="skills">
          <button class="skill" type="button" (click)="focus()" [class.active]="store.focusActive()" [disabled]="!store.focusActive() && s().mana < focusCost">
            <ion-icon name="sparkles" />
            @if (store.focusActive()) {
              <span>Foco ativo · <span class="num">{{ focusLeft() }}</span></span>
            } @else {
              <span>Foco: XP ×2 por {{ focusMin }} min <small>({{ focusCost }} MP)</small></span>
            }
          </button>
        </div>

        @for (c of chestList(); track c.kind) {
          <button class="chest" type="button" (click)="store.openChest(c.kind)">
            <ion-icon name="gift" />
            <span><b>{{ c.label }}</b> disponível! Toque para abrir.</span>
            <ion-icon name="chevron-forward" />
          </button>
        }

        @if (s().surprise?.status === 'active') {
          <aw-system-window header="MISSÃO OCULTA" tone="violet">
            <p class="surp">{{ s().surprise!.title }}</p>
            <p class="muted small">Expira em <span class="num">{{ surpriseLeft() }}</span> · +{{ s().surprise!.xp }} XP</p>
            <button class="btn block" type="button" (click)="store.completeSurprise()">Concluído</button>
          </aw-system-window>
        }

        <div class="seg" role="tablist">
          @for (t of tabs; track t.key) {
            <button role="tab" type="button" class="seg-btn" [class.on]="tab() === t.key" [attr.aria-selected]="tab() === t.key" (click)="tab.set(t.key)">
              {{ t.label }}
              <span class="cnt num">{{ pendingCount(t.key) }}</span>
            </button>
          }
        </div>

        @if (tab() === 'weekly' || tab() === 'monthly') {
          <p class="muted small cycle">{{ tab() === 'weekly' ? 'Renova toda segunda. Completar todas libera o Baú Semanal (Raro garantido).' : 'Renova no dia 1. Completar todas libera o Baú Mensal e um Título.' }}</p>
        }

        @for (q of list(); track q.id) {
          <aw-quest-card [quest]="q" (edit)="edit($event)" (remove)="remove($event)" (open)="detail($event)" />
        } @empty {
          <div class="empty">
            <div class="portal glow-fx" aria-hidden="true"></div>
            <p class="display">Nenhuma missão aqui</p>
            <p class="muted small">{{ emptyHint() }}</p>
            <div class="empty-actions">
              <button class="btn" type="button" (click)="system()"><ion-icon name="sparkles" /> Sistema escolhe</button>
              <button class="btn ghost" type="button" (click)="library()"><ion-icon name="book" /> Biblioteca</button>
            </div>
          </div>
        }

        <button class="sys-btn" type="button" (click)="system()">
          <ion-icon name="sparkles" />
          <span><b>Sistema, me fortaleça</b><small>Sugere missões para seus atributos mais baixos</small></span>
          <ion-icon name="chevron-forward" />
        </button>

        @if (list().length) {
          <p class="muted tiny">Deslize → para concluir · ← para adiar, editar ou excluir</p>
        }
      </div>
    </ion-content>
  `,
  styles: `
    ion-toolbar { --background: rgba(5,7,13,.96); --border-width: 0; padding-top: env(safe-area-inset-top); }
    .page.head { padding-top: 6px; padding-bottom: 8px; }
    .small { font-size: .82rem; }
    .tiny { font-size: .74rem; text-align: center; margin: 14px 0; }
    .pen { margin: 0 0 6px; text-align: center; }
    .pen-prog { text-align: center; font-size: 1.4rem; color: #ff8095; }
    aw-system-window { margin-bottom: 14px; }

    .day { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
    .ring { position: relative; width: 64px; height: 64px; flex: none; }
    .ring svg { transform: rotate(-90deg); }
    .ring circle { fill: none; stroke-width: 6; }
    .ring .bg { stroke: rgba(47,139,255,.15); }
    .ring .fg { stroke: var(--system-glow); stroke-linecap: round; stroke-dasharray: 100; transition: stroke-dashoffset .5s ease; filter: drop-shadow(0 0 4px rgba(92,200,255,.7)); }
    .ring-txt { position: absolute; inset: 0; display: grid; place-items: center; font-size: .95rem; font-weight: 600; }
    .day-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
    .day-title { font-size: 1rem; }
    .day-info ion-icon { vertical-align: -2px; }
    .streak { display: flex; flex-direction: column; align-items: center; color: var(--system-glow); line-height: 1.1; }
    .streak ion-icon { font-size: 1.7rem; filter: drop-shadow(0 0 6px rgba(92,200,255,.8)); }
    .streak .num { font-size: 1.2rem; font-weight: 600; color: var(--text-primary); }
    .streak small { font-size: .65rem; color: var(--success); }

    .skills { display: flex; gap: 8px; margin-bottom: 12px; }
    .skill { flex: 1; min-height: 44px; display: flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 12px;
      border: 1px solid rgba(123,63,228,.45); background: rgba(123,63,228,.1); color: #d2bcff; font: inherit; font-size: .85rem; text-align: left; }
    .skill.active { border-color: #b48cff; background: rgba(123,63,228,.25); box-shadow: 0 0 14px rgba(123,63,228,.4); }
    .skill:disabled { opacity: .45; }
    .skill small { color: var(--text-muted); }

    .chest { width: 100%; min-height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 14px; margin-bottom: 12px; border-radius: 12px;
      border: 1px solid rgba(245,196,81,.5); background: linear-gradient(90deg, rgba(245,196,81,.16), rgba(245,196,81,.04)); color: var(--gold); font: inherit; text-align: left;
      animation: glowPulse 2s ease-in-out infinite; }
    .chest span { flex: 1; color: var(--text-primary); }
    .chest > ion-icon:first-child { font-size: 1.5rem; }
    @keyframes glowPulse { 50% { box-shadow: 0 0 18px rgba(245,196,81,.35); } }

    .surp { font-size: 1.1rem; font-weight: 600; text-align: center; margin: 0 0 4px; }
    aw-system-window .muted { text-align: center; margin: 0 0 12px; }

    .seg { display: flex; gap: 4px; padding: 4px; margin: 6px 0 12px; background: var(--bg-surface); border-radius: 12px; border: 1px solid rgba(47,139,255,.14); }
    .seg-btn { flex: 1; min-height: 40px; border: 0; border-radius: 9px; background: transparent; color: var(--text-muted);
      font-family: var(--font-display); font-weight: 700; font-size: .82rem; letter-spacing: .04em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 5px; }
    .seg-btn.on { background: rgba(47,139,255,.2); color: var(--system-cyan); box-shadow: inset 0 0 0 1px rgba(92,200,255,.45); }
    .cnt { font-size: .68rem; min-width: 18px; padding: 1px 5px; border-radius: 99px; background: rgba(255,255,255,.08); }
    .cycle { margin: -4px 2px 12px; }

    .empty { text-align: center; padding: 30px 10px; }
    .empty-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .sys-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px; margin-top: 8px; border-radius: 14px; text-align: left; font: inherit; color: var(--text-primary);
      border: 1px solid rgba(123,63,228,.6); background: linear-gradient(120deg, rgba(123,63,228,.28), rgba(47,139,255,.12)); box-shadow: 0 0 18px rgba(123,63,228,.25); }
    .sys-btn > ion-icon:first-child { font-size: 1.6rem; color: #c3a6ff; }
    .sys-btn span { flex: 1; display: flex; flex-direction: column; }
    .sys-btn b { font-family: var(--font-display); letter-spacing: .05em; text-transform: uppercase; }
    .sys-btn small { color: var(--text-muted); font-size: .8rem; }
    .portal { width: 110px; height: 150px; margin: 0 auto 14px; border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(166,240,255,.9) 0%, rgba(47,139,255,.6) 30%, rgba(58,28,113,.4) 60%, transparent 72%);
      animation: swirl 4s ease-in-out infinite; }
    @keyframes swirl { 50% { transform: scale(1.06); opacity: .85; } }
  `,
})
export class MissionsPage {
  protected readonly store = inject(GameStore);
  private readonly modals = inject(ModalController);
  private readonly alerts = inject(AlertController);
  private readonly sheets = inject(ActionSheetController);

  readonly s = this.store.state;
  readonly tabs = TABS;
  readonly tab = signal<QuestType>('daily');
  readonly focusCost = SKILL_COST.focus;
  readonly focusMin = FOCUS_MINUTES;

  readonly dailyTotal = computed(() => this.store.dailiesToday().length);
  readonly dailyDone = this.store.dailyDone;
  readonly dayRatio = computed(() => (this.dailyTotal() ? this.dailyDone() / this.dailyTotal() : 0));
  readonly bonus = computed(() => Math.round(streakBonus(this.s().streak) * 100));

  readonly countdown = computed(() => {
    const now = new Date(this.store.now());
    const ms = nextResetAt(now, this.s().settings.resetHour).getTime() - now.getTime();
    const h = Math.floor(ms / 3600_000);
    const m = Math.floor((ms % 3600_000) / 60_000);
    return `${h}h ${m.toString().padStart(2, '0')}min`;
  });
  readonly focusLeft = computed(() => this.minsLeft(this.s().focusUntil));
  readonly surpriseLeft = computed(() => this.minsLeft(this.s().surprise?.expiresAt ?? null));

  readonly chestList = computed(() => {
    const a = this.store.chestAvailable();
    const labels: Record<ChestKind, string> = { daily: 'Baú Diário', weekly: 'Baú Semanal', monthly: 'Baú Mensal' };
    return (Object.keys(a) as ChestKind[]).filter((k) => a[k]).map((kind) => ({ kind, label: labels[kind] }));
  });

  readonly list = computed(() => {
    const t = this.tab();
    const base = t === 'daily' ? this.store.dailiesToday() : this.s().quests.filter((q) => q.type === t);
    const order = { pending: 0, skipped: 1, done: 2, failed: 3 };
    return [...base].sort((a, b) => order[a.status] - order[b.status] || a.createdAt - b.createdAt);
  });

  readonly emptyHint = computed(() => {
    switch (this.tab()) {
      case 'daily':
        return 'Hábitos que renovam todo dia. Comece com 3 a 5.';
      case 'weekly':
        return 'Metas de consistência, como "treinar 3 vezes".';
      case 'monthly':
        return 'Uma meta grande: terminar um curso, juntar R$ 500…';
      default:
        return 'Tarefas únicas, sem repetição.';
    }
  });

  pendingCount(t: QuestType): number {
    const list = t === 'daily' ? this.store.dailiesToday() : this.s().quests.filter((q) => q.type === t);
    return list.filter((q) => q.status === 'pending').length;
  }

  private minsLeft(until: number | null): string {
    if (!until) return '';
    const m = Math.max(0, Math.ceil((until - this.store.now()) / 60_000));
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m} min`;
  }

  focus(): void {
    if (!this.store.focusActive()) this.store.activateFocus();
  }

  create(): void {
    openCreateMenu(this.sheets, this.modals, this.tab());
  }

  system(): void {
    openRecommend(this.modals);
  }

  library(): void {
    openLibrary(this.modals);
  }

  detail(q: Quest): void {
    openQuestDetail(this.modals, q.id);
  }

  edit(q: Quest): void {
    openQuestEditor(this.modals, q);
  }

  async remove(q: Quest): Promise<void> {
    const a = await this.alerts.create({
      header: 'Excluir missão?',
      message: `"${q.title}" será removida. O XP já ganho continua seu.`,
      cssClass: 'sys-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.store.deleteQuest(q.id) },
      ],
    });
    await a.present();
  }
}
