import { AttributeKey, QuestType } from './models';

/**
 * Criação rápida em linguagem natural (heurística local, funciona offline).
 * Ex.: "correr 5 km toda terça e quinta" → diária, ter/qui, meta 5 km, FOR.
 */
export interface ParsedQuest {
  title: string;
  type: QuestType;
  weekdays: number[];
  target: number;
  unit: string;
  attribute: AttributeKey;
}

const DAYS: [RegExp, number][] = [
  [/\bdom(ingo)?s?\b/, 0],
  [/\bseg(unda)?s?\b/, 1],
  [/\bter(ça|ca)?s?\b/, 2],
  [/\bqua(rta)?s?\b/, 3],
  [/\bqui(nta)?s?\b/, 4],
  [/\bsex(ta)?s?\b/, 5],
  [/\bs[áa]b(ado)?s?\b/, 6],
];

const ATTR_HINTS: [RegExp, AttributeKey][] = [
  [/corr|trein|acad|flex|agach|muscul|pedal|nadar|caminh|abdom|alonga|exerc/, 'FOR'],
  [/dorm|sono|água|agua|comer|fruta|salada|vitamin|cozinh|médic|medic|beber/, 'VIT'],
  [/ler|leitura|livro|estud|curso|aula|idioma|ingl|revis|pág|pag/, 'INT'],
  [/medit|respir|planej|organiz|diário|diario|journal|limpar|arrumar/, 'PER'],
  [/ligar|amig|famil|mãe|mae|pai|encontr|mensag|namor|social/, 'CAR'],
  [/email|e-mail|inbox|tarefa|trabalh|projeto|relat|reuni/, 'AGI'],
];

const UNITS: [RegExp, string][] = [
  [/^(km|quil[ôo]metros?)$/, 'km'],
  [/^(min|minutos?)$/, 'min'],
  [/^(h|horas?)$/, 'h'],
  [/^(p[áa]g(inas?)?|p\.)$/, 'pág.'],
  [/^(copos?)$/, 'copos'],
  [/^(vezes|x)$/, 'vezes'],
  [/^(rep(eti[çc][õo]es)?|flex[õo]es|agachamentos|abdominais)$/, 'rep.'],
  [/^(l|litros?)$/, 'L'],
];

export function quickParse(input: string): ParsedQuest {
  const raw = input.trim();
  const text = raw.toLowerCase();

  let type: QuestType = 'todo';
  let weekdays = [0, 1, 2, 3, 4, 5, 6];
  const found = DAYS.filter(([re]) => re.test(text)).map(([, d]) => d);

  if (/por semana|na semana|semanal|\d+\s*x\s*(na|por)\s*semana/.test(text)) type = 'weekly';
  else if (/por m[êe]s|no m[êe]s|mensal|at[ée] o fim do m[êe]s/.test(text)) type = 'monthly';
  else if (/todo dia|todos os dias|diari|diária|cada dia/.test(text) || found.length) type = 'daily';
  if (/dias [úu]teis/.test(text)) {
    type = 'daily';
    weekdays = [1, 2, 3, 4, 5];
  } else if (found.length) {
    weekdays = [...new Set(found)].sort();
  }

  let target = 1;
  let unit = '';
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*([a-zà-ú.]+)?/);
  if (m) {
    const n = parseFloat(m[1].replace(',', '.'));
    const u = (m[2] ?? '').trim();
    const mapped = UNITS.find(([re]) => re.test(u));
    if (mapped && !/^\d+\s*x\s*(na|por)/.test(text.slice(m.index ?? 0))) {
      target = Math.round(n);
      unit = mapped[1];
    } else if (type === 'weekly' && /x|vezes/.test(u)) {
      target = Math.round(n);
      unit = 'vezes';
    }
  }

  const attribute = ATTR_HINTS.find(([re]) => re.test(text))?.[1] ?? 'AGI';

  // Título limpo: remove a parte de recorrência
  let title = raw
    .replace(/\b(toda|todo|todas|todos|às|as|aos|nas|nos)\b.*$/i, '')
    .replace(/\s+(por semana|na semana|por m[êe]s|no m[êe]s).*$/i, '')
    .trim();
  if (!title) title = raw;
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, type, weekdays, target, unit, attribute };
}
