import type { AgeGroup, Exercise } from '../../types';

/**
 * Áudio da tela: "auto" (Infantil) lê a pergunta sozinho e lê as opções ao tocar;
 * "button" (letra grande) mostra o botão 🔊; "off" não tem áudio.
 */
export type AudioMode = 'auto' | 'button' | 'off';

export interface ExerciseProps<E extends Exercise> {
  exercise: E;
  ageGroup: AgeGroup;
  ttsRate: number;
  audio: AudioMode;
  /** true depois que a resposta foi verificada (trava a interação). */
  locked: boolean;
  /** O exercício informa como verificar a resposta atual (null = ainda não respondeu). */
  onReady: (check: (() => boolean) | null) => void;
}

/** Texto da resposta certa mostrado no painel de feedback. */
export function correctAnswer(e: Exercise) {
  switch (e.type) {
    case 'multiple-choice':
      return e.options.find((o) => o.correct)?.text ?? '';
    case 'fill-blank':
      return `${e.sentenceParts[0]} ${e.correctWord} ${e.sentenceParts[1]}`.replace(/\s+([,.;:?!])/g, '$1').trim();
    case 'word-bank':
      return e.sentence;
    case 'speaking':
      return e.targetPhrase;
    case 'type-answer':
      return e.answer;
    case 'match-pairs':
      return e.pairs.map(([a, b]) => `${a} → ${b}`).join(' · ');
  }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Estilo de um botão de opção (selecionado ou não). */
export const optionClass = (selected: boolean) =>
  selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white hover:bg-slate-50';
