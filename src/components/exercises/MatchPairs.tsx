import { useEffect, useMemo, useState } from 'react';
import type { MatchPairsExercise } from '../../types';
import { speak } from '../../lib/speech';
import { sounds } from '../../lib/sounds';
import { shuffle, type ExerciseProps } from './shared';

/** Até 2 toques errados o exercício ainda conta como acerto. */
export const MAX_PAIR_MISSES = 2;

type Side = 'left' | 'right';

export function MatchPairs({ exercise, ageGroup, ttsRate, audio, locked, onReady }: ExerciseProps<MatchPairsExercise>) {
  const left = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ text: p[0], i }))), [exercise]);
  const right = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ text: p[1], i }))), [exercise]);
  const [selected, setSelected] = useState<{ side: Side; i: number } | null>(null);
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [wrong, setWrong] = useState<{ left: number; right: number } | null>(null);
  const [misses, setMisses] = useState(0);

  const done = matched.size === exercise.pairs.length;
  useEffect(() => {
    onReady(done ? () => misses <= MAX_PAIR_MISSES : null);
  }, [done, misses]);

  function tap(side: Side, i: number) {
    if (locked || matched.has(i) || wrong) return;
    if (audio === 'auto') speak(exercise.pairs[i][side === 'left' ? 0 : 1], ttsRate);
    if (!selected || selected.side === side) {
      setSelected({ side, i });
      return;
    }
    if (selected.i === i) {
      setMatched((m) => new Set(m).add(i));
      sounds.correct();
    } else {
      setMisses((n) => n + 1);
      sounds.wrong();
      const l = side === 'left' ? i : selected.i;
      const r = side === 'right' ? i : selected.i;
      setWrong({ left: l, right: r });
      setTimeout(() => setWrong(null), 600);
    }
    setSelected(null);
  }

  const cls = (side: Side, i: number) => {
    if (matched.has(i)) return 'border-gold-300 bg-gold-50 text-gold-700 opacity-60';
    if (wrong && wrong[side] === i) return 'animate-shake border-red-400 bg-red-50 text-red-600';
    if (selected?.side === side && selected.i === i) return 'border-brand-500 bg-brand-50 text-brand-700';
    return 'border-slate-200 bg-white hover:bg-slate-50';
  };
  const size = ageGroup === 'kids' ? 'py-4 text-xl' : 'py-3 text-base';

  return (
    <div className="space-y-6">
      <h2 className="font-reading text-2xl font-extrabold">{exercise.prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { side: 'left' as const, items: left },
          { side: 'right' as const, items: right },
        ].map(({ side, items }) => (
          <div key={side} className="space-y-3">
            {items.map(({ text, i }) => (
              <button
                key={i}
                onClick={() => tap(side, i)}
                disabled={locked || matched.has(i)}
                className={`w-full rounded-2xl border shadow-sm px-3 font-bold transition ${size} ${cls(side, i)}`}
              >
                {text}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500">
        {done ? 'Todos os pares ligados!' : 'Toque num item da esquerda e depois no par dele à direita.'}
        {misses > 0 && ` · ${misses} ${misses === 1 ? 'erro' : 'erros'}`}
      </p>
    </div>
  );
}
