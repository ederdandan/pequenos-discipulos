import { useEffect, useState } from 'react';
import type { TypeAnswerExercise } from '../../types';
import { typedMatches } from '../../lib/validation';
import type { ExerciseProps } from './shared';
import { Prompt } from './Prompt';

/** Resposta curta digitada (aceita variações listadas em `accept`). */
export function TypeAnswer({ exercise, ttsRate, audio, locked, onReady }: ExerciseProps<TypeAnswerExercise>) {
  const [text, setText] = useState('');

  useEffect(() => {
    const answers = [exercise.answer, ...(exercise.accept ?? [])];
    onReady(text.trim() ? () => answers.some((a) => typedMatches(text, a)) : null);
  }, [text, exercise]);

  return (
    <div className="space-y-6">
      <Prompt text={exercise.prompt} illustration={exercise.illustration} context={exercise.context} ttsRate={ttsRate} audio={audio} />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
        placeholder="Escreva a resposta…"
        spellCheck={false}
        className="w-full rounded-2xl border-2 border-slate-200 bg-white p-4 text-lg outline-none focus:border-brand-500"
      />
    </div>
  );
}
