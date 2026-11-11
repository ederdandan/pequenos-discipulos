import { useMemo, useState } from 'react';
import type { MultipleChoiceExercise } from '../../types';
import { speak } from '../../lib/speech';
import { optionClass, shuffle, type ExerciseProps } from './shared';
import { Prompt } from './Prompt';

const LETTERS = 'ABCDEFGH';

/**
 * Múltipla escolha (e verdadeiro/falso). As opções são só texto: no Infantil,
 * tocar numa opção lê exatamente o texto dela, então o áudio sempre corresponde ao que se vê.
 */
export function MultipleChoice({ exercise, ageGroup, ttsRate, audio, locked, onReady }: ExerciseProps<MultipleChoiceExercise>) {
  // Verdadeiro/Falso fica na ordem; as outras opções são embaralhadas.
  const trueFalse = exercise.options.length === 2 && exercise.options[0].text === 'Verdadeiro';
  const options = useMemo(() => (trueFalse ? exercise.options : shuffle(exercise.options)), [exercise, trueFalse]);
  const [picked, setPicked] = useState<number | null>(null);
  const kids = ageGroup === 'kids';

  function pick(i: number) {
    if (locked) return;
    setPicked(i);
    if (audio === 'auto') speak(options[i].text, ttsRate);
    onReady(() => options[i].correct);
  }

  return (
    <div className="space-y-6">
      <Prompt
        text={exercise.prompt}
        context={exercise.context}
        illustration={exercise.illustration}
        ttsRate={ttsRate}
        audio={audio}
      />
      <div className={`grid gap-3 ${trueFalse ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((o, i) => (
          <button
            key={o.text}
            onClick={() => pick(i)}
            disabled={locked}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left font-semibold shadow-sm transition ${
              trueFalse ? 'justify-center' : ''
            } ${optionClass(picked === i)}`}
          >
            {trueFalse ? (
              <span className="text-2xl">{o.text === 'Verdadeiro' ? '✓' : '✗'}</span>
            ) : (
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  picked === i ? 'border-brand-600 bg-brand-600 text-white' : 'border-gold-300 text-gold-700'
                }`}
              >
                {LETTERS[i]}
              </span>
            )}
            <span className={kids ? 'text-xl' : 'text-lg'}>{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
