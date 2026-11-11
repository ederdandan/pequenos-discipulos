/** Opção de acessibilidade: letras maiores e leitura em voz alta mais lenta. */
export function LargeTextToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-slate-200 bg-white p-3">
      <span>
        <span className="block font-bold text-slate-700">🔎 Letra grande</span>
        <span className="block text-sm text-slate-500">Textos maiores e leitura em voz alta mais devagar.</span>
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="size-6 shrink-0 accent-brand-600"
      />
    </label>
  );
}
