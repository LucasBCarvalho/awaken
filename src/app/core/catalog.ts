import { AttributeKey, ClassKey, Difficulty, ItemDef, QuestType } from './models';
import { LIBRARY_MAP, Level, resolveTemplate } from "./library";

export const ITEMS: ItemDef[] = [
  { id: 'potion_hp', name: 'Poção de Vida', type: 'consumable', rarity: 'common', icon: 'flask', description: 'Recupera 30 HP.', minLevel: 1, use: 'heal', price: 40 },
  { id: 'potion_mana', name: 'Elixir de Mana', type: 'consumable', rarity: 'uncommon', icon: 'water', description: 'Recupera 50 de Mana.', minLevel: 1, use: 'mana', price: 60 },
  { id: 'scroll_focus', name: 'Pergaminho de Foco', type: 'consumable', rarity: 'rare', icon: 'sparkles', description: 'XP ×2 por 1 hora.', minLevel: 1, use: 'focus', price: 150 },
  { id: 'hourglass', name: 'Ampulheta Congelada', type: 'consumable', rarity: 'epic', icon: 'hourglass', description: 'Congela a sequência por 1 dia.', minLevel: 1, use: 'freeze', price: 320 },
  { id: 'dagger_novice', name: 'Adaga do Iniciante', type: 'weapon', rarity: 'common', icon: 'flash', description: '+3% XP em Agilidade.', minLevel: 1, xpBonus: 0.03, xpAttribute: 'AGI', price: 90 },
  { id: 'iron_gauntlet', name: 'Manopla de Ferro', type: 'weapon', rarity: 'uncommon', icon: 'barbell', description: '+5% XP em Força.', minLevel: 3, xpBonus: 0.05, xpAttribute: 'FOR', price: 180 },
  { id: 'tome_echo', name: 'Tomo do Eco', type: 'weapon', rarity: 'rare', icon: 'book', description: '+8% XP em Inteligência.', minLevel: 5, xpBonus: 0.08, xpAttribute: 'INT', price: 420 },
  { id: 'phantom_blade', name: 'Lâmina Fantasma', type: 'weapon', rarity: 'epic', icon: 'flash', description: '+6% XP em todas as missões.', minLevel: 10, xpBonus: 0.06 },
  { id: 'void_edge', name: 'Fio do Vazio', type: 'weapon', rarity: 'legendary', icon: 'planet', description: '+10% XP em todas as missões.', minLevel: 20, xpBonus: 0.1 },
  { id: 'cloth_vest', name: 'Colete de Tecido', type: 'armor', rarity: 'common', icon: 'shield', description: 'Reduz perda de HP em 10%.', minLevel: 1, hpShield: 0.1, price: 80 },
  { id: 'hunter_cloak', name: 'Manto do Caçador', type: 'armor', rarity: 'rare', icon: 'shield-half', description: 'Reduz perda de HP em 25%.', minLevel: 5, hpShield: 0.25, price: 400 },
  { id: 'abyss_plate', name: 'Couraça do Abismo', type: 'armor', rarity: 'epic', icon: 'shield-checkmark', description: 'Reduz perda de HP em 40%.', minLevel: 12, hpShield: 0.4 },
  { id: 'ring_constancy', name: 'Anel da Constância', type: 'accessory', rarity: 'uncommon', icon: 'ellipse', description: '+5% de ouro.', minLevel: 2, goldBonus: 0.05, price: 160 },
  { id: 'amulet_sight', name: 'Amuleto da Visão', type: 'accessory', rarity: 'rare', icon: 'eye', description: '+3% chance de drop.', minLevel: 4, dropBonus: 0.03, price: 380 },
  { id: 'crown_dawn', name: 'Diadema da Aurora', type: 'accessory', rarity: 'epic', icon: 'star', description: '+10% ouro e +3% XP.', minLevel: 8, goldBonus: 0.1, xpBonus: 0.03 },
  { id: 'heart_first', name: 'Coração do Primeiro Chefe', type: 'accessory', rarity: 'legendary', icon: 'diamond', description: '+8% XP, +8% ouro, +5% drop.', minLevel: 15, xpBonus: 0.08, goldBonus: 0.08, dropBonus: 0.05 },
  { id: 'key_e', name: 'Chave de Portal Rank E', type: 'key', rarity: 'uncommon', icon: 'key', description: 'Abre um Portal Rank E (em breve).', minLevel: 1, price: 120 },
  { id: 'aura_azure', name: 'Aura Cerúlea', type: 'cosmetic', rarity: 'rare', icon: 'aperture', description: 'Apenas visual.', minLevel: 1 },
];

export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const ITEM_TYPE_LABEL: Record<ItemDef['type'], string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  accessory: 'Acessório',
  consumable: 'Consumível',
  key: 'Chave',
  cosmetic: 'Cosmético',
};

export const FIXED_SHOP = ['potion_hp', 'potion_mana', 'scroll_focus', 'key_e'];

export const CLASSES: Record<ClassKey, { name: string; attribute: AttributeKey; description: string; icon: string }> = {
  warrior: { name: 'Guerreiro', attribute: 'FOR', description: '+10% XP em missões de Força.', icon: 'barbell' },
  assassin: { name: 'Assassino', attribute: 'AGI', description: '+10% XP em missões de Agilidade.', icon: 'flash' },
  mage: { name: 'Mago', attribute: 'INT', description: '+10% XP em missões de Inteligência.', icon: 'book' },
  healer: { name: 'Curandeiro', attribute: 'VIT', description: '+10% XP em Vitalidade e −20% dano.', icon: 'heart' },
  strategist: { name: 'Estrategista', attribute: 'PER', description: '+10% XP em Percepção e +2% drop.', icon: 'eye' },
  bard: { name: 'Bardo', attribute: 'CAR', description: '+10% XP em Carisma e −10% na loja.', icon: 'people' },
};

export interface QuestTemplate {
  title: string;
  type: QuestType;
  attribute: AttributeKey;
  difficulty: Difficulty;
  target: number;
  unit: string;
  weekdays?: number[];
  templateId?: string;
  level?: Level;
}

export function fromLibrary(id: string, level: Level = 1, type?: QuestType): QuestTemplate {
  const t = LIBRARY_MAP[id];
  const r = resolveTemplate(t, level);
  const finalType = type ?? t.type;
  return {
    title: t.title,
    type: finalType,
    attribute: t.attribute,
    difficulty: finalType === "daily" && r.difficulty === "epic" ? "hard" : r.difficulty,
    target: r.target,
    unit: r.unit,
    weekdays: finalType === "daily" ? t.weekdays : undefined,
    templateId: t.id,
    level,
  };
}

export const OBJECTIVES: { key: string; label: string; icon: string; description: string; attribute: AttributeKey; quests: QuestTemplate[] }[] = [
  { key: "corpo", label: "Corpo", icon: "barbell", description: "Força e condicionamento", attribute: "FOR", quests: [fromLibrary("treino_corpo"), fromLibrary("caminhada")] },
  { key: "saude", label: "Saúde", icon: "heart", description: "Sono, água, alimentação", attribute: "VIT", quests: [fromLibrary("agua"), fromLibrary("sono")] },
  { key: "estudo", label: "Estudo", icon: "book", description: "Leitura e cursos", attribute: "INT", quests: [fromLibrary("leitura_nao_ficcao"), fromLibrary("estudo_ativo")] },
  { key: "mente", label: "Mente", icon: "eye", description: "Calma e organização", attribute: "PER", quests: [fromLibrary("meditacao"), fromLibrary("planejar_dia")] },
  { key: "carreira", label: "Carreira", icon: "flash", description: "Produtividade e foco", attribute: "AGI", quests: [fromLibrary("sapo"), fromLibrary("zerar_email")] },
  { key: "social", label: "Social", icon: "people", description: "Amigos e família", attribute: "CAR", quests: [fromLibrary("mensagem"), fromLibrary("conversa_presente")] },
];

export const WEEKLY_SUGGESTIONS: Record<AttributeKey, QuestTemplate> = {
  FOR: fromLibrary('treinar_semana'),
  VIT: fromLibrary('cozinhar'),
  AGI: fromLibrary('pendencias'),
  INT: { title: 'Ler 70 páginas', type: 'weekly', attribute: 'INT', difficulty: 'medium', target: 70, unit: 'pág.' },
  PER: fromLibrary('revisao_semanal'),
  CAR: fromLibrary('encontrar_amigo'),
};

export const SURPRISE_QUESTS = [
  'Alongue-se por 2 minutos',
  'Beba um copo de água agora',
  'Organize sua mesa',
  'Faça 10 agachamentos',
  'Respire fundo 10 vezes',
  'Responda uma mensagem pendente',
  'Saia ao sol por 5 minutos',
  'Anote 3 coisas pelas quais é grato',
];

export const SYSTEM_LINES = {
  levelUp: ['Sua força de vontade foi notada.', 'O limite foi quebrado.', 'Você ficou mais forte.'],
  complete: ['Missão cumprida.', 'O Sistema registrou seu esforço.', 'Progresso confirmado.'],
};
