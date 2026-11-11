import { useMemo, useState } from 'react';
import type { MultipleChoiceExercise } from '../../types';
import { speak } from '../../lib/speech';
import { optionClass, shuffle, type ExerciseProps } from './shared';
import { Prompt } from './Prompt';

export function MultipleChoice({ exercise, ageGroup, ttsRate, readAloud, locked, onReady }: ExerciseProps<MultipleChoiceExercise>) {
  // Verdadeiro/Falso fica na ordem; as outras opções são embaralhadas.
  const trueFalse = exercise.options.length === 2 && exercise.options[0].text === 'Verdadeiro';
  const options = useMemo(() => (trueFalse ? exercise.options : shuffle(exercise.options)), [exercise, trueFalse]);
  const [picked, setPicked] = useState<number | null>(null);
  const withIcons = options.some((o) => o.icon);
  const big = ageGroup === 'kids' && withIcons;

  function pick(i: number) {
    if (locked) return;
    setPicked(i);
    if (readAloud) speak(options[i].text, ttsRate);
    onReady(() => options[i].correct);
  }

  return (
    <div className="space-y-6">
      <Prompt text={exercise.prompt} context={exercise.context} ttsRate={ttsRate} autoRead={readAloud} />
      <div className={`grid gap-3 ${options.length === 2 ? 'grid-cols-2' : big ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
        {options.map((o, i) => (
          <button
            key={o.text}
            onClick={() => pick(i)}
            disabled={locked}
            className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 p-4 text-left font-bold transition ${
              big || options.length === 2 ? 'flex-col justify-center text-center' : ''
            } ${optionClass(picked === i)}`}
          >
            {o.icon && <span className={big ? 'text-6xl' : 'text-3xl'}>{o.icon}</span>}
            <span className="text-lg">{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
