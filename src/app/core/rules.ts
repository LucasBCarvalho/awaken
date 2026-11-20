import { AttributeKey, Difficulty, QuestType, Rank, Rarity } from './models';

export function xpToNext(level: number): number {
  return Math.ceil(50 * Math.pow(level, 1.3));
}

export const DIFFICULTY: Record<Difficulty, { label: string; xp: number; gold: number; drop: number }> = {
  trivial: { label: 'Trivial', xp: 10, gold: 2, drop: 0.04 },
  easy: { label: 'Fácil', xp: 25, gold: 5, drop: 0.08 },
  medium: { label: 'Média', xp: 50, gold: 12, drop: 0.14 },
  hard: { label: 'Difícil', xp: 100, gold: 25, drop: 0.22 },
  epic: { label: 'Épica', xp: 250, gold: 60, drop: 0.45 },
};

export const TYPE_MULT: Record<QuestType, number> = {
  daily: 1,
  weekly: 2.5,
  monthly: 6,
  todo: 1,
};

export const TYPE_LABEL: Record<QuestType, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  todo: 'Avulsa',
};

export function streakBonus(streak: number): number {
  return Math.min(0.5, Math.floor(streak / 7) * 0.05);
}

export const RANKS: { rank: Rank; minLevel: number; unlock: string }[] = [
  { rank: 'E', minLevel: 1, unlock: 'Missões diárias, inventário básico' },
  { rank: 'D', minLevel: 10, unlock: 'Semanais avançadas, loja completa' },
  { rank: 'C', minLevel: 25, unlock: 'Dungeons, primeira Sombra' },
  { rank: 'B', minLevel: 40, unlock: 'Raids mensais, crafting' },
  { rank: 'A', minLevel: 60, unlock: 'Itens épicos, títulos raros' },
  { rank: 'S', minLevel: 80, unlock: 'Classe secreta, aura mítica' },
];

export function nextRank(rank: Rank): (typeof RANKS)[number] | null {
  const i = RANKS.findIndex((r) => r.rank === rank);
  return RANKS[i + 1] ?? null;
}

export function rankIndex(rank: Rank): number {
  return RANKS.findIndex((r) => r.rank === rank);
}

export function rankTargetScale(rank: Rank): number {
  return 1 + rankIndex(rank) * 0.25;
}

export const ATTRIBUTES: Record<AttributeKey, { name: string; area: string; icon: string; color: string }> = {
  FOR: { name: 'Força', area: 'Exercício', icon: 'barbell', color: '#FF7A59' },
  VIT: { name: 'Vitalidade', area: 'Saúde e sono', icon: 'heart', color: '#3DDC97' },
  AGI: { name: 'Agilidade', area: 'Produtividade', icon: 'flash', color: '#5CC8FF' },
  INT: { name: 'Inteligência', area: 'Estudo e leitura', icon: 'book', color: '#9D7BFF' },
  PER: { name: 'Percepção', area: 'Mente e organização', icon: 'eye', color: '#A6F0FF' },
  CAR: { name: 'Carisma', area: 'Social e família', icon: 'people', color: '#F5C451' },
};

export const ATTRIBUTE_KEYS: AttributeKey[] = ['FOR', 'VIT', 'AGI', 'INT', 'PER', 'CAR'];

/** XP de atributo necessário para +1 ponto. */
export const ATTRIBUTE_XP_STEP = 100;

export const RARITY: Record<Rarity, { label: string; color: string; weight: number }> = {
  common: { label: 'Comum', color: '#9AA5B8', weight: 60 },
  uncommon: { label: 'Incomum', color: '#3DDC97', weight: 25 },
  rare: { label: 'Raro', color: '#2F8BFF', weight: 11 },
  epic: { label: 'Épico', color: '#7B3FE4', weight: 3.5 },
  legendary: { label: 'Lendário', color: '#F5C451', weight: 0.5 },
  mythic: { label: 'Mítico', color: '#FF3B5C', weight: 0 },
};

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export const PITY_LIMIT = 30;

export function rollRarity(rng: () => number, minRarity: Rarity = 'common'): Rarity {
  const min = RARITY_ORDER.indexOf(minRarity);
  const pool = RARITY_ORDER.filter((r, i) => i >= min && RARITY[r].weight > 0);
  const total = pool.reduce((s, r) => s + RARITY[r].weight, 0);
  let roll = rng() * total;
  for (const r of pool) {
    roll -= RARITY[r].weight;
    if (roll <= 0) return r;
  }
  return pool[pool.length - 1];
}

function shifted(date: Date, resetHour: number): Date {
  return new Date(date.getTime() - resetHour * 3600_000);
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayKey(now: Date, resetHour: number): string {
  return dateKey(shifted(now, resetHour));
}

/** Dia da semana do "dia de jogo" atual. */
export function gameWeekday(now: Date, resetHour: number): number {
  return shifted(now, resetHour).getDay();
}

/** Semana ISO (segunda-feira inicia). */
export function weekKey(now: Date, resetHour: number): string {
  const d = shifted(now, resetHour);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
}

export function monthKey(now: Date, resetHour: number): string {
  const d = shifted(now, resetHour);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function periodKey(type: QuestType, now: Date, resetHour: number): string {
  switch (type) {
    case 'daily':
      return dayKey(now, resetHour);
    case 'weekly':
      return weekKey(now, resetHour);
    case 'monthly':
      return monthKey(now, resetHour);
    default:
      return 'todo';
  }
}

export function nextResetAt(now: Date, resetHour: number): Date {
  const next = new Date(now);
  next.setHours(resetHour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400_000);
}

export function addDays(key: string, n: number): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** Gerador pseudoaleatório determinístico (loja diária). */
export function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const MAX_HP = 100;
export const MAX_MANA = 100;
export const DAILY_FAIL_DAMAGE = 10;
export const SKILL_COST = { postpone: 30, focus: 50 } as const;
export const FOCUS_MINUTES = 25;
export const DAILY_SOFT_LIMIT = 7;
export const ANTI_FARM_AFTER = 15;
