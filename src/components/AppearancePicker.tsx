import { liturgicalDay } from '../lib/liturgy';
import { THEME_COLORS, THEME_MODES, type Appearance, type ThemeColor, type ThemeMode } from '../lib/theme';

/** Cor de destaque e modo de leitura do perfil (Perfil → Ajustes → Aparência). */
export function AppearancePicker({ value, onChange }: { value: Appearance; onChange: (a: Appearance) => void }) {
  const today = liturgicalDay();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-600">Cor</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Cor do app">
          {(Object.keys(THEME_COLORS) as ThemeColor[]).map((c) => {
            const t = THEME_COLORS[c];
            const on = value.color === c;
            return (
              <button
                key={c}
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ ...value, color: c })}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${
                  on ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                }`}
              >
                <span className="size-9 shrink-0 rounded-full border-2 border-white shadow" style={{ background: t.swatch }} aria-hidden="true" />
                <span className="min-w-0">
                  <span className={`block font-bold ${on ? 'text-brand-700' : ''}`}>{t.label}</span>
                  <span className="block text-xs text-slate-500">
                    {c === 'liturgico' ? `Hoje: ${today.season} (${today.color})` : t.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-600">Modo</h3>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Modo de exibição">
          {(Object.keys(THEME_MODES) as ThemeMode[]).map((m) => {
            const t = THEME_MODES[m];
            const on = value.mode === m;
            return (
              <button
                key={m}
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ ...value, mode: m })}
                className={`rounded-2xl border-2 p-3 text-left ${on ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}
              >
                <span className={`block font-bold ${on ? 'text-brand-700' : ''}`}>
                  {t.icon} {t.label}
                </span>
                <span className="block text-xs text-slate-500">{t.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
