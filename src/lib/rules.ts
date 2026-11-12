import type { AgeGroup, Difficulty, HistoryEntry, UserProfile } from '../types';
import { currentUnit, findLevel, trackLevels, tracks } from '../data/curriculum';
import { daysBetween, todayKey, weekKey } from './dates';
import { DIFFICULTY, difficultyOf } from './difficulty';

// Regras do jogo em um único lugar, como funções puras (fáceis de testar).

/** Chamas (vidas) padrão = erros permitidos antes de pausar. Cada perfil pode mudar.
 *  No código continuam se chamando "hearts". */
export const MAX_HEARTS = 5;
export const HEART_OPTIONS = [3, 5, 10, 20];
export const maxHearts = (p: Pick<UserProfile, 'maxHearts'>) => p.maxHearts || MAX_HEARTS;
export const HEART_REFILL_MS = 30 * 60 * 1000; // 1 chama a cada 30 min
export const XP_PER_LESSON = 20;
export const XP_PERFECT_BONUS = 5;
export const XP_PRACTICE = 5;
export const STREAK_FREEZE_COST = 50;
export const MAX_STREAK_FREEZES = 2;
/** Dias seguidos sem jogar que fazem a etapa atual recomeçar. */
export const INACTIVITY_DAYS = 5;
const MAX_HISTORY = 300;

export const AGE_GROUPS: Record<AgeGroup, { label: string; emoji: string; ttsRate: number; ages: string; hint: string }> = {
  kids: { label: 'Infantil', emoji: '🧸', ttsRate: 0.9, ages: 'até 9 anos', hint: 'Histórias, orações e santos' },
  teens: { label: 'Juvenil', emoji: '🎒', ttsRate: 1, ages: '10 a 16 anos', hint: 'Virtudes, mandamentos e Bíblia' },
  adults: { label: 'Adulto', emoji: '📖', ttsRate: 1, ages: '17+ anos', hint: 'Catecismo, Escritura e teologia' },
};

/** Velocidade da leitura em voz alta para o perfil. */
export const ttsRateFor = (p: Pick<UserProfile, 'ageGroup' | 'largeText'>) =>
  AGE_GROUPS[p.ageGroup].ttsRate * (p.largeText ? 0.85 : 1);

export const BADGES: Record<string, { label: string; icon: string; description: string }> = {
  first_lesson: { label: 'Primeira lição', icon: '🎉', description: 'Completou a primeira lição' },
  perfect: { label: 'Perfeito', icon: '💎', description: 'Lição sem nenhum erro' },
  streak_3: { label: 'Constância', icon: '🕯️', description: '3 dias seguidos' },
  streak_7: { label: 'Semana de fogo', icon: '🌟', description: '7 dias seguidos' },
  xp_100: { label: 'Centena', icon: '💯', description: '100 XP acumulados' },
  unit_1: { label: 'Primeira etapa', icon: '🏅', description: 'Concluiu uma etapa inteira' },
  answers_100: { label: '100 respostas', icon: '🎯', description: 'Acertou 100 respostas' },
  goal_1: { label: 'Meta batida', icon: '✅', description: 'Bateu a meta diária pela primeira vez' },
  goal_7: { label: '7 metas', icon: '📆', description: 'Bateu a meta diária em 7 dias' },
  first_review: { label: 'Revisor', icon: '🔁', description: 'Fez a primeira revisão de erros' },
  mastered_10: { label: 'Fixou 10', icon: '🧠', description: 'Dominou 10 itens que tinha errado' },
  first_chest: { label: 'Primeiro baú', icon: '🎁', description: 'Abriu o primeiro baú de missão' },
  all_levels: { label: 'Discípulo fiel', icon: '👑', description: 'Concluiu todas as lições' },
};

export function newProfile(
  name: string,
  avatar: string,
  ageGroup: AgeGroup,
  hearts = MAX_HEARTS,
  photo: string | null = null,
  largeText = false,
  difficulty: Difficulty = 'normal',
): UserProfile {
  const now = Date.now();
  return {
    id: `usr_${now}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    avatar,
    photo,
    ageGroup,
    largeText,
    difficulty,
    introSeen: false,
    xp: 0,
    weeklyXp: 0,
    weekId: weekKey(),
    streak: 0,
    lastActiveDate: null,
    streakFreezes: 0,
    hearts,
    maxHearts: hearts,
    heartsUpdatedAt: now,
    completedLevels: [],
    badges: [],
    createdAt: now,
    lessonInProgress: null,
    history: [],
    answers: { correct: 0, wrong: 0 },
    inactivityResetFor: null,
    notice: null,
    dailyGoal: DEFAULT_DAILY_GOAL,
    dailyXp: 0,
    dailyDate: null,
    goalDays: 0,
    reviews: {},
    mastered: 0,
    quests: null,
    chestsOpened: 0,
  };
}

const addHistory = (p: UserProfile, e: HistoryEntry): HistoryEntry[] => [e, ...p.history].slice(0, MAX_HISTORY);

/**
 * Ficou INACTIVITY_DAYS dias ou mais sem jogar → a etapa atual recomeça
 * (as lições dela voltam a ficar pendentes). Etapas já concluídas, XP,
 * conquistas e histórico são mantidos.
 */
export function applyInactivityReset(p: UserProfile, now = Date.now()): UserProfile {
  if (!p.lastActiveDate || p.inactivityResetFor === p.lastActiveDate) return p;
  const missed = daysBetween(p.lastActiveDate, todayKey(new Date(now))) - 1;
  if (missed < INACTIVITY_DAYS) return p;

  const unit = currentUnit(p.ageGroup, p.completedLevels);
  const unitLevelIds = new Set(unit?.levels.map((l) => l.id) ?? []);
  const lost = p.completedLevels.filter((id) => unitLevelIds.has(id));
  const inProgressHere = p.lessonInProgress && unitLevelIds.has(p.lessonInProgress.levelId);
  const base = { ...p, inactivityResetFor: p.lastActiveDate };
  if (!unit || (lost.length === 0 && !inProgressHere)) return base;

  return {
    ...base,
    completedLevels: p.completedLevels.filter((id) => !unitLevelIds.has(id)),
    lessonInProgress: inProgressHere ? null : p.lessonInProgress,
    history: addHistory(p, { at: now, kind: 'reset', title: unit.title, xp: 0 }),
    notice: `Você ficou ${missed} dias sem estudar, então a etapa “${unit.title}” recomeçou. Seu XP, conquistas e etapas anteriores continuam salvos. Vamos retomar! 🙏`,
  };
}

/**
 * Aplica as regras que dependem do tempo: reset semanal do weeklyXp,
 * recarga de corações e quebra de streak. Chamado ao carregar e periodicamente.
 */
export function refreshProfile(p: UserProfile, now = Date.now()): UserProfile {
  let next = applyInactivityReset(p, now);
  const wk = weekKey(new Date(now));
  if (p.weekId !== wk) next = { ...next, weeklyXp: 0, weekId: wk };

  const max = maxHearts(next);
  if (next.hearts < max) {
    const gained = Math.floor((now - next.heartsUpdatedAt) / HEART_REFILL_MS);
    if (gained > 0) {
      const hearts = Math.min(max, next.hearts + gained);
      next = {
        ...next,
        hearts,
        heartsUpdatedAt: hearts === max ? now : next.heartsUpdatedAt + gained * HEART_REFILL_MS,
      };
    }
  }

  if (next.lastActiveDate && next.streak > 0) {
    const gap = daysBetween(next.lastActiveDate, todayKey(new Date(now)));
    // gap 1 = ainda pode jogar hoje; cada dia perdido consome um bloqueio.
    const missed = gap - 1;
    if (missed > next.streakFreezes) next = { ...next, streak: 0 };
  }
  return next;
}

/** Milissegundos até o próximo coração (ou null se cheio). */
export function msToNextHeart(p: UserProfile, now = Date.now()) {
  if (p.hearts >= maxHearts(p)) return null;
  return Math.max(0, HEART_REFILL_MS - (now - p.heartsUpdatedAt));
}

export function loseHeart(p: UserProfile): UserProfile {
  if (p.hearts <= 0) return p;
  // Se estava cheio, o relógio da recarga começa agora.
  const heartsUpdatedAt = p.hearts >= maxHearts(p) ? Date.now() : p.heartsUpdatedAt;
  return { ...p, hearts: p.hearts - 1, heartsUpdatedAt };
}

export interface LessonResult {
  /** Lição jogada (vazio numa revisão de erros). */
  levelId: string;
  mistakes: number;
  practice: boolean;
  /** Revisão de erros: não conclui lição, recupera 1 coração. */
  review?: boolean;
}

export interface LessonReward {
  xp: number;
  newBadges: string[];
  streak: number;
  streakIncreased: boolean;
  dailyXp: number;
  dailyGoal: number;
  /** A meta diária foi batida justamente nesta lição. */
  dailyGoalReached: boolean;
}

// ---------- Meta diária ----------

export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50];
export const DEFAULT_DAILY_GOAL = 20;

export const dailyGoal = (p: Pick<UserProfile, 'dailyGoal'>) => p.dailyGoal || DEFAULT_DAILY_GOAL;

/** XP ganho hoje (zera sozinho na virada do dia). */
export function dailyXpToday(p: Pick<UserProfile, 'dailyXp' | 'dailyDate'>, now = new Date()) {
  return p.dailyDate === todayKey(now) ? p.dailyXp : 0;
}

// ---------- Revisão de erros (repetição espaçada) ----------

/**
 * Caixas de Leitner: cada acerto na revisão empurra o item para a próxima
 * caixa, que volta depois de mais dias. Passou da última → item dominado.
 * Caixa 0 = errou agora (pode revisar já).
 */
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14];
export const REVIEW_SESSION_SIZE = 10;
export const XP_REVIEW = 10;
const DAY_MS = 86_400_000;

/** Errou um exercício numa lição: entra (ou volta) para a revisão. */
export function markForReview(p: UserProfile, exerciseId: string, now = Date.now()): UserProfile {
  const old = p.reviews[exerciseId];
  return { ...p, reviews: { ...p.reviews, [exerciseId]: { box: 0, due: now, misses: (old?.misses ?? 0) + 1 } } };
}

/** Resultado da 1ª tentativa de um item numa revisão. */
export function gradeReview(p: UserProfile, exerciseId: string, correct: boolean, now = Date.now()): UserProfile {
  const old = p.reviews[exerciseId];
  if (!old) return p;
  const reviews = { ...p.reviews };
  if (!correct) {
    reviews[exerciseId] = { box: 0, due: now + DAY_MS, misses: old.misses + 1 };
    return { ...p, reviews };
  }
  const box = old.box + 1;
  if (box >= REVIEW_INTERVALS_DAYS.length) {
    delete reviews[exerciseId];
    return { ...p, reviews, mastered: p.mastered + 1 };
  }
  reviews[exerciseId] = { ...old, box, due: now + REVIEW_INTERVALS_DAYS[box] * DAY_MS };
  return { ...p, reviews };
}

/** Itens da trilha atual para revisar, os mais atrasados primeiro. */
export function reviewQueue(p: UserProfile, now = Date.now()) {
  const inTrack = new Set(trackLevels(p.ageGroup).flatMap((l) => l.exercises.map((e) => e.id)));
  const items = Object.entries(p.reviews).filter(([id]) => inTrack.has(id));
  return {
    due: items
      .filter(([, r]) => r.due <= now)
      .sort((a, b) => a[1].due - b[1].due)
      .map(([id]) => id),
    scheduled: items.length,
    nextDue: items.filter(([, r]) => r.due > now).reduce((m, [, r]) => Math.min(m, r.due), Infinity),
  };
}

export function completeLesson(p: UserProfile, r: LessonResult): { profile: UserProfile; reward: LessonReward } {
  const today = todayKey();
  const xp = r.review
    ? XP_REVIEW
    : r.practice
      ? XP_PRACTICE
      : XP_PER_LESSON + (r.mistakes === 0 ? XP_PERFECT_BONUS : 0) + DIFFICULTY[difficultyOf(p)].bonusXp;
  const goal = dailyGoal(p);
  const dailyBefore = dailyXpToday(p);
  const dailyXp = dailyBefore + xp;

  // Streak
  let { streak, streakFreezes } = p;
  let streakIncreased = false;
  if (p.lastActiveDate !== today) {
    const gap = p.lastActiveDate ? daysBetween(p.lastActiveDate, today) : Infinity;
    const missed = gap - 1;
    if (streak > 0 && missed >= 0 && missed <= streakFreezes) {
      streakFreezes -= missed;
      streak += 1;
    } else {
      streak = 1;
    }
    streakIncreased = true;
  }

  const completedLevels =
    r.review || r.practice || p.completedLevels.includes(r.levelId)
      ? p.completedLevels
      : [...p.completedLevels, r.levelId];
  const dailyGoalReached = dailyBefore < goal && dailyXp >= goal;
  // Acabou de concluir a trilha inteira no nível atual: oferecer a troca de nível.
  const allIds = trackLevels(p.ageGroup).map((l) => l.id);
  const finishedTrack =
    completedLevels !== p.completedLevels &&
    allIds.every((id) => completedLevels.includes(id)) &&
    !allIds.every((id) => p.completedLevels.includes(id));

  let next: UserProfile = {
    ...p,
    xp: p.xp + xp,
    weeklyXp: p.weeklyXp + xp,
    dailyXp,
    dailyDate: today,
    goalDays: dailyGoalReached ? p.goalDays + 1 : p.goalDays,
    streak,
    streakFreezes,
    lastActiveDate: today,
    completedLevels,
    levelOffer: finishedTrack || p.levelOffer,
    // Treino e revisão recuperam 1 coração: errar não trava o estudo.
    hearts: r.practice || r.review ? Math.min(maxHearts(p), p.hearts + 1) : p.hearts,
    lessonInProgress: r.review ? p.lessonInProgress : null,
    history: addHistory(p, {
      at: Date.now(),
      kind: r.review ? 'review' : r.practice ? 'practice' : 'lesson',
      title: r.review ? 'Revisão de erros' : (findLevel(r.levelId)?.title ?? r.levelId),
      xp,
      mistakes: r.mistakes,
    }),
  };

  const newBadges = earnedBadges(next, r).filter((b) => !p.badges.includes(b));
  next = { ...next, badges: [...p.badges, ...newBadges] };
  return {
    profile: next,
    reward: { xp, newBadges, streak, streakIncreased, dailyXp, dailyGoal: goal, dailyGoalReached },
  };
}

function earnedBadges(p: UserProfile, r: LessonResult) {
  const out: string[] = [];
  if (p.completedLevels.length >= 1) out.push('first_lesson');
  if (r.mistakes === 0 && !r.practice && !r.review) out.push('perfect');
  if (r.review) out.push('first_review');
  if (p.goalDays >= 1) out.push('goal_1');
  if (p.goalDays >= 7) out.push('goal_7');
  if (p.mastered >= 10) out.push('mastered_10');
  if (p.streak >= 3) out.push('streak_3');
  if (p.streak >= 7) out.push('streak_7');
  if (p.xp >= 100) out.push('xp_100');
  if (p.answers.correct >= 100) out.push('answers_100');
  const done = (ids: { id: string }[]) => ids.every((l) => p.completedLevels.includes(l.id));
  if (tracks[p.ageGroup].some((u) => done(u.levels))) out.push('unit_1');
  if (done(trackLevels(p.ageGroup))) out.push('all_levels');
  return out;
}

/** Conta cada resposta (certa/errada) no perfil. */
export function recordAnswer(p: UserProfile, correct: boolean): UserProfile {
  return {
    ...p,
    answers: {
      correct: p.answers.correct + (correct ? 1 : 0),
      wrong: p.answers.wrong + (correct ? 0 : 1),
    },
  };
}

/** Muda os erros permitidos. Aumentar já dá os corações extras; diminuir corta o excedente. */
export function setMaxHearts(p: UserProfile, value: number): UserProfile {
  const diff = value - maxHearts(p);
  return { ...p, maxHearts: value, hearts: Math.max(0, Math.min(value, p.hearts + Math.max(0, diff))) };
}

export function buyStreakFreeze(p: UserProfile): UserProfile | null {
  if (p.xp < STREAK_FREEZE_COST || p.streakFreezes >= MAX_STREAK_FREEZES) return null;
  return { ...p, xp: p.xp - STREAK_FREEZE_COST, streakFreezes: p.streakFreezes + 1 };
}

export function leagueTier(weeklyXp: number) {
  if (weeklyXp >= 150) return { name: 'Ouro', icon: '🥇', color: 'text-gold-600' };
  if (weeklyXp >= 60) return { name: 'Prata', icon: '🥈', color: 'text-slate-500' };
  return { name: 'Bronze', icon: '🥉', color: 'text-orange-700' };
}
