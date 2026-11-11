import { useMemo, useState } from 'react';
import type { FillBlankExercise } from '../../types';
import { speak } from '../../lib/speech';
import { optionClass, shuffle, type ExerciseProps } from './shared';
import { Prompt } from './Prompt';

export function FillBlank({ exercise, ttsRate, audio, locked, onReady }: ExerciseProps<FillBlankExercise>) {
  const options = useMemo(() => shuffle(exercise.options), [exercise]);
  const [picked, setPicked] = useState<string | null>(null);

  function pick(w: string) {
    if (locked) return;
    setPicked(w);
    if (audio === 'auto') speak(w, ttsRate);
    onReady(() => w === exercise.correctWord);
  }

  return (
    <div className="space-y-8">
      <Prompt text={exercise.prompt} illustration={exercise.illustration} ttsRate={ttsRate} audio={audio === 'auto' ? 'button' : audio} />
      <p className="font-reading flex flex-wrap items-center gap-2 text-2xl font-bold leading-relaxed">
        <span>{exercise.sentenceParts[0]}</span>
        <span
          className={`inline-block min-w-24 rounded-xl px-3 py-1 text-center ${
            picked ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 bg-slate-100 text-transparent'
          }`}
        >
          {picked ?? '____'}
        </span>
        <span>{exercise.sentenceParts[1]}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        {options.map((w) => (
          <button
            key={w}
            onClick={() => pick(w)}
            disabled={locked}
            className={`rounded-2xl border shadow-sm px-5 py-3 text-lg font-bold transition ${optionClass(picked === w)}`}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
