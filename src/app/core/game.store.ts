import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { App as CapApp } from '@capacitor/app';
import {
  AttributeKey, ChestKind, ClassKey, Difficulty, Equipment, GameEvent, GameState, ItemDef,
  Quest, QuestType, Rarity, Stats,
} from './models';
import {
  ANTI_FARM_AFTER, ATTRIBUTES, ATTRIBUTE_KEYS, ATTRIBUTE_XP_STEP, DAILY_FAIL_DAMAGE, DIFFICULTY,
  FOCUS_MINUTES, MAX_HP, MAX_MANA, PITY_LIMIT, RARITY, RARITY_ORDER, SKILL_COST, TYPE_MULT, addDays,
  dayKey, daysBetween, gameWeekday, monthKey, nextRank, periodKey, rankTargetScale, rollRarity,
  seededRng, streakBonus, uid, weekKey, xpToNext,
} from './rules';
import { CLASSES, FIXED_SHOP, ITEMS, ITEM_MAP, OBJECTIVES, QuestTemplate, SURPRISE_QUESTS, WEEKLY_SUGGESTIONS, fromLibrary } from './catalog';
import { FeedbackService } from './feedback.service';
import { LEVEL_LABEL, LIBRARY, Level, LibraryTemplate, levelForRank, resolveTemplate } from './library';
import { ACHIEVEMENTS, TIERS, tiersReached } from './achievements';

export interface Proposal {
  template: LibraryTemplate;
  level: Level;
  type: QuestType;
  reason: string;
}

export interface Recommendation {
  analysis: string[];
  proposals: Proposal[];
}

const STORAGE_KEY = 'awaken.state.v1';
const STATE_VERSION = 1;

function initialState(): GameState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    hunterName: '',
    objectives: [],
    level: 1,
    xp: 0,
    rank: 'E',
    heroClass: null,
    title: null,
    titles: [],
    hp: MAX_HP,
    mana: MAX_MANA,
    gold: 0,
    crystals: 0,
    essence: 0,
    streak: 0,
    streakMax: 0,
    streakFrozenUntil: null,
    freePoints: 0,
    attributes: { FOR: 1, VIT: 1, AGI: 1, INT: 1, PER: 1, CAR: 1 },
    attributeXp: { FOR: 0, VIT: 0, AGI: 0, INT: 0, PER: 0, CAR: 0 },
    quests: [],
    inventory: [],
    equipment: { weapon: null, armor: null, acc1: null, acc2: null },
    customRewards: [],
    history: [],
    chests: { daily: null, weekly: null, monthly: null },
    chestPity: 0,
    lastDayKey: '',
    lastWeekKey: '',
    lastMonthKey: '',
    userCompletionsToday: 0,
    focusUntil: null,
    penaltyUntil: null,
    penaltyProgress: 0,
    surprise: null,
    exam: null,
    totalCompleted: 0,
    settings: {
      resetHour: 0,
      restDay: null,
      reduceMotion: false,
      glow: true,
      haptics: true,
      sound: true,
      vacationUntil: null,
    },
    stats: initialStats(),
    achievements: {},
  };
}

function initialStats(): Stats {
  return {
    byAttr: { FOR: 0, VIT: 0, AGI: 0, INT: 0, PER: 0, CAR: 0 },
    byType: { daily: 0, weekly: 0, monthly: 0, todo: 0 },
    checklists: 0,
    early: 0,
    focus: 0,
    surprises: 0,
    chests: 0,
    items: 0,
    goldEarned: 0,
    redeemed: 0,
    escapes: 0,
  };
}

export interface RewardPreview {
  xp: number;
  gold: number;
}

@Injectable({ providedIn: 'root' })
export class GameStore {
  private readonly fx = inject(FeedbackService);

  private readonly _state = signal<GameState>(initialState());
  readonly state = this._state.asReadonly();
  readonly ready = signal(false);
  /** Relógio atualizado a cada 30 s (contagens regressivas). */
  readonly now = signal(Date.now());
  readonly events = signal<GameEvent[]>([]);

  private undoSnapshot: { state: GameState; expires: number } | null = null;
  private saveTimer?: ReturnType<typeof setTimeout>;

  readonly xpNeeded = computed(() => xpToNext(this._state().level));
  readonly xpRatio = computed(() => Math.min(1, this._state().xp / this.xpNeeded()));
  readonly today = computed(() => dayKey(new Date(this.now()), this._state().settings.resetHour));
  readonly isRestDay = computed(() => {
    const s = this._state();
    return s.settings.restDay === gameWeekday(new Date(this.now()), s.settings.resetHour);
  });
  readonly onVacation = computed(() => {
    const v = this._state().settings.vacationUntil;
    return !!v && v >= this.today();
  });
  readonly dailiesToday = computed(() => {
    const wd = gameWeekday(new Date(this.now()), this._state().settings.resetHour);
    return this._state().quests.filter((q) => q.type === 'daily' && q.weekdays.includes(wd));
  });
  readonly dailyDone = computed(() => this.dailiesToday().filter((q) => q.status !== 'pending').length);
  readonly inPenalty = computed(() => {
    const p = this._state().penaltyUntil;
    return !!p && p > this.now();
  });
  readonly focusActive = computed(() => {
    const f = this._state().focusUntil;
    return !!f && f > this.now();
  });
  readonly equippedItems = computed<ItemDef[]>(() => {
    const s = this._state();
    return (Object.values(s.equipment) as (string | null)[])
      .map((u) => s.inventory.find((e) => e.uid === u))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .map((e) => ITEM_MAP[e.itemId])
      .filter(Boolean);
  });
  readonly bonuses = computed(() => {
    const items = this.equippedItems();
    const sum = (f: (i: ItemDef) => number | undefined) => items.reduce((s, i) => s + (f(i) ?? 0), 0);
    const cls = this._state().heroClass;
    return {
      gold: sum((i) => i.goldBonus),
      drop: sum((i) => i.dropBonus) + (cls === 'strategist' ? 0.02 : 0) + this._state().attributes.PER * 0.001,
      shield: Math.min(0.8, sum((i) => i.hpShield) + (cls === 'healer' ? 0.2 : 0) + this._state().attributes.VIT * 0.005),
      shopDiscount: (cls === 'bard' ? 0.1 : 0) + Math.min(0.15, this._state().attributes.CAR * 0.003),
    };
  });
  readonly maxDailySlots = computed(() => 7 + Math.floor(this._state().attributes.AGI / 20));

  readonly chestAvailable = computed<Record<ChestKind, boolean>>(() => {
    const s = this._state();
    const now = new Date(this.now());
    const rh = s.settings.resetHour;
    const all = (type: QuestType, list = s.quests.filter((q) => q.type === type)) =>
      list.length > 0 && list.every((q) => q.status === 'done' || q.status === 'skipped');
    return {
      daily: all('daily', this.dailiesToday()) && s.chests.daily !== dayKey(now, rh),
      weekly: all('weekly') && s.chests.weekly !== weekKey(now, rh),
      monthly: all('monthly') && s.chests.monthly !== monthKey(now, rh),
    };
  });

  readonly dailyShop = computed(() => {
    const rng = seededRng('shop-' + this.today());
    const pool = ITEMS.filter((i) => i.type !== 'cosmetic' && i.rarity !== 'legendary');
    const picks: { item: ItemDef; price: number }[] = [];
    const used = new Set<string>();
    while (picks.length < 6 && used.size < pool.length) {
      const item = pool[Math.floor(rng() * pool.length)];
      if (used.has(item.id)) continue;
      used.add(item.id);
      const base = item.price ?? { common: 80, uncommon: 160, rare: 400, epic: 900, legendary: 2500, mythic: 9999 }[item.rarity];
      picks.push({ item, price: Math.round(base * (0.8 + rng() * 0.3)) });
    }
    return picks;
  });
  readonly fixedShop = FIXED_SHOP.map((id) => ITEM_MAP[id]);

  constructor() {
    effect(() => {
      const s = this._state();
      this.fx.hapticsOn = s.settings.haptics;
      this.fx.soundOn = s.settings.sound;
      if (!this.ready()) return;
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(s) }), 250);
    });
  }

  async init(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        const loaded = JSON.parse(value) as GameState;
        const base = initialState();
        const stats = { ...base.stats, ...loaded.stats };
        stats.byAttr = { ...base.stats.byAttr, ...loaded.stats?.byAttr };
        stats.byType = { ...base.stats.byType, ...loaded.stats?.byType };
        this._state.set({ ...base, ...loaded, settings: { ...base.settings, ...loaded.settings }, stats, achievements: loaded.achievements ?? {} });
      }
    } catch {
      /* estado corrompido → começa do zero */
    }
    this.ready.set(true);
    this.tick();
    setInterval(() => this.tick(), 30_000);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && this.tick());
    CapApp.addListener('resume', () => this.tick()).catch(() => {});
  }

  tick(): void {
    this.now.set(Date.now());
    const s = this._state();
    if (!s.onboarded) return;
    this.processResets();
    this.processSurprise();
    this.processPenaltyExpiry();
  }

  private mutate(fn: (s: GameState) => void): void {
    const draft = structuredClone(this._state());
    fn(draft);
    const unlocked = draft.onboarded ? this.evaluateAchievements(draft) : [];
    this._state.set(draft);
    for (const e of unlocked) this.emit(e);
  }

  /** Verifica conquistas no rascunho, concede recompensas e devolve os eventos. */
  private evaluateAchievements(s: GameState): GameEvent[] {
    const events: GameEvent[] = [];
    for (const a of ACHIEVEMENTS) {
      const reached = tiersReached(a, a.metric(s));
      const have = s.achievements[a.id] ?? 0;
      if (reached <= have) continue;
      for (let t = have; t < reached; t++) {
        s.gold += TIERS[t].gold;
        s.crystals += TIERS[t].crystals;
        if (t === 4 && !s.titles.includes(a.name)) s.titles.push(a.name);
      }
      s.achievements[a.id] = reached;
      events.push({ kind: 'achievement', id: a.id, tier: reached - 1 });
    }
    return events;
  }

  emit(e: GameEvent): void {
    this.events.update((q) => [...q, e]);
  }

  dismissEvent(): void {
    this.events.update((q) => q.slice(1));
  }

  completeOnboarding(name: string, objectives: string[], templates: QuestTemplate[], resetHour: number): void {
    const now = new Date();
    this.mutate((s) => {
      s.onboarded = true;
      s.hunterName = name.trim() || 'Caçador';
      s.objectives = objectives;
      s.settings.resetHour = resetHour;
      s.lastDayKey = dayKey(now, resetHour);
      s.lastWeekKey = weekKey(now, resetHour);
      s.lastMonthKey = monthKey(now, resetHour);
      s.quests = templates.map((t) => this.buildQuest(t, 'system', s));
      this.suggestWeeklies(s);
      s.inventory.push({ uid: uid(), itemId: 'potion_hp', qty: 2, upgrade: 0 });
      s.inventory.push({ uid: uid(), itemId: 'dagger_novice', qty: 1, upgrade: 0 });
    });
    // Primeira missão trivial já concluída → primeiro level up imediato
    const first = this.buildQuest(
      { title: 'Aceitar o chamado', type: 'todo', attribute: 'PER', difficulty: 'trivial', target: 1, unit: '' },
      'system',
      this._state(),
    );
    this.mutate((s) => s.quests.push(first));
    this.complete(first.id, { bonusXp: xpToNext(1) - 10 });
    this.scheduleSurprise();
  }

  private buildQuest(t: QuestTemplate & { weekdays?: number[] }, origin: Quest['origin'], s: GameState): Quest {
    return {
      id: uid(),
      title: t.title,
      type: t.type,
      attribute: t.attribute,
      difficulty: t.difficulty,
      target: Math.max(1, Math.round(t.target)),
      unit: t.unit,
      weekdays: t.weekdays ?? [0, 1, 2, 3, 4, 5, 6],
      origin,
      createdAt: Date.now(),
      period: periodKey(t.type, new Date(), s.settings.resetHour),
      progress: 0,
      status: 'pending',
      totalCompletions: 0,
      failStreak: 0,
      templateId: t.templateId,
      level: t.level,
      checks: t.templateId && t.unit === 'etapas' ? Array(Math.max(1, Math.round(t.target))).fill(false) : undefined,
    };
  }

  private suggestWeeklies(s: GameState): void {
    s.quests = s.quests.filter((q) => !(q.type === 'weekly' && q.origin === 'system'));
    const weakest = [...ATTRIBUTE_KEYS].sort((a, b) => s.attributes[a] - s.attributes[b] || Math.random() - 0.5).slice(0, 2);
    for (const a of weakest) s.quests.push(this.buildQuest(WEEKLY_SUGGESTIONS[a], 'system', s));
  }

  addQuest(t: QuestTemplate & { weekdays?: number[] }): void {
    this.mutate((s) => s.quests.push(this.buildQuest(t, 'user', s)));
    const dailies = this._state().quests.filter((q) => q.type === 'daily').length;
    if (t.type === 'daily' && dailies > this.maxDailySlots()) {
      this.emit({ kind: 'system', title: 'AVISO', message: 'Um caçador sobrecarregado cai no primeiro andar. Considere manter no máximo 7 Diárias.', tone: 'red' });
    }
  }

  updateQuest(id: string, patch: Partial<Pick<Quest, 'title' | 'attribute' | 'difficulty' | 'target' | 'unit' | 'weekdays'>>): void {
    this.mutate((s) => {
      const q = s.quests.find((x) => x.id === id);
      if (q) Object.assign(q, patch);
    });
  }

  deleteQuest(id: string): void {
    this.mutate((s) => (s.quests = s.quests.filter((q) => q.id !== id)));
  }

  previewReward(q: Quest): RewardPreview {
    return this.calcReward(q, this._state());
  }

  private calcReward(q: Quest, s: GameState): RewardPreview {
    const d = DIFFICULTY[q.difficulty];
    let mult = 1 + streakBonus(s.streak);
    for (const item of this.equippedItems()) {
      if (item.xpBonus && (!item.xpAttribute || item.xpAttribute === q.attribute)) mult += item.xpBonus;
    }
    if (s.heroClass && CLASSES[s.heroClass].attribute === q.attribute) mult += 0.1;
    if (q.attribute === 'FOR') mult += Math.floor(s.attributes.FOR / 10) * 0.01;
    if (q.attribute === 'INT') mult += Math.floor(s.attributes.INT / 10) * 0.01;
    let xp = d.xp * TYPE_MULT[q.type] * mult;
    if (s.focusUntil && s.focusUntil > Date.now()) xp *= 2;
    if (s.penaltyUntil && s.penaltyUntil > Date.now()) xp *= 0.75;
    if (q.origin === 'user' && s.userCompletionsToday >= ANTI_FARM_AFTER) xp *= 0.5;
    const gold = d.gold * TYPE_MULT[q.type] * (1 + this.bonuses().gold);
    return { xp: Math.round(xp), gold: Math.round(gold) };
  }

  increment(id: string, amount = 1): void {
    const q = this._state().quests.find((x) => x.id === id);
    if (!q || q.status !== 'pending') return;
    const next = Math.min(q.target, q.progress + amount);
    if (next >= q.target) {
      this.complete(id);
    } else {
      this.fx.tap();
      this.mutate((s) => {
        const t = s.quests.find((x) => x.id === id)!;
        t.progress = next;
      });
    }
  }

  toggleCheck(id: string, index: number): void {
    const q = this._state().quests.find((x) => x.id === id);
    if (!q || q.status !== 'pending' || !q.checks) return;
    const checks = q.checks.map((c, i) => (i === index ? !c : c));
    const done = checks.filter(Boolean).length;
    if (done >= checks.length) {
      this.complete(id);
      return;
    }
    this.fx.tap();
    this.mutate((s) => {
      const t = s.quests.find((x) => x.id === id)!;
      t.checks = checks;
      t.progress = done;
    });
  }

  addFromLibrary(templateId: string, level: Level, type?: QuestType): void {
    this.addQuest(fromLibrary(templateId, level, type));
    this.fx.success();
  }

  hasTemplate(templateId: string): boolean {
    return this._state().quests.some((q) => q.templateId === templateId);
  }

  readonly recommendedLevel = computed(() => levelForRank(this._state().rank));

  /**
   * O Sistema analisa o jogador e propõe missões:
   * atributos fracos, objetivos escolhidos, áreas sem missão, limite de Diárias
   * e taxa de conclusão recente (se estiver baixa, escolhe missões mais leves).
   */
  recommend(count = 3): Recommendation {
    const s = this._state();
    const level = this.recommendedLevel();
    const active = s.quests;
    const dailies = active.filter((q) => q.type === 'daily').length;
    let dailyRoom = Math.max(0, this.maxDailySlots() - dailies);
    const objectiveAttrs = new Set(OBJECTIVES.filter((o) => s.objectives.includes(o.key)).map((o) => o.attribute));
    const countByAttr = (a: AttributeKey) => active.filter((q) => q.attribute === a).length;

    const from = addDays(this.today(), -7);
    const recent = s.history.filter((h) => h.date >= from && h.date < this.today() && h.total > 0);
    const rate = recent.length ? recent.reduce((a, h) => a + h.done / h.total, 0) / recent.length : null;
    const struggling = rate !== null && rate < 0.6;

    const score = (a: AttributeKey) => s.attributes[a] + countByAttr(a) * 3 - (objectiveAttrs.has(a) ? 2 : 0) + Math.random() * 1.5;
    const order = [...ATTRIBUTE_KEYS].sort((a, b) => score(a) - score(b));

    const analysis: string[] = [];
    const weakest = [...ATTRIBUTE_KEYS].sort((a, b) => s.attributes[a] - s.attributes[b])[0];
    analysis.push(`Atributo mais fraco: ${ATTRIBUTES[weakest].name} (${s.attributes[weakest]}).`);
    const empty = ATTRIBUTE_KEYS.filter((a) => countByAttr(a) === 0);
    if (empty.length) analysis.push(`Áreas sem nenhuma missão: ${empty.map((a) => ATTRIBUTES[a].name).join(', ')}.`);
    if (rate !== null) analysis.push(`Conclusão das Diárias nos últimos 7 dias: ${Math.round(rate * 100)}%.`);
    if (struggling) analysis.push('Sua constância está baixa. O Sistema escolheu missões mais leves para você retomar o ritmo.');
    if (dailyRoom === 0) analysis.push(`Você já tem ${dailies} Diárias. Para não sobrecarregar, o Sistema propõe metas Semanais e Avulsas.`);
    analysis.push(`Nível de execução recomendado para o Rank ${s.rank}: ${LEVEL_LABEL[level]}.`);

    const used = new Set(active.map((q) => q.templateId).filter(Boolean));
    const picks: Proposal[] = [];
    const light = (d: Difficulty) => d === 'trivial' || d === 'easy';

    for (const attr of [...order, ...order]) {
      if (picks.length >= count) break;
      if (picks.some((p) => p.template.attribute === attr) && picks.length < ATTRIBUTE_KEYS.length) continue;
      let pool = LIBRARY.filter((t) => t.attribute === attr && !used.has(t.id) && !picks.some((p) => p.template.id === t.id));
      if (dailyRoom === 0) pool = pool.filter((t) => t.type !== 'daily');
      if (struggling) {
        const easy = pool.filter((t) => light(resolveTemplate(t, level).difficulty));
        if (easy.length) pool = easy;
      }
      if (!pool.length) continue;
      const template = pool[Math.floor(Math.random() * pool.length)];
      const type = template.type;
      if (type === 'daily') dailyRoom--;

      let reason: string;
      if (countByAttr(attr) === 0) reason = `Você não tem nenhuma missão de ${ATTRIBUTES[attr].name}.`;
      else if (attr === weakest) reason = `${ATTRIBUTES[attr].name} é seu atributo mais fraco.`;
      else if (objectiveAttrs.has(attr)) reason = `Alinhada ao seu objetivo (${ATTRIBUTES[attr].area}).`;
      else reason = `Equilibra seu radar em ${ATTRIBUTES[attr].name}.`;
      picks.push({ template, level, type, reason });
    }
    return { analysis, proposals: picks };
  }

  complete(id: string, opts: { bonusXp?: number } = {}): void {
    const before = this._state();
    const q = before.quests.find((x) => x.id === id);
    if (!q || q.status !== 'pending') return;
    this.undoSnapshot = { state: structuredClone(before), expires: Date.now() + 5000 };

    const reward = this.calcReward(q, before);
    const xpGain = reward.xp + (opts.bonusXp ?? 0);
    const events: GameEvent[] = [{ kind: 'reward', xp: xpGain, gold: reward.gold, attribute: q.attribute }];

    this.mutate((s) => {
      const t = s.quests.find((x) => x.id === id)!;
      t.status = 'done';
      t.progress = t.target;
      if (t.checks) t.checks = t.checks.map(() => true);
      t.completedAt = Date.now();
      t.totalCompletions++;
      t.failStreak = 0;
      s.totalCompleted++;
      if (t.origin === 'user') s.userCompletionsToday++;
      s.gold += reward.gold;
      s.stats.goldEarned += reward.gold;
      s.stats.byAttr[t.attribute]++;
      s.stats.byType[t.type]++;
      if (t.checks) s.stats.checklists++;
      if (new Date().getHours() < 8) s.stats.early++;

      s.attributeXp[t.attribute] += Math.round(xpGain * 0.5);
      while (s.attributeXp[t.attribute] >= ATTRIBUTE_XP_STEP) {
        s.attributeXp[t.attribute] -= ATTRIBUTE_XP_STEP;
        s.attributes[t.attribute]++;
      }

      const rec = this.dayRecord(s, s.lastDayKey);
      rec.xp += xpGain;

      if (s.exam?.status === 'active' && t.difficulty === 'epic') s.exam.epicDone = true;

      if (s.penaltyUntil && s.penaltyUntil > Date.now() && (t.difficulty === 'trivial' || t.difficulty === 'easy')) {
        s.penaltyProgress++;
        if (s.penaltyProgress >= 3) {
          s.penaltyUntil = null;
          s.penaltyProgress = 0;
          s.hp = Math.round(MAX_HP * 0.5);
          s.stats.escapes++;
          events.push({ kind: 'system', title: 'SOBREVIVÊNCIA CONFIRMADA', message: 'Você saiu da Zona de Penalidade. HP restaurado para 50%.', tone: 'blue' });
        }
      }

      const dropChance = DIFFICULTY[t.difficulty].drop * (t.type === 'daily' || t.type === 'todo' ? 1 : 1.5) + this.bonuses().drop;
      if (Math.random() < dropChance) {
        const itemId = this.rollItem(rollRarity(Math.random));
        this.addItem(s, itemId);
        s.stats.items++;
        events.push({ kind: 'item', itemId, source: 'Drop de missão' });
      }

      this.gainXp(s, xpGain, events);
    });

    for (const e of events) if (e.kind !== 'reward') this.emit(e);
    this.emit(events[0]);
    if (events.some((e) => e.kind === 'levelup')) this.fx.heavy();
    else this.fx.success();
  }

  private gainXp(s: GameState, amount: number, events: GameEvent[]): void {
    s.xp += amount;
    let leveled = 0;
    while (s.xp >= xpToNext(s.level)) {
      s.xp -= xpToNext(s.level);
      s.level++;
      leveled++;
    }
    if (leveled > 0) {
      s.freePoints += 3 * leveled;
      s.hp = MAX_HP;
      s.mana = MAX_MANA;
      events.push({ kind: 'levelup', level: s.level, points: 3 * leveled });
      const nr = nextRank(s.rank);
      if (nr && s.level >= nr.minLevel && !s.exam) {
        events.push({ kind: 'system', title: 'EXAME DE PROMOÇÃO DISPONÍVEL', message: `Você atingiu o nível mínimo do Rank ${nr.rank}. Abra a aba Portais para iniciar o Exame.`, tone: 'violet' });
      }
      if (s.level >= 10 && !s.heroClass) {
        events.push({ kind: 'system', title: 'DESPERTAR', message: 'Você pode escolher uma classe. Abra o seu Perfil.', tone: 'violet' });
      }
    }
  }

  canUndo(): boolean {
    return !!this.undoSnapshot && this.undoSnapshot.expires > Date.now();
  }

  undo(): void {
    if (!this.canUndo()) return;
    this._state.set(this.undoSnapshot!.state);
    this.undoSnapshot = null;
    this.events.set([]);
    this.fx.tap();
  }

  postpone(id: string): boolean {
    const s = this._state();
    const q = s.quests.find((x) => x.id === id);
    if (!q || q.status !== 'pending' || s.mana < SKILL_COST.postpone) {
      this.fx.warn();
      return false;
    }
    this.mutate((d) => {
      d.mana -= SKILL_COST.postpone;
      d.quests.find((x) => x.id === id)!.status = 'skipped';
    });
    this.fx.tap();
    return true;
  }

  activateFocus(): boolean {
    if (this._state().mana < SKILL_COST.focus || this.focusActive()) {
      this.fx.warn();
      return false;
    }
    this.mutate((s) => {
      s.mana -= SKILL_COST.focus;
      s.focusUntil = Date.now() + FOCUS_MINUTES * 60_000;
      s.stats.focus++;
    });
    this.now.set(Date.now());
    this.fx.success();
    return true;
  }

  private dayRecord(s: GameState, date: string) {
    let rec = s.history.find((h) => h.date === date);
    if (!rec) {
      rec = { date, done: 0, total: 0, xp: 0 };
      s.history.push(rec);
      if (s.history.length > 400) s.history.shift();
    }
    return rec;
  }

  private processResets(): void {
    const now = new Date();
    const s0 = this._state();
    const rh = s0.settings.resetHour;
    const today = dayKey(now, rh);
    const week = weekKey(now, rh);
    const month = monthKey(now, rh);
    if (s0.lastDayKey === today && s0.lastWeekKey === week && s0.lastMonthKey === month) return;

    const events: GameEvent[] = [];
    this.mutate((s) => {
      if (s.lastDayKey !== today) this.closeDay(s, today, events);
      if (s.lastWeekKey !== week) {
        for (const q of s.quests.filter((x) => x.type === 'weekly')) this.resetInstance(q, week);
        this.suggestWeeklies(s);
        s.lastWeekKey = week;
        events.push({ kind: 'system', title: 'NOVA SEMANA', message: 'Missões semanais renovadas. O Sistema sugeriu 2 metas para seus atributos mais fracos.' });
      }
      if (s.lastMonthKey !== month) {
        for (const q of s.quests.filter((x) => x.type === 'monthly')) this.resetInstance(q, month);
        s.lastMonthKey = month;
      }
    });
    for (const e of events) this.emit(e);
    this.scheduleSurprise();
  }

  private resetInstance(q: Quest, period: string): void {
    if (q.status === 'pending' && q.period !== period) q.status = 'failed';
    q.period = period;
    q.progress = 0;
    q.status = 'pending';
    q.completedAt = undefined;
    if (q.checks) q.checks = q.checks.map(() => false);
  }

  private closeDay(s: GameState, today: string, events: GameEvent[]): void {
    const prev = s.lastDayKey;
    const prevDate = new Date(prev + 'T12:00:00');
    const wd = prevDate.getDay();
    const vacation = !!s.settings.vacationUntil && s.settings.vacationUntil >= prev;
    const rest = s.settings.restDay === wd;
    const required = s.quests.filter((q) => q.type === 'daily' && q.weekdays.includes(wd) && q.period === prev);
    const failed = required.filter((q) => q.status === 'pending');
    const done = required.filter((q) => q.status === 'done').length;

    const rec = this.dayRecord(s, prev);
    rec.done = done;
    rec.total = required.length;

    const exempt = vacation || rest;
    const frozen = !!s.streakFrozenUntil && s.streakFrozenUntil >= prev;
    const perfect = exempt || failed.length === 0;
    const gap = daysBetween(prev, today) - 1; // dias sem abrir o app

    // Dano de HP (apenas pelo último dia; nunca tira nível/itens)
    if (!exempt && failed.length > 0) {
      const dmg = Math.round(failed.length * DAILY_FAIL_DAMAGE * (1 - this.bonuses().shield));
      s.hp = Math.max(0, s.hp - dmg);
      events.push({
        kind: 'system', tone: 'red', title: 'RELATÓRIO DO DIA',
        message: `${failed.length} missão(ões) diária(s) não cumprida(s). −${dmg} HP.`,
      });
      for (const q of failed) {
        q.failStreak++;
        if (q.failStreak >= 3 && q.target > 1) {
          const old = q.target;
          q.target = Math.max(1, Math.round(q.target * 0.75));
          q.failStreak = 0;
          events.push({ kind: 'system', title: 'AJUSTE DO SISTEMA', message: `"${q.title}" falhou 3 dias seguidos. Meta ajustada: ${old} → ${q.target}. Você pode editar quando quiser.` });
        }
      }
    }

    if (frozen || vacation) {
      /* mantém */
    } else if (perfect && gap <= 0) {
      if (!rest && required.length > 0) s.streak++;
    } else {
      if (s.streak > 0) events.push({ kind: 'system', tone: 'red', title: 'SEQUÊNCIA PERDIDA', message: `Sua sequência de ${s.streak} dias foi encerrada. Recomece hoje.` });
      s.streak = 0;
    }
    s.streakMax = Math.max(s.streakMax, s.streak);

    if (s.exam?.status === 'active') {
      if (perfect && gap <= 0) {
        s.exam.perfectDays++;
        if (s.exam.perfectDays >= 7 && s.exam.epicDone) {
          s.rank = s.exam.targetRank;
          s.exam.status = 'passed';
          s.crystals += 50;
          for (const q of s.quests.filter((x) => x.type === 'daily' && x.target > 1)) {
            q.target = Math.round(q.target * (rankTargetScale(s.rank) / rankTargetScale(this.prevRank(s.rank))));
          }
          events.push({ kind: 'rankup', rank: s.rank });
          events.push({ kind: 'system', title: 'ADAPTAÇÃO', message: 'Seu corpo se adaptou. As metas das Diárias aumentaram.' });
        }
      } else {
        s.exam.status = 'failed';
        s.exam.retryAfter = addDays(today, 3);
        events.push({ kind: 'system', tone: 'red', title: 'EXAME INTERROMPIDO', message: 'Você poderá tentar novamente em 3 dias. Nada foi perdido.' });
      }
    }
    if (s.exam && s.exam.status === 'passed') s.exam = null;

    if (s.hp <= 0 && !(s.penaltyUntil && s.penaltyUntil > Date.now())) {
      s.penaltyUntil = Date.now() + 24 * 3600_000;
      s.penaltyProgress = 0;
      events.push({ kind: 'system', tone: 'red', title: 'ZONA DE PENALIDADE', message: 'Seu HP chegou a 0. Por 24h o XP será reduzido em 25%. Missão de recuperação: complete 3 tarefas fáceis.' });
      this.fx.warn();
    }

    for (const q of s.quests.filter((x) => x.type === 'daily')) this.resetInstance(q, today);
    s.quests = s.quests.filter((q) => !(q.type === 'todo' && q.status === 'done' && q.completedAt && Date.now() - q.completedAt > 86400_000));
    s.mana = MAX_MANA;
    s.userCompletionsToday = 0;
    s.lastDayKey = today;
  }

  private prevRank(r: GameState['rank']): GameState['rank'] {
    const order: GameState['rank'][] = ['E', 'D', 'C', 'B', 'A', 'S'];
    return order[Math.max(0, order.indexOf(r) - 1)];
  }

  private processPenaltyExpiry(): void {
    const s = this._state();
    if (s.penaltyUntil && s.penaltyUntil <= Date.now()) {
      this.mutate((d) => {
        d.penaltyUntil = null;
        d.penaltyProgress = 0;
        d.hp = Math.max(d.hp, 30);
      });
    }
  }

  private scheduleSurprise(): void {
    const s = this._state();
    const today = this.today();
    if (s.surprise?.date === today) return;
    const now = new Date();
    const start = new Date(now);
    start.setHours(9, 0, 0, 0);
    const end = new Date(now);
    end.setHours(21, 0, 0, 0);
    const from = Math.max(start.getTime(), now.getTime() + 10 * 60_000);
    if (from >= end.getTime()) return;
    const appearsAt = from + Math.random() * (end.getTime() - from);
    this.mutate((d) => {
      d.surprise = {
        date: today,
        title: SURPRISE_QUESTS[Math.floor(Math.random() * SURPRISE_QUESTS.length)],
        appearsAt,
        expiresAt: appearsAt + 3600_000,
        status: 'scheduled',
        xp: 40,
      };
    });
  }

  private processSurprise(): void {
    const sp = this._state().surprise;
    if (!sp) return;
    const t = Date.now();
    if (sp.status === 'scheduled' && t >= sp.appearsAt) {
      this.mutate((d) => (d.surprise!.status = t < sp.expiresAt ? 'active' : 'expired'));
      if (t < sp.expiresAt) {
        this.emit({ kind: 'system', title: 'MISSÃO OCULTA', message: `${sp.title}. Expira em 1h. Recompensa: +${sp.xp} XP.`, tone: 'violet' });
        this.fx.tap();
      }
    } else if (sp.status === 'active' && t >= sp.expiresAt) {
      this.mutate((d) => (d.surprise!.status = 'expired'));
    }
  }

  completeSurprise(): void {
    const sp = this._state().surprise;
    if (!sp || sp.status !== 'active') return;
    const events: GameEvent[] = [{ kind: 'reward', xp: sp.xp, gold: 10, attribute: 'AGI' }];
    this.mutate((s) => {
      s.surprise!.status = 'done';
      s.gold += 10;
      s.stats.goldEarned += 10;
      s.stats.surprises++;
      this.gainXp(s, sp.xp, events);
    });
    for (const e of events) this.emit(e);
    this.fx.success();
  }

  private rollItem(rarity: Rarity): string {
    let idx = RARITY_ORDER.indexOf(rarity);
    while (idx >= 0) {
      const pool = ITEMS.filter((i) => i.rarity === RARITY_ORDER[idx] && i.type !== 'key');
      if (pool.length) return pool[Math.floor(Math.random() * pool.length)].id;
      idx--;
    }
    return 'potion_hp';
  }

  private addItem(s: GameState, itemId: string): void {
    const def = ITEM_MAP[itemId];
    const stackable = def.type === 'consumable' || def.type === 'key';
    const existing = stackable ? s.inventory.find((e) => e.itemId === itemId) : undefined;
    if (existing) existing.qty++;
    else s.inventory.push({ uid: uid(), itemId, qty: 1, upgrade: 0 });
  }

  readonly chestOdds = (kind: ChestKind) => {
    const min: Rarity = kind === 'daily' ? 'common' : 'rare';
    const pool = RARITY_ORDER.filter((r, i) => i >= RARITY_ORDER.indexOf(min) && RARITY[r].weight > 0);
    const total = pool.reduce((s, r) => s + RARITY[r].weight, 0);
    return pool.map((r) => ({ rarity: r, pct: (RARITY[r].weight / total) * 100 }));
  };

  openChest(kind: ChestKind): void {
    if (!this.chestAvailable()[kind]) return;
    const events: GameEvent[] = [];
    const now = new Date();
    const rh = this._state().settings.resetHour;
    this.mutate((s) => {
      let min: Rarity = kind === 'daily' ? 'common' : 'rare';
      if (s.chestPity >= PITY_LIMIT - 1) min = 'epic';
      let rarity = rollRarity(Math.random, min);
      if (kind === 'monthly' && Math.random() < 0.3 && RARITY_ORDER.indexOf(rarity) < 3) rarity = 'epic';
      const itemId = this.rollItem(rarity);
      this.addItem(s, itemId);
      s.stats.chests++;
      s.stats.items++;
      s.chestPity = RARITY_ORDER.indexOf(rarity) >= 3 ? 0 : s.chestPity + 1;
      const label = { daily: 'Baú Diário', weekly: 'Baú Semanal', monthly: 'Baú Mensal' }[kind];
      events.push({ kind: 'item', itemId, source: label });
      if (kind === 'daily') {
        s.chests.daily = dayKey(now, rh);
        const g = 20 + Math.floor(Math.random() * 20);
        s.gold += g;
        s.stats.goldEarned += g;
      } else if (kind === 'weekly') {
        s.chests.weekly = weekKey(now, rh);
        s.crystals += 10;
      } else {
        s.chests.monthly = monthKey(now, rh);
        s.crystals += 30;
        const title = `Conquistador de ${now.toLocaleDateString('pt-BR', { month: 'long' })}`;
        if (!s.titles.includes(title)) s.titles.push(title);
        events.push({ kind: 'system', title: 'TÍTULO OBTIDO', message: `"${title}" foi adicionado aos seus títulos.`, tone: 'gold' });
      }
    });
    for (const e of events) this.emit(e);
    this.fx.heavy();
  }

  equip(entryUid: string): void {
    const s = this._state();
    const entry = s.inventory.find((e) => e.uid === entryUid);
    if (!entry) return;
    const def = ITEM_MAP[entry.itemId];
    if (def.minLevel > s.level) {
      this.fx.warn();
      return;
    }
    this.mutate((d) => {
      const eq = d.equipment;
      if (def.type === 'weapon') eq.weapon = entryUid;
      else if (def.type === 'armor') eq.armor = entryUid;
      else if (def.type === 'accessory') {
        if (eq.acc1 === entryUid || eq.acc2 === entryUid) return;
        if (!eq.acc1) eq.acc1 = entryUid;
        else if (!eq.acc2) eq.acc2 = entryUid;
        else eq.acc1 = entryUid;
      }
    });
    this.fx.tap();
  }

  unequip(slot: keyof Equipment): void {
    this.mutate((s) => (s.equipment[slot] = null));
    this.fx.tap();
  }

  isEquipped(entryUid: string): boolean {
    return Object.values(this._state().equipment).includes(entryUid);
  }

  useItem(entryUid: string): void {
    const entry = this._state().inventory.find((e) => e.uid === entryUid);
    if (!entry) return;
    const def = ITEM_MAP[entry.itemId];
    let msg = '';
    this.mutate((s) => {
      const e = s.inventory.find((x) => x.uid === entryUid)!;
      switch (def.use) {
        case 'heal':
          s.hp = Math.min(MAX_HP, s.hp + 30);
          msg = '+30 HP';
          break;
        case 'mana':
          s.mana = Math.min(MAX_MANA, s.mana + 50);
          msg = '+50 Mana';
          break;
        case 'focus':
          s.focusUntil = Math.max(Date.now(), s.focusUntil ?? 0) + 3600_000;
          msg = 'XP ×2 por 1 hora';
          break;
        case 'freeze':
          s.streakFrozenUntil = this.today();
          msg = 'Sequência protegida hoje';
          break;
        default:
          return;
      }
      e.qty--;
      if (e.qty <= 0) s.inventory = s.inventory.filter((x) => x.uid !== entryUid);
    });
    this.now.set(Date.now());
    if (msg) this.emit({ kind: 'system', title: 'ITEM USADO', message: `${def.name}: ${msg}.` });
    this.fx.success();
  }

  dismantle(entryUid: string): void {
    const entry = this._state().inventory.find((e) => e.uid === entryUid);
    if (!entry || this.isEquipped(entryUid)) return;
    const gain = [1, 3, 8, 20, 50, 120][RARITY_ORDER.indexOf(ITEM_MAP[entry.itemId].rarity)];
    this.mutate((s) => {
      s.essence += gain;
      const e = s.inventory.find((x) => x.uid === entryUid)!;
      e.qty--;
      if (e.qty <= 0) s.inventory = s.inventory.filter((x) => x.uid !== entryUid);
    });
    this.fx.tap();
  }

  upgradeCost(entryUid: string): number {
    const entry = this._state().inventory.find((e) => e.uid === entryUid);
    if (!entry) return 0;
    return (entry.upgrade + 1) * (RARITY_ORDER.indexOf(ITEM_MAP[entry.itemId].rarity) + 1) * 3;
  }

  upgrade(entryUid: string): void {
    const cost = this.upgradeCost(entryUid);
    const entry = this._state().inventory.find((e) => e.uid === entryUid);
    if (!entry || entry.upgrade >= 10 || this._state().essence < cost) {
      this.fx.warn();
      return;
    }
    this.mutate((s) => {
      s.essence -= cost;
      s.inventory.find((x) => x.uid === entryUid)!.upgrade++;
    });
    this.fx.success();
  }

  price(base: number): number {
    return Math.round(base * (1 - this.bonuses().shopDiscount));
  }

  buyItem(itemId: string, basePrice: number): boolean {
    const price = this.price(basePrice);
    if (this._state().gold < price) {
      this.fx.warn();
      return false;
    }
    this.mutate((s) => {
      s.gold -= price;
      this.addItem(s, itemId);
    });
    this.fx.success();
    return true;
  }

  addCustomReward(name: string, price: number): void {
    this.mutate((s) => s.customRewards.push({ id: uid(), name: name.trim(), price: Math.max(1, Math.round(price)), redeemed: 0 }));
  }

  deleteCustomReward(id: string): void {
    this.mutate((s) => (s.customRewards = s.customRewards.filter((r) => r.id !== id)));
  }

  redeemCustomReward(id: string): boolean {
    const r = this._state().customRewards.find((x) => x.id === id);
    if (!r || this._state().gold < r.price) {
      this.fx.warn();
      return false;
    }
    this.mutate((s) => {
      s.gold -= r.price;
      s.customRewards.find((x) => x.id === id)!.redeemed++;
      s.stats.redeemed++;
    });
    this.emit({ kind: 'system', title: 'RECOMPENSA RESGATADA', message: `Aproveite: ${r.name}. Você mereceu.`, tone: 'gold' });
    this.fx.success();
    return true;
  }

  allocatePoint(attr: AttributeKey): void {
    if (this._state().freePoints <= 0) return;
    this.mutate((s) => {
      s.freePoints--;
      s.attributes[attr]++;
    });
    this.fx.tap();
  }

  chooseClass(c: ClassKey): void {
    if (this._state().level < 10 || this._state().heroClass) return;
    this.mutate((s) => {
      s.heroClass = c;
      s.attributes[CLASSES[c].attribute] += 5;
    });
    this.emit({ kind: 'system', title: 'DESPERTAR CONCLUÍDO', message: `Classe adquirida: ${CLASSES[c].name}. ${ATTRIBUTES[CLASSES[c].attribute].name} +5.`, tone: 'violet' });
    this.fx.heavy();
  }

  setTitle(title: string | null): void {
    this.mutate((s) => (s.title = title));
  }

  startExam(): void {
    const s = this._state();
    const nr = nextRank(s.rank);
    if (!nr || s.level < nr.minLevel) return;
    if (s.exam?.status === 'active') return;
    if (s.exam?.status === 'failed' && s.exam.retryAfter && s.exam.retryAfter > this.today()) return;
    this.mutate((d) => {
      d.exam = { targetRank: nr.rank, startedOn: this.today(), perfectDays: 0, epicDone: false, status: 'active' };
      d.quests.push(
        this.buildQuest({ title: `Prova do Rank ${nr.rank}: desafio Épico`, type: 'todo', attribute: 'FOR', difficulty: 'epic', target: 1, unit: '' }, 'system', d),
      );
    });
    this.emit({ kind: 'system', title: 'EXAME INICIADO', message: 'Complete 100% das Diárias por 7 dias e conclua 1 missão Épica. Boa sorte, Caçador.', tone: 'violet' });
    this.fx.heavy();
  }

  updateSettings(patch: Partial<GameState['settings']>): void {
    this.mutate((s) => Object.assign(s.settings, patch));
  }

  setVacation(days: number | null): void {
    this.updateSettings({ vacationUntil: days ? addDays(this.today(), days - 1) : null });
  }

  async resetAll(): Promise<void> {
    await Preferences.remove({ key: STORAGE_KEY });
    this._state.set(initialState());
    this.events.set([]);
  }

  suggestDifficulty(title: string, target: number, unit: string): Difficulty {
    const t = title.toLowerCase();
    const mins = unit.startsWith('min') ? target : unit === 'h' ? target * 60 : 0;
    if (mins >= 120 || /maratona|10 ?km|projeto/.test(t)) return 'hard';
    if (mins >= 30 || target >= 50) return 'medium';
    if (mins > 0 && mins <= 5) return 'trivial';
    return 'easy';
  }
}
