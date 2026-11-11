import type { DailyQuests, Exercise, QuestMetric, UserProfile } from '../types';
import { todayKey } from './dates';
import { MAX_STREAK_FREEZES, dailyXpToday, maxHearts, reviewQueue } from './rules';
import { exerciseTypes } from '../data/curriculum';

/** Tipos de exercício que fazem cada métrica andar. */
const METRIC_TYPES: Partial<Record<QuestMetric, Exercise['type'][]>> = {
  speaking: ['speaking'],
  pairs: ['match-pairs'],
};

// Missões diárias: 3 sorteadas por dia; cada uma concluída libera um baú.

export interface Quest {
  id: string;
  metric: QuestMetric;
  target: number;
  label: string;
  icon: string;
}

export const QUEST_POOL: Quest[] = [
  { id: 'xp30', metric: 'xp', target: 30, label: 'Ganhe 30 XP', icon: '⚡' },
  { id: 'xp50', metric: 'xp', target: 50, label: 'Ganhe 50 XP', icon: '⚡' },
  { id: 'lessons2', metric: 'lessons', target: 2, label: 'Complete 2 lições', icon: '📘' },
  { id: 'lessons3', metric: 'lessons', target: 3, label: 'Complete 3 lições', icon: '📚' },
  { id: 'perfect1', metric: 'perfect', target: 1, label: 'Faça 1 lição sem erros', icon: '💎' },
  { id: 'combo5', metric: 'combo', target: 5, label: 'Acerte 5 seguidas', icon: '⚡' },
  { id: 'combo10', metric: 'combo', target: 10, label: 'Acerte 10 seguidas', icon: '⚡' },
  { id: 'speak2', metric: 'speaking', target: 2, label: 'Recite 2 frases em voz alta', icon: '🎤' },
  { id: 'pairs2', metric: 'pairs', target: 2, label: 'Complete 2 exercícios de pares', icon: '🔗' },
  { id: 'review1', metric: 'reviews', target: 1, label: 'Faça 1 revisão de erros', icon: '🔁' },
];

const byId = new Map(QUEST_POOL.map((q) => [q.id, q]));
export const findQuest = (id: string) => byId.get(id);

/** Número pseudoaleatório estável a partir de um texto (mesmo dia + perfil = mesmas missões). */
function seeded(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Sorteia 3 missões de métricas diferentes. Revisão só entra se houver itens para revisar,
 * e missões de fala/escuta/pares só se a trilha da pessoa tiver esses exercícios.
 */
export function pickQuests(p: UserProfile, date: string): string[] {
  const rand = seeded(`${p.id}|${date}`);
  const hasReview = reviewQueue(p).scheduled > 0;
  const types = exerciseTypes(p.ageGroup);
  const pool = QUEST_POOL.filter(
    (q) => (q.metric !== 'reviews' || hasReview) && (METRIC_TYPES[q.metric]?.some((t) => types.has(t)) ?? true),
  );
  const chosen: Quest[] = [];
  while (chosen.length < 3 && pool.length) {
    const q = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    if (!chosen.some((c) => c.metric === q.metric)) chosen.push(q);
  }
  return chosen.map((q) => q.id);
}

/** Garante que o perfil tem as missões de hoje (troca na virada do dia). */
export function ensureQuests(p: UserProfile, now = new Date()): UserProfile {
  const date = todayKey(now);
  if (p.quests?.date === date) return p;
  const quests: DailyQuests = { date, ids: pickQuests(p, date), progress: {}, opened: {} };
  return { ...p, quests };
}

export function questValue(p: UserProfile, q: Quest) {
  if (q.metric === 'xp') return dailyXpToday(p);
  return p.quests?.progress[q.metric] ?? 0;
}

export const questDone = (p: UserProfile, q: Quest) => questValue(p, q) >= q.target;

/** Soma (ou, para combo, guarda o maior valor) num contador do dia. */
export function bumpQuest(p: UserProfile, metric: QuestMetric, amount = 1): UserProfile {
  const base = ensureQuests(p);
  const qs = base.quests!;
  const current = qs.progress[metric] ?? 0;
  const value = metric === 'combo' ? Math.max(current, amount) : current + amount;
  if (value === current) return base;
  return { ...base, quests: { ...qs, progress: { ...qs.progress, [metric]: value } } };
}

/** Atualiza as missões depois de cada resposta. `combo` = acertos seguidos até agora. */
export function questsAfterAnswer(p: UserProfile, type: Exercise['type'], correct: boolean, combo: number) {
  if (!correct) return p;
  let n = bumpQuest(p, 'combo', combo);
  if (type === 'speaking') n = bumpQuest(n, 'speaking');
  if (type === 'match-pairs') n = bumpQuest(n, 'pairs');
  return n;
}

/** Atualiza as missões ao terminar uma lição, treino ou revisão. */
export function questsAfterLesson(p: UserProfile, r: { mistakes: number; practice: boolean; review: boolean }) {
  if (r.review) return bumpQuest(p, 'reviews');
  let n = bumpQuest(p, 'lessons');
  if (r.mistakes === 0 && !r.practice) n = bumpQuest(n, 'perfect');
  return n;
}

/** Missões que ficaram completas entre dois estados do perfil. */
export function newlyCompleted(before: UserProfile, after: UserProfile) {
  return todaysQuests(after).filter((q) => questDone(after, q) && !questDone(before, q));
}

export function todaysQuests(p: UserProfile): Quest[] {
  return (p.quests?.ids ?? []).map(findQuest).filter((q): q is Quest => !!q);
}

/** Missões concluídas hoje cujo baú ainda está fechado. */
export function chestsReady(p: UserProfile) {
  return todaysQuests(p).filter((q) => questDone(p, q) && !p.quests?.opened[q.id]);
}

export type ChestReward = { kind: 'xp'; amount: number } | { kind: 'hearts' } | { kind: 'freeze' };

export function rewardLabel(r: ChestReward) {
  if (r.kind === 'xp') return `+${r.amount} XP`;
  if (r.kind === 'hearts') return 'Chamas cheias 🔥';
  return '+1 bloqueio de sequência 🧊';
}

/** Abre o baú de uma missão concluída e aplica o prêmio sorteado. */
export function openChest(
  p: UserProfile,
  questId: string,
  rand = Math.random,
): { profile: UserProfile; reward: ChestReward } | null {
  const q = findQuest(questId);
  if (!q || !p.quests || !questDone(p, q) || p.quests.opened[questId]) return null;

  const options: ChestReward[] = [
    { kind: 'xp', amount: 10 },
    { kind: 'xp', amount: 15 },
    { kind: 'xp', amount: 20 },
  ];
  if (p.hearts < maxHearts(p)) options.push({ kind: 'hearts' });
  if (p.streakFreezes < MAX_STREAK_FREEZES) options.push({ kind: 'freeze' });
  const reward = options[Math.floor(rand() * options.length)];

  let next: UserProfile = { ...p };
  if (reward.kind === 'xp') {
    // XP do baú conta no total e no ranking, mas não na meta diária (meta = estudar).
    next = { ...next, xp: next.xp + reward.amount, weeklyXp: next.weeklyXp + reward.amount };
  } else if (reward.kind === 'hearts') {
    next = { ...next, hearts: maxHearts(next), heartsUpdatedAt: Date.now() };
  } else {
    next = { ...next, streakFreezes: next.streakFreezes + 1 };
  }
  next = {
    ...next,
    chestsOpened: next.chestsOpened + 1,
    badges: next.badges.includes('first_chest') ? next.badges : [...next.badges, 'first_chest'],
    quests: { ...p.quests, opened: { ...p.quests.opened, [questId]: rewardLabel(reward) } },
  };
  return { profile: next, reward };
}
