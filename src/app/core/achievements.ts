import { AttributeKey, GameState } from './models';
import { rankIndex } from './rules';

export type TierIndex = 0 | 1 | 2 | 3 | 4;

export const TIERS: { name: string; color: string; gold: number; crystals: number }[] = [
  { name: 'Bronze', color: '#CD7F32', gold: 20, crystals: 0 },
  { name: 'Prata', color: '#C0C8D8', gold: 60, crystals: 5 },
  { name: 'Ouro', color: '#F5C451', gold: 150, crystals: 15 },
  { name: 'Platina', color: '#A6F0FF', gold: 400, crystals: 40 },
  { name: 'Diamante', color: '#B48CFF', gold: 1000, crystals: 100 },
];

export interface AchievementDef {
  id: string;
  name: string;
  category: string;
  icon: string;
  /** Texto com {n} substituído pela meta do nível. */
  description: string;
  targets: [number, number, number, number, number];
  metric: (s: GameState) => number;
}

const byAttr = (a: AttributeKey) => (s: GameState) => s.stats.byAttr[a];

export const ACHIEVEMENTS: AchievementDef[] = [
  // Jornada
  { id: 'missoes', name: 'Caçador em Ascensão', category: 'Jornada', icon: 'flame', description: 'Conclua {n} missões.', targets: [1, 25, 100, 500, 2000], metric: (s) => s.totalCompleted },
  { id: 'sequencia', name: 'Inabalável', category: 'Jornada', icon: 'flame', description: 'Alcance uma sequência de {n} dias.', targets: [3, 7, 30, 100, 365], metric: (s) => Math.max(s.streak, s.streakMax) },
  { id: 'perfeitos', name: 'Dia Perfeito', category: 'Jornada', icon: 'checkmark-circle', description: 'Complete 100% das Diárias em {n} dias.', targets: [1, 7, 30, 100, 300], metric: (s) => s.history.filter((h) => h.total > 0 && h.done >= h.total).length },
  { id: 'nivel', name: 'Ascensão', category: 'Jornada', icon: 'star', description: 'Alcance o nível {n}.', targets: [5, 10, 25, 50, 80], metric: (s) => s.level },
  { id: 'rank', name: 'Promovido', category: 'Jornada', icon: 'ribbon', description: 'Suba {n} rank(s) pelo Exame de Promoção.', targets: [1, 2, 3, 4, 5], metric: (s) => rankIndex(s.rank) },
  { id: 'sobrevivente', name: 'Sobrevivente', category: 'Jornada', icon: 'skull', description: 'Saia da Zona de Penalidade {n} vez(es).', targets: [1, 3, 5, 10, 20], metric: (s) => s.stats.escapes },

  // Atributos
  { id: 'for', name: 'Corpo de Aço', category: 'Atributos', icon: 'barbell', description: 'Conclua {n} missões de Força.', targets: [10, 50, 150, 400, 1000], metric: byAttr('FOR') },
  { id: 'vit', name: 'Fonte de Vida', category: 'Atributos', icon: 'heart', description: 'Conclua {n} missões de Vitalidade.', targets: [10, 50, 150, 400, 1000], metric: byAttr('VIT') },
  { id: 'agi', name: 'Relâmpago', category: 'Atributos', icon: 'flash', description: 'Conclua {n} missões de Agilidade.', targets: [10, 50, 150, 400, 1000], metric: byAttr('AGI') },
  { id: 'int', name: 'Mente Afiada', category: 'Atributos', icon: 'book', description: 'Conclua {n} missões de Inteligência.', targets: [10, 50, 150, 400, 1000], metric: byAttr('INT') },
  { id: 'per', name: 'Olho que Tudo Vê', category: 'Atributos', icon: 'eye', description: 'Conclua {n} missões de Percepção.', targets: [10, 50, 150, 400, 1000], metric: byAttr('PER') },
  { id: 'car', name: 'Coração de Líder', category: 'Atributos', icon: 'people', description: 'Conclua {n} missões de Carisma.', targets: [10, 50, 150, 400, 1000], metric: byAttr('CAR') },

  // Disciplina
  { id: 'treinos', name: 'Disciplina de Ferro', category: 'Disciplina', icon: 'barbell', description: 'Complete {n} treinos ou rotinas com checklist.', targets: [1, 10, 40, 100, 250], metric: (s) => s.stats.checklists },
  { id: 'semanais', name: 'Ritmo Semanal', category: 'Disciplina', icon: 'calendar', description: 'Conclua {n} missões Semanais.', targets: [1, 10, 30, 80, 200], metric: (s) => s.stats.byType.weekly },
  { id: 'mensais', name: 'Visão de Longo Prazo', category: 'Disciplina', icon: 'trophy', description: 'Conclua {n} missões Mensais.', targets: [1, 3, 6, 12, 24], metric: (s) => s.stats.byType.monthly },
  { id: 'madrugador', name: 'Madrugador', category: 'Disciplina', icon: 'moon', description: 'Conclua {n} missões antes das 8h.', targets: [1, 10, 30, 100, 300], metric: (s) => s.stats.early },
  { id: 'foco', name: 'Estado de Fluxo', category: 'Disciplina', icon: 'sparkles', description: 'Ative o Foco {n} vez(es).', targets: [1, 10, 50, 150, 400], metric: (s) => s.stats.focus },
  { id: 'ocultas', name: 'Olhos Atentos', category: 'Disciplina', icon: 'eye', description: 'Complete {n} missões ocultas.', targets: [1, 7, 30, 100, 250], metric: (s) => s.stats.surprises },

  // Tesouros
  { id: 'baus', name: 'Caçador de Tesouros', category: 'Tesouros', icon: 'gift', description: 'Abra {n} baús.', targets: [1, 10, 50, 150, 365], metric: (s) => s.stats.chests },
  { id: 'itens', name: 'Colecionador', category: 'Tesouros', icon: 'cube', description: 'Encontre {n} itens.', targets: [1, 10, 30, 80, 200], metric: (s) => s.stats.items },
  { id: 'ouro', name: 'Fortuna', category: 'Tesouros', icon: 'ellipse', description: 'Ganhe {n} de ouro no total.', targets: [100, 1000, 5000, 20000, 100000], metric: (s) => s.stats.goldEarned },
  { id: 'merecido', name: 'Merecido', category: 'Tesouros', icon: 'storefront', description: 'Resgate {n} recompensas da vida real.', targets: [1, 5, 20, 50, 150], metric: (s) => s.stats.redeemed },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

const SINGULAR: [string, string][] = [
  ['treinos ou rotinas', 'treino ou rotina'],
  ['missões ocultas', 'missão oculta'],
  ['missões', 'missão'],
  ['Missões', 'Missão'],
  ['recompensas', 'recompensa'],
  ['baús', 'baú'],
  ['itens', 'item'],
  ['dias', 'dia'],
  ['rank(s)', 'rank'],
  ['vez(es)', 'vez'],
];

export function tierDescription(a: AchievementDef, tier: number): string {
  const n = a.targets[Math.min(tier, 4)];
  let text = a.description.replace('{n}', n.toLocaleString('pt-BR'));
  if (n === 1) for (const [pl, sg] of SINGULAR) text = text.replace(pl, sg);
  return text;
}

/** Quantos níveis o valor atual alcança (0–5). */
export function tiersReached(a: AchievementDef, value: number): number {
  return a.targets.filter((t) => value >= t).length;
}

export const MAX_TIER_POINTS = ACHIEVEMENTS.length * 5;
