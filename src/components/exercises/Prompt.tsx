import { useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '../../lib/speech';
import type { AudioMode } from './shared';

/**
 * Enunciado do exercício.
 * - `illustration`: emoji grande que ilustra a pergunta (as respostas são sempre texto).
 * - `context`: texto de apoio num cartão de leitura.
 * - Áudio: "auto" lê sozinho ao abrir (Infantil); "button" só mostra o 🔊; "off" sem áudio.
 */
export function Prompt({
  text,
  context,
  illustration,
  ttsRate,
  audio,
}: {
  text: string;
  context?: string;
  illustration?: string;
  ttsRate: number;
  audio: AudioMode;
}) {
  const spoken = [text, context].filter(Boolean).join('. ');

  useEffect(() => {
    if (audio === 'auto') speak(spoken, ttsRate);
  }, [spoken, ttsRate, audio]);

  return (
    <div className="space-y-4">
      {illustration && (
        <div className="flex justify-center">
          <span className="flex size-24 items-center justify-center rounded-full bg-gold-50 text-6xl ring-4 ring-gold-100">
            {illustration}
          </span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <h2 className="font-reading flex-1 text-2xl font-bold">{text}</h2>
        {audio !== 'off' && (
          <button
            onClick={() => speak(spoken, ttsRate)}
            className="shrink-0 rounded-full bg-brand-50 p-2 text-brand-600 hover:bg-brand-100"
            aria-label="Ouvir a pergunta"
          >
            <Volume2 className="size-5" />
          </button>
        )}
      </div>
      {context && (
        <p className="font-reading rounded-xl border border-gold-200 bg-white p-4 text-xl leading-relaxed shadow-sm">
          {context}
        </p>
      )}
    </div>
  );
}
