import { HEART_OPTIONS } from '../lib/rules';

/** Escolha de quantos erros (chamas) a pessoa pode cometer antes de pausar. */
export function HeartsPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {HEART_OPTIONS.map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => onChange(n)}
          className={`rounded-2xl border-2 border-b-4 p-2 text-center transition ${
            value === n ? 'border-fire bg-orange-50 text-fire' : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="block text-xl font-extrabold">🔥 {n}</span>
          <span className="text-xs font-bold text-slate-500">
            {n <= 3 ? 'Desafio' : n <= 5 ? 'Padrão' : n <= 10 ? 'Tranquilo' : 'Bem leve'}
          </span>
        </button>
      ))}
    </div>
  );
}
