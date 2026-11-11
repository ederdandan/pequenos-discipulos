import { useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '../../lib/speech';

/**
 * Enunciado do exercício, com botão de ouvir. Com `autoRead` (Infantil) a
 * pergunta é lida sozinha ao abrir. `context` aparece num cartão de leitura.
 */
export function Prompt({
  text,
  context,
  ttsRate,
  autoRead,
}: {
  text: string;
  context?: string;
  ttsRate: number;
  autoRead: boolean;
}) {
  const spoken = [text, context].filter(Boolean).join('. ');

  useEffect(() => {
    if (autoRead) speak(spoken, ttsRate);
  }, [spoken, ttsRate, autoRead]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <h2 className="font-reading flex-1 text-2xl font-extrabold">{text}</h2>
        <button
          onClick={() => speak(spoken, ttsRate)}
          className="shrink-0 rounded-xl bg-brand-50 p-2 text-brand-600 hover:bg-brand-100"
          aria-label="Ouvir a pergunta"
        >
          <Volume2 className="size-5" />
        </button>
      </div>
      {context && (
        <p className="font-reading rounded-2xl border-2 border-gold-200 bg-white p-4 text-xl font-bold leading-relaxed">
          {context}
        </p>
      )}
    </div>
  );
}
