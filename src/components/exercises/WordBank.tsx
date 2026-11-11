import { useEffect, useMemo, useState } from 'react';
import type { WordBankExercise } from '../../types';
import { speak } from '../../lib/speech';
import { normalize } from '../../lib/validation';
import { shuffle, type ExerciseProps } from './shared';
import { Prompt } from './Prompt';

export function WordBank({ exercise, ttsRate, readAloud, locked, onReady }: ExerciseProps<WordBankExercise>) {
  // Índices permitem palavras repetidas no banco.
  const pool = useMemo(() => shuffle(exercise.words.map((w, i) => ({ w, i }))), [exercise]);
  const [chosen, setChosen] = useState<number[]>([]);

  useEffect(() => {
    const sentence = chosen.map((i) => exercise.words[i]).join(' ');
    onReady(chosen.length ? () => normalize(sentence) === normalize(exercise.sentence) : null);
  }, [chosen, exercise]);

  const add = (i: number) => {
    if (locked) return;
    if (readAloud) speak(exercise.words[i], ttsRate);
    setChosen((c) => [...c, i]);
  };
  const remove = (i: number) => !locked && setChosen((c) => c.filter((x) => x !== i));

  return (
    <div className="space-y-6">
      <Prompt text={exercise.prompt} ttsRate={ttsRate} autoRead={readAloud} />
      <div className="flex min-h-16 flex-wrap items-center gap-2 border-y-2 border-slate-200 py-3">
        {chosen.map((i) => (
          <button
            key={i}
            onClick={() => remove(i)}
            className="animate-pop rounded-xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2 text-lg font-bold"
          >
            {exercise.words[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pool.map(({ w, i }) => {
          const used = chosen.includes(i);
          return (
            <button
              key={i}
              onClick={() => add(i)}
              disabled={used || locked}
              className={`rounded-xl border-2 border-b-4 px-4 py-2 text-lg font-bold transition ${
                used ? 'border-slate-200 bg-slate-200 text-transparent' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              {w}
            </button>
          );
        })}
      </div>
    </div>
  );
}
