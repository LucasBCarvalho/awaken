export type AttributeKey = 'FOR' | 'VIT' | 'AGI' | 'INT' | 'PER' | 'CAR';
export type QuestType = 'daily' | 'weekly' | 'monthly' | 'todo';
export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';
export type QuestStatus = 'pending' | 'done' | 'failed' | 'skipped';
export type QuestOrigin = 'user' | 'system' | 'template';
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'key' | 'cosmetic';
export type ClassKey = 'warrior' | 'assassin' | 'mage' | 'healer' | 'strategist' | 'bard';
export type ChestKind = 'daily' | 'weekly' | 'monthly';

export interface Quest {
  id: string;
  title: string;
  type: QuestType;
  attribute: AttributeKey;
  difficulty: Difficulty;
  /** Meta numérica (1 = checkbox). */
  target: number;
  unit: string;
  /** Dias da semana ativos (0 = domingo). Só para diárias. */
  weekdays: number[];
  origin: QuestOrigin;
  createdAt: number;
  // Instância do período atual (quest_instance simplificada)
  period: string;
  progress: number;
  status: QuestStatus;
  completedAt?: number;
  /** Quantas vezes já foi concluída (usado para extrair Sombras no futuro). */
  totalCompletions: number;
  /** Falhas seguidas (ajuste automático de dificuldade). */
  failStreak: number;
  /** Modelo da Biblioteca (guia "como fazer" e etapas). */
  templateId?: string;
  level?: 1 | 2 | 3;
  /** Etapas marcadas no período atual (treinos/rotinas). */
  checks?: boolean[];
}

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  icon: string;
  description: string;
  minLevel: number;
  /** Bônus percentual de XP (0.05 = +5%) — opcionalmente restrito a um atributo. */
  xpBonus?: number;
  xpAttribute?: AttributeKey;
  goldBonus?: number;
  dropBonus?: number;
  /** Redução de perda de HP (0.2 = -20%). */
  hpShield?: number;
  /** Efeito ao usar (consumíveis). */
  use?: 'heal' | 'focus' | 'freeze' | 'mana';
  price?: number;
}

export interface InventoryEntry {
  uid: string;
  itemId: string;
  qty: number;
  upgrade: number;
}

export interface Equipment {
  weapon: string | null;
  armor: string | null;
  acc1: string | null;
  acc2: string | null;
}

export interface CustomReward {
  id: string;
  name: string;
  price: number;
  redeemed: number;
}

export interface DayRecord {
  date: string;
  done: number;
  total: number;
  xp: number;
}

export interface SurpriseQuest {
  date: string;
  title: string;
  appearsAt: number;
  expiresAt: number;
  status: 'scheduled' | 'active' | 'done' | 'expired';
  xp: number;
}

export interface PromotionExam {
  targetRank: Rank;
  startedOn: string;
  perfectDays: number;
  epicDone: boolean;
  status: 'active' | 'passed' | 'failed';
  retryAfter?: string;
}

export interface Settings {
  resetHour: number;
  restDay: number | null;
  reduceMotion: boolean;
  glow: boolean;
  haptics: boolean;
  sound: boolean;
  vacationUntil: string | null;
}

export interface Chests {
  daily: string | null; // período em que foi coletado
  weekly: string | null;
  monthly: string | null;
}

export interface GameState {
  version: number;
  onboarded: boolean;
  hunterName: string;
  objectives: string[];
  level: number;
  xp: number;
  rank: Rank;
  heroClass: ClassKey | null;
  title: string | null;
  titles: string[];
  hp: number;
  mana: number;
  gold: number;
  crystals: number;
  essence: number;
  streak: number;
  streakMax: number;
  streakFrozenUntil: string | null;
  freePoints: number;
  attributes: Record<AttributeKey, number>;
  attributeXp: Record<AttributeKey, number>;
  quests: Quest[];
  inventory: InventoryEntry[];
  equipment: Equipment;
  customRewards: CustomReward[];
  history: DayRecord[];
  chests: Chests;
  chestPity: number;
  lastDayKey: string;
  lastWeekKey: string;
  lastMonthKey: string;
  userCompletionsToday: number;
  focusUntil: number | null;
  penaltyUntil: number | null;
  penaltyProgress: number;
  surprise: SurpriseQuest | null;
  exam: PromotionExam | null;
  totalCompleted: number;
  settings: Settings;
  /** Contadores para conquistas. */
  stats: Stats;
  /** Nível de conquista desbloqueado por id (0–5). */
  achievements: Record<string, number>;
}

export interface Stats {
  byAttr: Record<AttributeKey, number>;
  byType: Record<QuestType, number>;
  checklists: number;
  early: number;
  focus: number;
  surprises: number;
  chests: number;
  items: number;
  goldEarned: number;
  redeemed: number;
  escapes: number;
}

/** Eventos de feedback consumidos pela camada visual (janelas do Sistema, level up). */
export type GameEvent =
  | { kind: 'reward'; xp: number; gold: number; attribute: AttributeKey }
  | { kind: 'item'; itemId: string; source: string }
  | { kind: 'levelup'; level: number; points: number }
  | { kind: 'system'; title: string; message: string; tone?: 'blue' | 'red' | 'violet' | 'gold' }
  | { kind: 'rankup'; rank: Rank }
  | { kind: 'achievement'; id: string; tier: number };
