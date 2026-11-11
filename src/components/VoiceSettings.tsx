import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { ttsRateFor } from '../lib/rules';
import { canSpeak, onVoicesChanged, portugueseVoices, setVoicePrefs, speak } from '../lib/speech';

/** Tons prontos: mais simples para a família do que um controle deslizante. */
const TONES = [
  { label: 'Grave', pitch: 0.75 },
  { label: 'Normal', pitch: 1 },
  { label: 'Suave', pitch: 1.2 },
  { label: 'Agudo', pitch: 1.45 },
];

const SAMPLE = 'A paz de Cristo! Vamos aprender juntos sobre o amor de Deus.';

/** Configuração da voz da leitura em voz alta (tom e voz do aparelho), por perfil. */
export function VoiceSettings() {
  const { active, updateActive } = useStore();
  const [voices, setVoices] = useState(portugueseVoices);
  useEffect(() => onVoicesChanged(() => setVoices(portugueseVoices())), []);
  if (!active || !canSpeak()) return null;

  const voice = active.voice ?? { pitch: 1, name: null };
  function change(next: Partial<typeof voice>) {
    const v = { ...voice, ...next };
    updateActive((p) => ({ ...p, voice: v }));
    // Aplica já para o teste soar com a escolha nova.
    setVoicePrefs(v);
    speak(SAMPLE, ttsRateFor(active!));
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <Volume2 className="size-5 text-brand-700" /> Voz da leitura
      </h2>
      <p className="mb-3 text-sm text-slate-500">
        Usada quando o app lê em voz alta (Infantil ou letra grande). Toque para ouvir como fica.
      </p>
      <p className="mb-2 text-sm font-semibold text-slate-600">Tom</p>
      <div className="flex flex-wrap gap-2">
        {TONES.map((t) => (
          <button
            key={t.label}
            onClick={() => change({ pitch: t.pitch })}
            className={`rounded-full border px-4 py-2 font-semibold ${
              voice.pitch === t.pitch ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {voices.length > 1 && (
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-slate-600">Voz do aparelho</span>
          <select
            value={voice.name ?? ''}
            onChange={(e) => change({ name: e.target.value || null })}
            className="w-full rounded-xl border border-slate-200 bg-white p-3"
          >
            <option value="">Automática</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name.replace(/^(Microsoft|Google)\s*/, '')} ({v.lang})
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="mt-3 text-xs text-slate-400">As vozes disponíveis dependem do navegador e do aparelho.</p>
    </section>
  );
}
