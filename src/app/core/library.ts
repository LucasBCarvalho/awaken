import { AttributeKey, Difficulty, QuestType, Rank } from './models';

/** Nível de execução: 1 Iniciante · 2 Intermediário · 3 Avançado */
export type Level = 1 | 2 | 3;

export const LEVEL_LABEL: Record<Level, string> = { 1: 'Iniciante', 2: 'Intermediário', 3: 'Avançado' };

export function levelForRank(rank: Rank): Level {
  return rank === 'E' || rank === 'D' ? 1 : rank === 'C' || rank === 'B' ? 2 : 3;
}

// ───────────────────────── Exercícios (com execução) ─────────────────────────

export interface Exercise {
  name: string;
  muscles: string;
  how: string[];
}

export const EXERCISES: Record<string, Exercise> = {
  polichinelo: {
    name: 'Polichinelo', muscles: 'Aquecimento · corpo todo',
    how: ['Em pé, pés juntos e braços ao lado do corpo.', 'Salte abrindo as pernas e levando os braços acima da cabeça.', 'Salte de volta à posição inicial. Mantenha um ritmo constante.'],
  },
  agachamento: {
    name: 'Agachamento livre', muscles: 'Coxas e glúteos',
    how: ['Pés na largura dos ombros, pontas levemente para fora.', 'Desça empurrando o quadril para trás, como se fosse sentar numa cadeira.', 'Joelhos acompanham a direção dos pés; calcanhares sempre no chão.', 'Desça até as coxas ficarem paralelas ao chão (ou o quanto conseguir) e suba soltando o ar.'],
  },
  agachamento_salto: {
    name: 'Agachamento com salto', muscles: 'Coxas, glúteos e potência',
    how: ['Faça um agachamento normal.', 'Na subida, exploda em um salto vertical.', 'Aterrisse com os joelhos levemente flexionados e já desça para o próximo.'],
  },
  flexao_joelhos: {
    name: 'Flexão com joelhos apoiados', muscles: 'Peito, ombros e tríceps',
    how: ['Mãos no chão um pouco mais abertas que os ombros, joelhos apoiados.', 'Corpo reto da cabeça aos joelhos — não deixe o quadril cair.', 'Desça o peito até perto do chão, cotovelos a ~45° do corpo.', 'Empurre o chão e volte soltando o ar.'],
  },
  flexao: {
    name: 'Flexão de braço', muscles: 'Peito, ombros, tríceps e core',
    how: ['Mãos um pouco mais abertas que os ombros, pés juntos, corpo em linha reta.', 'Contraia o abdômen e os glúteos durante todo o movimento.', 'Desça até o peito quase tocar o chão, cotovelos a ~45°.', 'Suba empurrando o chão. Se não conseguir mais, termine a série com os joelhos apoiados.'],
  },
  ponte: {
    name: 'Ponte de glúteo', muscles: 'Glúteos e posterior de coxa',
    how: ['Deitado de costas, joelhos dobrados e pés apoiados no chão.', 'Empurre os calcanhares e eleve o quadril até formar uma linha reta dos ombros aos joelhos.', 'Segure 1 segundo contraindo os glúteos e desça devagar.'],
  },
  prancha: {
    name: 'Prancha', muscles: 'Abdômen e core',
    how: ['Apoie antebraços e pontas dos pés no chão, cotovelos abaixo dos ombros.', 'Corpo reto: nem quadril alto, nem caído.', 'Contraia abdômen e glúteos e respire normalmente durante o tempo.'],
  },
  prancha_lateral: {
    name: 'Prancha lateral', muscles: 'Oblíquos e core',
    how: ['De lado, apoie um antebraço no chão, cotovelo abaixo do ombro.', 'Eleve o quadril até o corpo formar uma linha reta.', 'Segure o tempo e troque de lado.'],
  },
  afundo: {
    name: 'Afundo (avanço)', muscles: 'Coxas e glúteos',
    how: ['Em pé, dê um passo largo à frente.', 'Desça até os dois joelhos formarem ~90°; o joelho de trás quase toca o chão.', 'Tronco ereto. Empurre com a perna da frente para voltar.', 'Alterne as pernas — as repetições são por perna.'],
  },
  mergulho: {
    name: 'Mergulho na cadeira (tríceps)', muscles: 'Tríceps e ombros',
    how: ['Sente na beira de uma cadeira firme e apoie as mãos ao lado do quadril.', 'Tire o quadril da cadeira, pernas à frente.', 'Dobre os cotovelos para trás descendo o corpo até ~90°.', 'Empurre e suba. Pernas dobradas deixam mais fácil; esticadas, mais difícil.'],
  },
  abdominal: {
    name: 'Abdominal curto', muscles: 'Abdômen',
    how: ['Deitado, joelhos dobrados, mãos cruzadas no peito.', 'Tire as escápulas do chão contraindo o abdômen (não puxe o pescoço).', 'Desça devagar sem relaxar totalmente.'],
  },
  escalador: {
    name: 'Escalador (mountain climber)', muscles: 'Core e cardio',
    how: ['Posição de flexão com braços esticados.', 'Leve um joelho em direção ao peito e volte, alternando rapidamente.', 'Mantenha o quadril baixo e o abdômen firme. Conte cada perna.'],
  },
  burpee: {
    name: 'Burpee', muscles: 'Corpo todo e cardio',
    how: ['Em pé, agache e apoie as mãos no chão.', 'Jogue os pés para trás ficando em posição de prancha.', 'Faça uma flexão (opcional), traga os pés de volta e salte com os braços para cima.'],
  },
  superman: {
    name: 'Superman', muscles: 'Lombar e costas',
    how: ['Deitado de bruços, braços esticados à frente.', 'Eleve ao mesmo tempo braços, peito e pernas do chão.', 'Segure 2 segundos e desça devagar.'],
  },
  panturrilha: {
    name: 'Elevação de panturrilha', muscles: 'Panturrilhas',
    how: ['Em pé, de preferência na borda de um degrau.', 'Suba na ponta dos pés o mais alto possível.', 'Segure 1 segundo e desça controlando.'],
  },
  alongamento: {
    name: 'Alongamento final', muscles: 'Recuperação',
    how: ['Alongue coxas (frente e trás), glúteos, peito e ombros.', 'Segure cada posição 20–30 s, sem dor, respirando fundo.'],
  },
  pescoco: { name: 'Rotação de pescoço', muscles: 'Mobilidade', how: ['Gire a cabeça devagar em círculos, 5 para cada lado.', 'Sem forçar; pare se sentir tontura.'] },
  ombros: { name: 'Círculos de ombro e braços', muscles: 'Mobilidade', how: ['Braços abertos, faça círculos pequenos que vão aumentando.', '10 para frente e 10 para trás.'] },
  gato_vaca: { name: 'Gato-vaca', muscles: 'Coluna', how: ['De quatro apoios, arredonde as costas olhando para o umbigo (gato).', 'Depois afunde a coluna olhando para frente (vaca).', 'Alterne devagar, sincronizando com a respiração.'] },
  quadril: { name: 'Abertura de quadril', muscles: 'Quadril', how: ['Em posição de afundo, apoie o joelho de trás no chão.', 'Empurre o quadril levemente para frente e segure 30 s de cada lado.'] },
  posterior: { name: 'Alongamento de posterior', muscles: 'Posterior de coxa', how: ['Em pé, pernas esticadas, desça o tronco em direção aos pés.', 'Vá até sentir alongar, sem forçar; segure 30 s.'] },
};

// ───────────────────────── Modelos de missão ─────────────────────────

export interface Step {
  /** id em EXERCISES, se for um exercício */
  exercise?: string;
  label?: string;
  /** prescrição: "3 × 10", "2 min", "30 s cada lado" */
  rx?: string;
}

export interface LevelVariant {
  target?: number;
  difficulty?: Difficulty;
  steps?: Step[];
  note?: string;
}

export interface LibraryTemplate {
  id: string;
  title: string;
  attribute: AttributeKey;
  category: string;
  type: QuestType;
  difficulty: Difficulty;
  target: number;
  unit: string;
  weekdays?: number[];
  /** Resumo de 1 linha para o card */
  summary: string;
  /** Passo a passo de "como fazer" */
  how: string[];
  tips?: string[];
  /** Checklist (treinos, rotinas). Se existir, a meta = nº de etapas. */
  steps?: Step[];
  levels?: Partial<Record<Level, LevelVariant>>;
}

const SEG_QUA_SEX = [1, 3, 5];
const TER_QUI_SAB = [2, 4, 6];

export const LIBRARY: LibraryTemplate[] = [
  // ═════════════════════ FORÇA ═════════════════════
  {
    id: 'treino_corpo', title: 'Treino corpo inteiro em casa', attribute: 'FOR', category: 'Treinos', type: 'daily', difficulty: 'medium',
    target: 1, unit: '', weekdays: SEG_QUA_SEX,
    summary: 'Treino completo sem equipamento, ~25 min. Segunda, quarta e sexta.',
    how: ['Faça os exercícios na ordem da lista.', 'Descanse 45–60 s entre séries e 1–2 min entre exercícios.', 'Marque cada exercício ao terminar todas as séries dele.', 'Priorize a execução correta antes da quantidade.'],
    tips: ['Beba água durante o treino.', 'Dor aguda nas articulações = pare. Cansaço muscular = normal.', 'Quando ficar fácil completar tudo, suba de nível.'],
    levels: {
      1: { difficulty: 'medium', steps: [
        { exercise: 'polichinelo', rx: '2 min' }, { exercise: 'agachamento', rx: '3 × 10' }, { exercise: 'flexao_joelhos', rx: '3 × 8' },
        { exercise: 'ponte', rx: '3 × 12' }, { exercise: 'prancha', rx: '3 × 20 s' }, { exercise: 'alongamento', rx: '3 min' },
      ] },
      2: { difficulty: 'hard', steps: [
        { exercise: 'polichinelo', rx: '3 min' }, { exercise: 'agachamento', rx: '4 × 15' }, { exercise: 'flexao', rx: '4 × 10' },
        { exercise: 'afundo', rx: '3 × 10 cada perna' }, { exercise: 'mergulho', rx: '3 × 10' }, { exercise: 'prancha', rx: '3 × 40 s' },
        { exercise: 'escalador', rx: '3 × 20' }, { exercise: 'alongamento', rx: '4 min' },
      ] },
      3: { difficulty: 'hard', steps: [
        { exercise: 'polichinelo', rx: '3 min' }, { exercise: 'burpee', rx: '4 × 10' }, { exercise: 'agachamento_salto', rx: '4 × 12' },
        { exercise: 'flexao', rx: '5 × 15' }, { exercise: 'afundo', rx: '4 × 12 cada perna' }, { exercise: 'mergulho', rx: '4 × 12' },
        { exercise: 'prancha_lateral', rx: '3 × 30 s cada lado' }, { exercise: 'prancha', rx: '3 × 60 s' }, { exercise: 'alongamento', rx: '5 min' },
      ] },
    },
  },
  {
    id: 'treino_core', title: 'Treino de abdômen e core', attribute: 'FOR', category: 'Treinos', type: 'daily', difficulty: 'easy',
    target: 1, unit: '', weekdays: TER_QUI_SAB,
    summary: 'Fortalece abdômen e lombar, ~12 min. Ótimo nos dias sem treino completo.',
    how: ['Faça os exercícios em sequência.', 'Descanse 30–45 s entre séries.', 'Mantenha a respiração: solte o ar na contração.'],
    tips: ['Core forte protege a coluna e melhora todos os outros treinos.'],
    levels: {
      1: { steps: [{ exercise: 'abdominal', rx: '3 × 12' }, { exercise: 'prancha', rx: '3 × 20 s' }, { exercise: 'superman', rx: '3 × 10' }, { exercise: 'ponte', rx: '2 × 12' }] },
      2: { difficulty: 'medium', steps: [{ exercise: 'abdominal', rx: '4 × 15' }, { exercise: 'prancha', rx: '3 × 45 s' }, { exercise: 'prancha_lateral', rx: '3 × 20 s cada lado' }, { exercise: 'escalador', rx: '3 × 20' }, { exercise: 'superman', rx: '3 × 12' }] },
      3: { difficulty: 'medium', steps: [{ exercise: 'abdominal', rx: '4 × 25' }, { exercise: 'prancha', rx: '3 × 75 s' }, { exercise: 'prancha_lateral', rx: '3 × 40 s cada lado' }, { exercise: 'escalador', rx: '4 × 30' }, { exercise: 'superman', rx: '4 × 15' }] },
    },
  },
  {
    id: 'flexoes', title: 'Flexões do dia', attribute: 'FOR', category: 'Desafios diários', type: 'daily', difficulty: 'easy',
    target: 20, unit: 'rep.',
    summary: 'Some flexões ao longo do dia, em quantas séries precisar.',
    how: ['Não precisa ser de uma vez: faça séries pequenas ao longo do dia.', 'Registre cada série no contador.', 'Se não conseguir a flexão completa, apoie os joelhos — conta igual.'],
    steps: undefined,
    levels: { 1: { target: 20 }, 2: { target: 50, difficulty: 'medium' }, 3: { target: 100, difficulty: 'hard' } },
  },
  {
    id: 'agachamentos', title: 'Agachamentos do dia', attribute: 'FOR', category: 'Desafios diários', type: 'daily', difficulty: 'easy',
    target: 30, unit: 'rep.',
    summary: 'Pernas fortes com agachamentos espalhados no dia.',
    how: ['Faça séries de 10 sempre que levantar da cadeira ou no intervalo.', 'Desça controlando, suba firme.'],
    levels: { 1: { target: 30 }, 2: { target: 60, difficulty: 'medium' }, 3: { target: 120, difficulty: 'hard' } },
  },
  {
    id: 'caminhada', title: 'Caminhada rápida', attribute: 'FOR', category: 'Cardio', type: 'daily', difficulty: 'easy',
    target: 20, unit: 'min',
    summary: 'Caminhar em ritmo acelerado — o cardio mais fácil de manter.',
    how: ['Ritmo em que você ainda consegue falar, mas não cantar.', 'Balance os braços e mantenha a postura ereta.', 'Pode dividir em 2 caminhadas menores.'],
    tips: ['Ouvir um podcast ou audiobook transforma isso em +INT também.'],
    levels: { 1: { target: 20 }, 2: { target: 35 }, 3: { target: 50, difficulty: 'medium' } },
  },
  {
    id: 'corrida_intervalada', title: 'Corrida intervalada', attribute: 'FOR', category: 'Cardio', type: 'daily', difficulty: 'medium',
    target: 1, unit: '', weekdays: TER_QUI_SAB,
    summary: 'Alterna corrida e caminhada. Caminho seguro para começar a correr.',
    how: ['Aqueça caminhando antes.', 'Siga os blocos da lista, marcando cada um.', 'Corra num ritmo leve — a meta é completar, não ser rápido.', 'Termine caminhando para desacelerar.'],
    levels: {
      1: { steps: [{ label: 'Aquecimento caminhando', rx: '5 min' }, { label: 'Corra 1 min + caminhe 2 min', rx: '× 6' }, { label: 'Desaquecimento caminhando', rx: '5 min' }] },
      2: { difficulty: 'hard', steps: [{ label: 'Aquecimento caminhando', rx: '5 min' }, { label: 'Corra 3 min + caminhe 1 min', rx: '× 6' }, { label: 'Desaquecimento', rx: '5 min' }] },
      3: { difficulty: 'hard', steps: [{ label: 'Aquecimento trotando', rx: '5 min' }, { label: 'Corrida contínua', rx: '30 min' }, { label: 'Tiros: 30 s rápido + 90 s leve', rx: '× 4' }, { label: 'Desaquecimento', rx: '5 min' }] },
    },
  },
  {
    id: 'mobilidade', title: 'Alongamento matinal', attribute: 'FOR', category: 'Mobilidade', type: 'daily', difficulty: 'trivial',
    target: 1, unit: '',
    summary: 'Acorda o corpo em 7 minutos e reduz dores de quem fica sentado.',
    how: ['Faça logo ao acordar, antes do celular.', 'Movimentos lentos e respiração profunda.'],
    steps: [{ exercise: 'pescoco', rx: '1 min' }, { exercise: 'ombros', rx: '1 min' }, { exercise: 'gato_vaca', rx: '10 ×' }, { exercise: 'quadril', rx: '30 s cada lado' }, { exercise: 'posterior', rx: '30 s' }],
  },
  {
    id: 'treinar_semana', title: 'Treinar 3 vezes na semana', attribute: 'FOR', category: 'Metas', type: 'weekly', difficulty: 'medium',
    target: 3, unit: 'treinos',
    summary: 'Qualquer treino conta: academia, casa, esporte, corrida.',
    how: ['Defina agora os 3 dias da semana em que vai treinar.', 'Registre +1 a cada treino feito.'],
    levels: { 1: { target: 3 }, 2: { target: 4 }, 3: { target: 5, difficulty: 'hard' } },
  },

  // ═════════════════════ VITALIDADE ═════════════════════
  {
    id: 'agua', title: 'Beber água', attribute: 'VIT', category: 'Hidratação e alimentação', type: 'daily', difficulty: 'easy',
    target: 8, unit: 'copos',
    summary: '8 copos (~2 L) ao longo do dia.',
    how: ['Deixe uma garrafa sempre à vista na mesa.', 'Beba 1 copo ao acordar e 1 antes de cada refeição.', 'Marque +1 a cada copo.'],
    tips: ['Urina clara = bem hidratado.'],
    levels: { 1: { target: 6 }, 2: { target: 8 }, 3: { target: 10 } },
  },
  {
    id: 'vegetais', title: 'Refeição com vegetais', attribute: 'VIT', category: 'Hidratação e alimentação', type: 'daily', difficulty: 'easy',
    target: 1, unit: '',
    summary: 'Metade do prato com verduras e legumes em pelo menos uma refeição.',
    how: ['Monte o prato começando pelos vegetais (metade do prato).', 'Depois proteína (1/4) e carboidrato (1/4).'],
    levels: { 1: { target: 1 }, 2: { target: 2, difficulty: 'medium' }, 3: { target: 3, difficulty: 'medium' } },
  },
  {
    id: 'sem_acucar', title: 'Dia sem doces e refrigerante', attribute: 'VIT', category: 'Hidratação e alimentação', type: 'daily', difficulty: 'medium',
    target: 1, unit: '',
    summary: 'Um dia inteiro sem açúcar adicionado em bebidas e doces.',
    how: ['Troque refrigerante por água com gás e limão.', 'Se der vontade de doce, coma uma fruta.', 'Marque à noite se cumpriu.'],
  },
  {
    id: 'cozinhar', title: 'Cozinhar refeições caseiras', attribute: 'VIT', category: 'Hidratação e alimentação', type: 'weekly', difficulty: 'medium',
    target: 3, unit: 'refeições',
    summary: 'Cozinhar você mesmo melhora a saúde e economiza dinheiro.',
    how: ['Escolha receitas simples (até 30 min).', 'Faça uma lista de compras no fim de semana.', 'Cozinhe porção dobrada e guarde para o dia seguinte.'],
  },
  {
    id: 'sono', title: 'Rotina de sono', attribute: 'VIT', category: 'Sono', type: 'daily', difficulty: 'easy',
    target: 1, unit: '',
    summary: 'Preparar o corpo para dormir 7–8 h.',
    how: ['Siga as etapas na última hora antes de dormir.', 'Tente deitar sempre no mesmo horário, inclusive no fim de semana.'],
    steps: [{ label: 'Desligar telas (ou modo noturno)', rx: '1 h antes' }, { label: 'Luz baixa no quarto' }, { label: 'Preparar roupa/mochila de amanhã' }, { label: 'Deitar no horário definido' }],
  },
  {
    id: 'dormir_cedo', title: 'Dormir antes da meia-noite', attribute: 'VIT', category: 'Sono', type: 'daily', difficulty: 'easy',
    target: 1, unit: '',
    summary: 'Deitar antes das 00:00. Marque na manhã seguinte se preferir.',
    how: ['Defina um alarme às 23:00 avisando para começar a desacelerar.', 'Cama é para dormir: evite rolar o feed deitado.'],
  },
  {
    id: 'sol', title: 'Tomar sol', attribute: 'VIT', category: 'Saúde', type: 'daily', difficulty: 'trivial',
    target: 15, unit: 'min',
    summary: 'Luz natural pela manhã regula o sono e o humor.',
    how: ['De preferência antes das 10h.', 'Pode ser caminhando, na janela aberta ou na varanda.'],
  },

  // ═════════════════════ INTELIGÊNCIA ═════════════════════
  {
    id: 'leitura_ficcao', title: 'Leitura de ficção', attribute: 'INT', category: 'Leitura', type: 'daily', difficulty: 'easy',
    target: 10, unit: 'pág.',
    summary: 'Romance, fantasia, mangá/manhwa em livro, contos. Leitura por prazer.',
    how: ['Escolha um livro que você realmente queira ler — prazer mantém o hábito.', 'Leia num horário fixo (antes de dormir funciona bem).', 'Registre as páginas lidas.'],
    tips: ['Sugestões para começar: um livro curto (até 200 pág.) ou o primeiro de uma série.', 'Largar um livro chato é permitido. Troque sem culpa.'],
    levels: { 1: { target: 10 }, 2: { target: 25 }, 3: { target: 50, difficulty: 'medium' } },
  },
  {
    id: 'leitura_nao_ficcao', title: 'Leitura de não ficção', attribute: 'INT', category: 'Leitura', type: 'daily', difficulty: 'easy',
    target: 10, unit: 'pág.',
    summary: 'Desenvolvimento pessoal, história, ciência, finanças, biografias.',
    how: ['Leia com um lápis ou app de notas por perto.', 'Ao terminar, escreva 1 ideia que aprendeu e como vai aplicar.', 'Registre as páginas lidas.'],
    tips: ['Ideias: hábitos, finanças pessoais, psicologia, história do Brasil, biografias de quem você admira.'],
    levels: { 1: { target: 10 }, 2: { target: 20 }, 3: { target: 40, difficulty: 'medium' } },
  },
  {
    id: 'estudo_ativo', title: 'Estudo ativo (livro técnico ou matéria)', attribute: 'INT', category: 'Estudo', type: 'daily', difficulty: 'medium',
    target: 1, unit: '',
    summary: 'Estudar de verdade: ler, resumir e testar o que aprendeu.',
    how: ['Siga as etapas — elas usam técnicas comprovadas de aprendizado.', 'Celular longe durante o estudo.'],
    steps: [
      { label: 'Ler uma seção ou capítulo', rx: '25 min' },
      { label: 'Fechar o material e escrever um resumo com suas palavras' },
      { label: 'Criar 3 perguntas sobre o conteúdo e responder sem consultar' },
      { label: 'Conferir as respostas e anotar o que errou' },
    ],
  },
  {
    id: 'pomodoro', title: 'Pomodoros de estudo', attribute: 'INT', category: 'Estudo', type: 'daily', difficulty: 'medium',
    target: 1, unit: '',
    summary: 'Blocos de 25 min de foco total + 5 min de pausa.',
    how: ['Escolha UMA tarefa de estudo antes de começar.', 'Timer de 25 min: só essa tarefa. Notificações desligadas.', 'Pausa de 5 min (levante, beba água). Marque cada bloco concluído.'],
    tips: ['Use a habilidade Foco do app durante os blocos para XP ×2.'],
    levels: {
      1: { steps: [{ label: 'Pomodoro 1', rx: '25 min' }, { label: 'Pomodoro 2', rx: '25 min' }] },
      2: { difficulty: 'hard', steps: [{ label: 'Pomodoro 1', rx: '25 min' }, { label: 'Pomodoro 2', rx: '25 min' }, { label: 'Pomodoro 3', rx: '25 min' }, { label: 'Pomodoro 4', rx: '25 min' }] },
      3: { difficulty: 'hard', steps: [{ label: 'Bloco profundo 1', rx: '50 min' }, { label: 'Bloco profundo 2', rx: '50 min' }, { label: 'Bloco profundo 3', rx: '50 min' }] },
    },
  },
  {
    id: 'artigo', title: 'Ler um artigo de qualidade', attribute: 'INT', category: 'Leitura', type: 'daily', difficulty: 'trivial',
    target: 1, unit: '',
    summary: 'Troque 10 min de feed por um artigo longo sobre algo que te interessa.',
    how: ['Escolha um tema: tecnologia, ciência, carreira, saúde.', 'Leia até o fim, sem pular.', 'Conte a alguém ou anote o ponto principal.'],
  },
  {
    id: 'audiobook', title: 'Audiobook ou podcast educativo', attribute: 'INT', category: 'Leitura', type: 'daily', difficulty: 'easy',
    target: 20, unit: 'min',
    summary: 'Aprenda no trânsito, na academia ou lavando louça.',
    how: ['Escolha um audiobook ou podcast de conteúdo (não só entretenimento).', 'Velocidade 1,25× costuma manter a compreensão.', 'Registre os minutos ouvidos.'],
    levels: { 1: { target: 20 }, 2: { target: 40 }, 3: { target: 60, difficulty: 'medium' } },
  },
  {
    id: 'flashcards', title: 'Revisão com flashcards', attribute: 'INT', category: 'Estudo', type: 'daily', difficulty: 'easy',
    target: 15, unit: 'min',
    summary: 'Repetição espaçada: a forma mais eficiente de memorizar.',
    how: ['Use um app de flashcards (ex.: Anki) ou cartões de papel.', 'Pergunta de um lado, resposta curta do outro.', 'Revise todo dia o que o app mandar — constância vence quantidade.'],
  },
  {
    id: 'idioma', title: 'Praticar um idioma', attribute: 'INT', category: 'Estudo', type: 'daily', difficulty: 'easy',
    target: 15, unit: 'min',
    summary: 'Inglês, japonês, coreano… 15 min por dia já fazem diferença.',
    how: ['Combine: 5 min de app/vocabulário + 10 min ouvindo ou lendo no idioma.', 'Assista a um episódio com legenda no próprio idioma quando puder.'],
    levels: { 1: { target: 15 }, 2: { target: 30 }, 3: { target: 45, difficulty: 'medium' } },
  },
  {
    id: 'curso_aula', title: 'Assistir 1 aula de curso', attribute: 'INT', category: 'Estudo', type: 'daily', difficulty: 'easy',
    target: 1, unit: 'aula',
    summary: 'Avance no curso online que está parado.',
    how: ['Assista sem acelerar demais e faça os exercícios da aula.', 'Anote 3 pontos principais.'],
  },
  {
    id: 'terminar_livro', title: 'Terminar um livro no mês', attribute: 'INT', category: 'Metas', type: 'monthly', difficulty: 'hard',
    target: 1, unit: 'livro',
    summary: 'Meta mensal clássica. Divida as páginas pelos dias do mês.',
    how: ['Escolha o livro hoje.', 'Páginas ÷ 30 = sua meta diária (crie uma Diária de leitura com esse número).', 'Marque quando terminar.'],
  },

  // ═════════════════════ PERCEPÇÃO ═════════════════════
  {
    id: 'meditacao', title: 'Meditação de atenção plena', attribute: 'PER', category: 'Mente', type: 'daily', difficulty: 'easy',
    target: 5, unit: 'min',
    summary: 'Treino de foco e calma. Comece com poucos minutos.',
    how: ['Sente-se confortável, costas retas, olhos fechados.', 'Preste atenção no ar entrando e saindo pelo nariz.', 'Quando a mente fugir (vai fugir!), perceba e volte para a respiração — esse "voltar" É o exercício.', 'Use um timer para não ficar olhando o relógio.'],
    tips: ['Apps de meditação guiada ajudam no início.'],
    levels: { 1: { target: 5 }, 2: { target: 10 }, 3: { target: 20, difficulty: 'medium' } },
  },
  {
    id: 'respiracao', title: 'Respiração quadrada', attribute: 'PER', category: 'Mente', type: 'daily', difficulty: 'trivial',
    target: 1, unit: '',
    summary: 'Técnica rápida para baixar a ansiedade em 3 minutos.',
    how: ['Inspire contando 4.', 'Segure o ar contando 4.', 'Expire contando 4.', 'Segure sem ar contando 4.', 'Repita por 3 minutos (cerca de 10 ciclos).'],
  },
  {
    id: 'diario', title: 'Diário (journaling)', attribute: 'PER', category: 'Mente', type: 'daily', difficulty: 'easy',
    target: 1, unit: '',
    summary: '3 perguntas por noite para entender seus dias.',
    how: ['Responda por escrito (papel ou notas do celular).'],
    steps: [{ label: 'O que deu certo hoje?' }, { label: 'O que me incomodou e por quê?' }, { label: 'Qual é a 1 coisa mais importante de amanhã?' }],
  },
  {
    id: 'planejar_dia', title: 'Planejar o dia', attribute: 'PER', category: 'Organização', type: 'daily', difficulty: 'trivial',
    target: 1, unit: '',
    summary: '5 minutos de manhã para decidir o que importa.',
    how: ['Liste tudo que está na cabeça.', 'Escolha só 3 prioridades do dia.', 'Coloque horário para a mais importante.'],
  },
  {
    id: 'organizar_espaco', title: 'Organizar um espaço', attribute: 'PER', category: 'Organização', type: 'daily', difficulty: 'easy',
    target: 10, unit: 'min',
    summary: 'Mesa, gaveta, guarda-roupa, área de trabalho do PC.',
    how: ['Escolha UM espaço pequeno.', 'Timer de 10 min: jogue fora, guarde no lugar ou doe.', 'Pare quando o timer acabar, mesmo que não tenha terminado.'],
  },
  {
    id: 'revisao_semanal', title: 'Revisão semanal', attribute: 'PER', category: 'Organização', type: 'weekly', difficulty: 'medium',
    target: 1, unit: '',
    summary: 'Domingo à noite: olhe a semana passada e planeje a próxima.',
    how: ['Siga as etapas em ~20 minutos.'],
    steps: [{ label: 'Revisar o que fiz na semana (app + agenda)' }, { label: 'Anotar 1 vitória e 1 coisa a melhorar' }, { label: 'Ver compromissos da próxima semana' }, { label: 'Definir 3 metas para a semana' }],
  },
  {
    id: 'sem_celular', title: 'Caminhada sem celular', attribute: 'PER', category: 'Mente', type: 'daily', difficulty: 'easy',
    target: 15, unit: 'min',
    summary: 'Andar sem fone e sem tela. A mente organiza as ideias sozinha.',
    how: ['Deixe o celular em casa (ou no bolso, no modo avião).', 'Observe o caminho: sons, pessoas, detalhes.'],
  },

  // ═════════════════════ AGILIDADE ═════════════════════
  {
    id: 'zerar_email', title: 'Zerar a caixa de e-mail', attribute: 'AGI', category: 'Produtividade', type: 'daily', difficulty: 'easy',
    target: 1, unit: '',
    summary: 'Técnica "inbox zero": nenhuma mensagem pendente no fim do dia.',
    how: ['Abra cada e-mail uma única vez e decida na hora:', '• Leva menos de 2 min? Responda agora.', '• Não precisa de ação? Arquive ou exclua.', '• Exige mais tempo? Vire uma tarefa (missão Avulsa) e arquive.', 'Pronto quando a caixa de entrada estiver vazia.'],
    tips: ['Cancele a inscrição de newsletters que você nunca lê.'],
  },
  {
    id: 'sapo', title: 'Tarefa mais importante primeiro', attribute: 'AGI', category: 'Produtividade', type: 'daily', difficulty: 'medium',
    target: 1, unit: '',
    summary: 'Faça a tarefa mais difícil/importante antes de qualquer outra.',
    how: ['Na noite anterior, escolha a tarefa (a que você mais está adiando).', 'De manhã, faça ela ANTES de redes sociais e e-mails.', 'Se for grande, trabalhe nela pelo menos 30 min.'],
  },
  {
    id: 'dois_minutos', title: 'Regra dos 2 minutos', attribute: 'AGI', category: 'Produtividade', type: 'daily', difficulty: 'easy',
    target: 5, unit: 'tarefas',
    summary: 'Resolva pendências rápidas que estão acumulando.',
    how: ['Liste coisas que levam menos de 2 minutos (responder alguém, pagar um boleto, lavar um copo…).', 'Faça uma atrás da outra e marque +1 em cada.'],
  },
  {
    id: 'foco_profundo', title: 'Bloco de trabalho focado', attribute: 'AGI', category: 'Produtividade', type: 'daily', difficulty: 'medium',
    target: 1, unit: '',
    summary: 'Tempo sem interrupções no seu trabalho ou projeto principal.',
    how: ['Defina o objetivo exato do bloco antes de começar.', 'Celular em outro cômodo, notificações do PC desligadas.', 'Trabalhe até o timer acabar.'],
    levels: {
      1: { steps: [{ label: 'Definir objetivo do bloco' }, { label: 'Trabalho focado', rx: '30 min' }] },
      2: { steps: [{ label: 'Definir objetivo do bloco' }, { label: 'Trabalho focado', rx: '60 min' }, { label: 'Anotar onde parou' }] },
      3: { difficulty: 'hard', steps: [{ label: 'Definir objetivo do bloco' }, { label: 'Trabalho focado 1', rx: '90 min' }, { label: 'Pausa ativa', rx: '15 min' }, { label: 'Trabalho focado 2', rx: '60 min' }] },
    },
  },
  {
    id: 'arrumar_cama', title: 'Arrumar a cama', attribute: 'AGI', category: 'Rotina', type: 'daily', difficulty: 'trivial',
    target: 1, unit: '',
    summary: 'A primeira vitória do dia, em 1 minuto.',
    how: ['Logo ao levantar: estique o lençol, ajeite o travesseiro, dobre a coberta.'],
  },
  {
    id: 'pendencias', title: 'Resolver pendências antigas', attribute: 'AGI', category: 'Metas', type: 'weekly', difficulty: 'medium',
    target: 5, unit: 'tarefas',
    summary: 'Aquelas coisas paradas há semanas.',
    how: ['Liste 5 pendências antigas (documento, conserto, ligação, cadastro…).', 'Resolva uma por vez ao longo da semana.'],
  },

  // ═════════════════════ CARISMA ═════════════════════
  {
    id: 'mensagem', title: 'Mandar mensagem para alguém querido', attribute: 'CAR', category: 'Conexões', type: 'daily', difficulty: 'trivial',
    target: 1, unit: '',
    summary: 'Manter laços vivos com pequenas atitudes.',
    how: ['Pense em alguém com quem não fala há um tempo.', 'Mande algo específico: "vi isso e lembrei de você", uma pergunta sobre a vida dela.'],
  },
  {
    id: 'ligar', title: 'Ligar para alguém da família', attribute: 'CAR', category: 'Conexões', type: 'weekly', difficulty: 'easy',
    target: 2, unit: 'ligações',
    summary: 'Voz cria mais conexão do que texto.',
    how: ['Escolha o dia e a pessoa.', 'Pergunte e escute mais do que fala.'],
  },
  {
    id: 'elogio', title: 'Fazer um elogio sincero', attribute: 'CAR', category: 'Conexões', type: 'daily', difficulty: 'trivial',
    target: 1, unit: '',
    summary: 'Reconhecer algo bom em alguém — no trabalho, em casa, em qualquer lugar.',
    how: ['Seja específico: em vez de "bom trabalho", diga o que exatamente foi bom.', 'Elogie atitudes e esforço, não só aparência.'],
  },
  {
    id: 'conversa_presente', title: 'Conversa sem celular', attribute: 'CAR', category: 'Conexões', type: 'daily', difficulty: 'easy',
    target: 15, unit: 'min',
    summary: 'Atenção total em alguém: família, amigos, parceiro(a).',
    how: ['Celular virado para baixo ou em outro cômodo.', 'Faça perguntas abertas ("como foi…?", "o que você achou…?").'],
  },
  {
    id: 'encontrar_amigo', title: 'Encontrar um amigo', attribute: 'CAR', category: 'Social', type: 'weekly', difficulty: 'medium',
    target: 1, unit: '',
    summary: 'Ver alguém pessoalmente: café, jogo, caminhada, almoço.',
    how: ['Mande o convite com dia e lugar sugeridos (convite vago não acontece).', 'Online também vale se a pessoa mora longe — com câmera ligada.'],
  },
  {
    id: 'gentileza', title: 'Ato de gentileza', attribute: 'CAR', category: 'Social', type: 'daily', difficulty: 'easy',
    target: 1, unit: '',
    summary: 'Ajudar alguém sem esperar nada em troca.',
    how: ['Exemplos: ajudar um colega, pagar um café, segurar a porta, ensinar algo, doar algo que não usa.'],
  },
  {
    id: 'puxar_conversa', title: 'Puxar conversa com alguém novo', attribute: 'CAR', category: 'Social', type: 'weekly', difficulty: 'hard',
    target: 2, unit: 'conversas',
    summary: 'Treino de desenvoltura social, fora da zona de conforto.',
    how: ['Comece com um comentário sobre o ambiente ("esse lugar sempre fica cheio assim?").', 'Faça uma pergunta aberta e escute.', 'Não precisa ser longa: 2 minutos já contam.'],
    levels: { 1: { target: 1, difficulty: 'medium' }, 2: { target: 2 }, 3: { target: 4 } },
  },
];

export const LIBRARY_MAP: Record<string, LibraryTemplate> = Object.fromEntries(LIBRARY.map((t) => [t.id, t]));

/** Resolve o modelo para um nível (meta, dificuldade e etapas). */
export function resolveTemplate(t: LibraryTemplate, level: Level) {
  const v = t.levels?.[level] ?? t.levels?.[2] ?? t.levels?.[1];
  const steps = v?.steps ?? t.steps;
  return {
    steps,
    difficulty: v?.difficulty ?? t.difficulty,
    target: steps?.length ? steps.length : (v?.target ?? t.target),
    unit: steps?.length ? 'etapas' : t.unit,
  };
}

export function hasLevels(t: LibraryTemplate): boolean {
  return !!t.levels && Object.keys(t.levels).length > 1;
}

export function stepName(s: Step): string {
  return s.exercise ? EXERCISES[s.exercise]?.name ?? s.exercise : s.label ?? '';
}
