// Modelos de dados do app (perfis, progresso e exercícios já prontos para a tela).
// O formato do conteúdo escrito à mão (arquivos JSON) fica em src/data/schema.ts.

/** Faixa etária do perfil. No JSON de conteúdo aparece em maiúsculas: KIDS, TEENS, ADULTS. */
export type AgeGroup = 'kids' | 'teens' | 'adults';

/** Nível de dificuldade dentro da faixa (ver lib/difficulty.ts). */
export type Difficulty = 'facil' | 'normal' | 'intermediario' | 'especialista';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  /** Foto do perfil (data URL JPEG pequena). Se existir, aparece no lugar do emoji. */
  photo: string | null;
  ageGroup: AgeGroup;
  /** Letras maiores e leitura em voz alta mais lenta (acessibilidade). */
  largeText: boolean;
  /** Voz da leitura em voz alta: tom (0.5 grave … 2 agudo) e nome da voz do aparelho. */
  voice?: { pitch: number; name: string | null };
  xp: number;
  weeklyXp: number;
  /** Semana (ISO, ex.: "2026-W45") a que o weeklyXp pertence. Muda → zera o weeklyXp. */
  weekId: string;
  streak: number;
  /** Último dia (AAAA-MM-DD) em que completou uma lição. */
  lastActiveDate: string | null;
  /** Bloqueios de streak que protegem um dia perdido. */
  streakFreezes: number;
  hearts: number;
  /** Erros permitidos (corações máximos), configurável no perfil. */
  maxHearts: number;
  /** Momento (ms) da última recarga de corações. */
  heartsUpdatedAt: number;
  /** Lições concluídas no nível de dificuldade atual. */
  completedLevels: string[];
  /** Nível de dificuldade (sem valor = normal). */
  difficulty?: Difficulty;
  /** Lições concluídas guardadas dos outros níveis (o atual fica em completedLevels). */
  progressByDifficulty?: Partial<Record<Difficulty, string[]>>;
  /** Concluiu a trilha toda no nível atual: perguntar se quer mudar de nível. */
  levelOffer?: boolean;
  /** Já viu a explicação de boas-vindas (o que são velas, meta, graça e chamas). */
  introSeen?: boolean;
  badges: string[];
  createdAt: number;
  /** Lição começada e não terminada: ao voltar, continua de onde parou. */
  lessonInProgress: LessonProgress | null;
  /** Histórico de lições, treinos e reinícios (mais recentes primeiro). */
  history: HistoryEntry[];
  /** Total de respostas certas e erradas de todos os tempos. */
  answers: { correct: number; wrong: number };
  /** lastActiveDate que já gerou um reinício por inatividade (evita repetir). */
  inactivityResetFor: string | null;
  /** Aviso a mostrar na trilha (ex.: etapa reiniciada). */
  notice: string | null;
  /** Meta diária de XP escolhida pela pessoa. */
  dailyGoal: number;
  /** XP ganho no dia `dailyDate`. */
  dailyXp: number;
  dailyDate: string | null;
  /** Quantos dias a meta diária foi batida. */
  goalDays: number;
  /** Exercícios errados aguardando revisão, por id do exercício. */
  reviews: Record<string, ReviewItem>;
  /** Itens que saíram da revisão por terem sido fixados. */
  mastered: number;
  /** Missões do dia (sorteadas uma vez por dia). */
  quests: DailyQuests | null;
  /** Baús abertos desde sempre. */
  chestsOpened: number;
}

export type QuestMetric = 'xp' | 'lessons' | 'perfect' | 'combo' | 'speaking' | 'pairs' | 'reviews';

export interface DailyQuests {
  date: string;
  /** Ids das 3 missões sorteadas (ver QUEST_POOL em lib/quests.ts). */
  ids: string[];
  /** Contadores do dia por métrica. */
  progress: Partial<Record<QuestMetric, number>>;
  /** Missões cujo baú já foi aberto, com o prêmio recebido. */
  opened: Record<string, string>;
}

export interface ReviewItem {
  /** Caixa de Leitner (0 = errou agora). */
  box: number;
  /** Quando volta para revisão (ms). */
  due: number;
  /** Quantas vezes já errou. */
  misses: number;
}

export interface LessonProgress {
  levelId: string;
  practice: boolean;
  /** Ids dos exercícios na ordem da fila (erros voltam para o fim). */
  queue: string[];
  idx: number;
  mistakes: number;
  solved: number;
  updatedAt: number;
}

export interface HistoryEntry {
  at: number;
  kind: 'lesson' | 'practice' | 'review' | 'reset';
  title: string;
  xp: number;
  mistakes?: number;
}

export type ExerciseType =
  | 'speaking'
  | 'word-bank'
  | 'multiple-choice'
  | 'fill-blank'
  | 'match-pairs'
  | 'type-answer';

interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  /** Emoji grande que ilustra a pergunta. */
  illustration?: string;
  /** Explicação mostrada depois da resposta. */
  explanation?: string;
  /** Fonte (ex.: "CIC 198", "Lc 1,28"). Escondida no Infantil, opcional no Juvenil, sempre visível no Adulto. */
  sourceReference?: string;
}

export interface SpeakingExercise extends BaseExercise {
  type: 'speaking';
  targetPhrase: string;
  /** Dica opcional mostrada abaixo da frase. */
  hint?: string;
}

export interface WordBankExercise extends BaseExercise {
  type: 'word-bank';
  sentence: string;
  words: string[];
}

export interface Option {
  text: string;
  correct: boolean;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple-choice';
  /** Texto de apoio mostrado num cartão abaixo da pergunta (ex.: afirmação do verdadeiro ou falso). */
  context?: string;
  options: Option[];
  /** Especialista: pode virar resposta digitada (marcado à mão no JSON). */
  typed?: boolean;
  /** Outras respostas aceitas quando digitada. */
  accept?: string[];
}

export interface FillBlankExercise extends BaseExercise {
  type: 'fill-blank';
  sentenceParts: [string, string];
  correctWord: string;
  options: string[];
  /** false: continua de escolher no Intermediário/Especialista (lacuna aceita mais de uma palavra). */
  typed?: boolean;
  /** Outras palavras aceitas quando digitada. */
  accept?: string[];
}

/** Ligar os pares: item da esquerda ↔ item da direita. */
export interface MatchPairsExercise extends BaseExercise {
  type: 'match-pairs';
  pairs: Array<[item: string, match: string]>;
}

/** Resposta digitada livre (curta). */
export interface TypeAnswerExercise extends BaseExercise {
  type: 'type-answer';
  context?: string;
  answer: string;
  /** Outras respostas aceitas. */
  accept?: string[];
  /** Fácil: 2 alternativas erradas para virar escolha. */
  easyOptions?: string[];
}

export type Exercise =
  | SpeakingExercise
  | WordBankExercise
  | MultipleChoiceExercise
  | FillBlankExercise
  | MatchPairsExercise
  | TypeAnswerExercise;

/** Exercício já convertido, com as faixas etárias a que se destina. */
export type TaggedExercise = Exercise & { ages: AgeGroup[] };

/** Nível (lição) de um módulo. `exercises` é sempre a lista já filtrada para uma faixa. */
/** Tema (módulo) de onde vem a lição: Credo, Sacramentos, Missa... */
export interface Theme {
  id: string;
  title: string;
  icon: string;
  /** Cor do tema (hex). */
  color: string;
}

export interface Level {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Etapa de dificuldade (1 = mais fácil … 5 = mais difícil). É o level_number do JSON. */
  stage: number;
  theme: Theme;
  exercises: Exercise[];
}

/**
 * Etapa da trilha: reúne a lição de mesmo nível de todos os temas.
 * A dificuldade sobe de etapa em etapa (e não volta ao fácil a cada tema novo).
 */
export interface Unit {
  id: string;
  stage: number;
  title: string;
  description: string;
  icon: string;
  /** Cor do cabeçalho da etapa (hex). */
  color: string;
  levels: Level[];
}

export interface AppState {
  version: 1;
  profiles: UserProfile[];
  activeProfileId: string | null;
}
