import type { Difficulty, Exercise, UserProfile } from '../types';
import { shuffle } from '../components/exercises/shared';

// Níveis de dificuldade dentro de cada faixa etária. As perguntas são as mesmas da faixa;
// o que muda é o jeito de responder:
// - Fácil: menos alternativas, frase sem palavras sobrando, menos pares, digitar vira escolher.
// - Normal: como as perguntas foram escritas.
// - Intermediário: completar a frase é digitando a palavra; montar frase tem palavras a mais.
// - Especialista: além disso, as perguntas marcadas com "typed" são digitadas, sem alternativas.
// Cada nível tem a própria trilha (o progresso dos outros fica guardado).

export type { Difficulty };

export const DIFFICULTIES: Difficulty[] = ['facil', 'normal', 'intermediario', 'especialista'];

export const DIFFICULTY: Record<Difficulty, { label: string; icon: string; hint: string; bonusXp: number }> = {
  facil: { label: 'Fácil', icon: '🌱', hint: 'Menos alternativas e nada para digitar', bonusXp: 0 },
  normal: { label: 'Normal', icon: '🌿', hint: 'Todas as alternativas, sem facilitar', bonusXp: 0 },
  intermediario: { label: 'Intermediário', icon: '🌳', hint: 'Complete a frase digitando · +5 XP por lição', bonusXp: 5 },
  especialista: { label: 'Especialista', icon: '👑', hint: 'Muitas respostas digitadas, sem alternativas · +10 XP por lição', bonusXp: 10 },
};

export const difficultyOf = (p: Pick<UserProfile, 'difficulty'>): Difficulty => p.difficulty ?? 'normal';

export const nextDifficulty = (d: Difficulty): Difficulty | null => DIFFICULTIES[DIFFICULTIES.indexOf(d) + 1] ?? null;

/** Palavras de outras frases usadas como "sobrando" no montar frase. */
function extraWords(e: Extract<Exercise, { type: 'word-bank' }>, pool: Exercise[], n: number) {
  const have = new Set(e.words.map((w) => w.toLowerCase()));
  const candidates = pool
    .flatMap((x) => (x.type === 'word-bank' && x.id !== e.id ? x.sentence.split(' ') : []))
    .filter((w) => w.length > 2 && !have.has(w.toLowerCase()));
  return shuffle([...new Set(candidates)]).slice(0, n);
}

/**
 * Adapta um exercício ao nível. O id continua o mesmo (revisão, missões e lição salva seguem valendo).
 * As conversões que mudam o tipo dependem de marcações revisadas à mão no JSON:
 * `easy_options` (digitar → escolher no Fácil), `typed: false` (lacuna continua de escolher) e
 * `typed: true` (múltipla escolha digitada no Especialista).
 * `pool`: outros exercícios da trilha, de onde saem as palavras extras do montar frase.
 */
export function adaptExercise(e: Exercise, d: Difficulty, pool: Exercise[] = []): Exercise {
  if (d === 'normal') return e;

  if (d === 'facil') {
    switch (e.type) {
      case 'multiple-choice': {
        if (e.options.length <= 2) return e;
        const right = e.options.find((o) => o.correct)!;
        const wrong = shuffle(e.options.filter((o) => !o.correct))[0];
        return { ...e, options: [right, wrong] };
      }
      case 'fill-blank':
        return { ...e, options: [e.correctWord, shuffle(e.options.filter((w) => w !== e.correctWord))[0]] };
      case 'word-bank':
        return { ...e, words: e.sentence.split(' ') };
      case 'match-pairs':
        return e.pairs.length > 3 ? { ...e, pairs: shuffle(e.pairs).slice(0, 3) } : e;
      case 'type-answer':
        if (!e.easyOptions?.length) return e;
        return {
          id: e.id,
          type: 'multiple-choice',
          prompt: e.prompt,
          illustration: e.illustration,
          explanation: e.explanation,
          sourceReference: e.sourceReference,
          context: e.context,
          options: [{ text: e.answer, correct: true }, ...e.easyOptions.map((text) => ({ text, correct: false }))],
        };
      default:
        return e;
    }
  }

  // Intermediário e Especialista
  const expert = d === 'especialista';
  const base = { id: e.id, illustration: e.illustration, explanation: e.explanation, sourceReference: e.sourceReference };
  switch (e.type) {
    case 'fill-blank':
      if (e.typed === false) return e;
      return {
        ...base,
        type: 'type-answer',
        prompt: 'Complete a frase digitando a palavra que falta',
        context: `${e.sentenceParts[0]} ___ ${e.sentenceParts[1]}`.trim(),
        answer: e.correctWord,
        accept: e.accept,
      };
    case 'word-bank':
      return { ...e, words: [...e.words, ...extraWords(e, pool, expert ? 3 : 2)] };
    case 'multiple-choice': {
      if (!expert || !e.typed) return e;
      const right = e.options.find((o) => o.correct);
      if (!right) return e;
      return { ...base, type: 'type-answer', prompt: e.prompt, context: e.context, answer: right.text, accept: e.accept };
    }
    default:
      return e;
  }
}

/** Adapta uma lista inteira (a lição ou a revisão). */
export const adaptExercises = (list: Exercise[], d: Difficulty, pool: Exercise[] = list) =>
  d === 'normal' ? list : list.map((e) => adaptExercise(e, d, pool));

/**
 * Troca de nível: guarda as lições concluídas do nível atual e traz as do novo
 * (vazio se nunca jogou nele). A lição em andamento é descartada.
 */
export function setDifficulty(p: UserProfile, d: Difficulty): UserProfile {
  const cur = difficultyOf(p);
  if (cur === d) return { ...p, levelOffer: false };
  const progress = { ...(p.progressByDifficulty ?? {}), [cur]: p.completedLevels };
  return {
    ...p,
    difficulty: d,
    progressByDifficulty: progress,
    completedLevels: progress[d] ?? [],
    lessonInProgress: null,
    levelOffer: false,
  };
}

/** Lições concluídas em cada nível (o atual vem de completedLevels). */
export function completedIn(p: UserProfile, d: Difficulty): string[] {
  return d === difficultyOf(p) ? p.completedLevels : (p.progressByDifficulty?.[d] ?? []);
}
