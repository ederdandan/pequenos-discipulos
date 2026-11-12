import { DIFFICULTIES, DIFFICULTY, type Difficulty } from '../lib/difficulty';

/** Os 4 níveis de dificuldade em cartões. `progress` (opcional) mostra quantas lições cada um tem feitas. */
export function DifficultyPicker({
  value,
  onChange,
  progress,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  progress?: (d: Difficulty) => string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DIFFICULTIES.map((d) => {
        const info = DIFFICULTY[d];
        const extra = progress?.(d);
        return (
          <button
            type="button"
            key={d}
            onClick={() => onChange(d)}
            aria-pressed={value === d}
            className={`rounded-2xl border p-3 text-left shadow-sm transition ${
              value === d ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl">{info.icon}</span>
            <span className="block font-extrabold">{info.label}</span>
            <span className="block text-xs text-slate-500">{info.hint}</span>
            {extra && <span className="mt-1 block text-xs font-bold text-brand-600">{extra}</span>}
          </button>
        );
      })}
    </div>
  );
}
