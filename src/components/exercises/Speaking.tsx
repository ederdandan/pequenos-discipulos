import { useEffect, useRef, useState } from 'react';
import { Keyboard, Mic, Square, Volume2 } from 'lucide-react';
import type { SpeakingExercise } from '../../types';
import { canRecognize, listenOnce, speak } from '../../lib/speech';
import { speechMatches, typedMatches } from '../../lib/validation';
import type { ExerciseProps } from './shared';

type Status = 'idle' | 'listening' | 'heard' | 'error';

export function Speaking({ exercise, ttsRate, locked, onReady }: ExerciseProps<SpeakingExercise>) {
  const [typing, setTyping] = useState(!canRecognize());
  const [status, setStatus] = useState<Status>('idle');
  const [heard, setHeard] = useState<string[]>([]);
  const [text, setText] = useState('');
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => stopRef.current(), []);

  useEffect(() => {
    if (typing) onReady(text.trim() ? () => typedMatches(text, exercise.targetPhrase) : null);
    else onReady(heard.length ? () => speechMatches(heard, exercise.targetPhrase) : null);
  }, [typing, text, heard, exercise]);

  async function record() {
    if (status === 'listening') return stopRef.current();
    setStatus('listening');
    const { promise, stop } = listenOnce();
    stopRef.current = stop;
    try {
      const alts = await promise;
      setHeard(alts);
      setStatus(alts.length ? 'heard' : 'idle');
    } catch (err) {
      setStatus('error');
      // Sem permissão de microfone → oferece digitação.
      if ((err as Error).message === 'not-allowed') setTyping(true);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-reading text-2xl font-extrabold">{exercise.prompt}</h2>

      <div className="flex items-start gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4">
        <button
          onClick={() => speak(exercise.targetPhrase, ttsRate)}
          className="shrink-0 rounded-xl bg-brand-50 p-2 text-brand-600 hover:bg-brand-100"
          aria-label="Ouvir a frase"
        >
          <Volume2 className="size-6" />
        </button>
        <div>
          <p className="font-reading text-2xl font-bold leading-relaxed">{exercise.targetPhrase}</p>
          {exercise.hint && <p className="text-slate-500">{exercise.hint}</p>}
        </div>
      </div>

      {typing ? (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={locked}
          placeholder="Digite a frase…"
          autoCapitalize="off"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white p-4 text-lg outline-none focus:border-brand-500"
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={record}
            disabled={locked}
            className={`flex size-24 items-center justify-center rounded-full border-b-4 text-white transition ${
              status === 'listening'
                ? 'animate-pulse border-red-800 bg-pentecost'
                : 'border-brand-700 bg-brand-600 hover:bg-brand-500'
            }`}
            aria-label={status === 'listening' ? 'Parar' : 'Falar'}
          >
            {status === 'listening' ? <Square className="size-9" /> : <Mic className="size-10" />}
          </button>
          <p className="min-h-6 text-center text-slate-500">
            {status === 'idle' && 'Toque no microfone e fale a frase'}
            {status === 'listening' && 'Ouvindo…'}
            {status === 'heard' && (
              <>
                Entendi: <b className="text-slate-700">“{heard[0]}”</b> · toque para tentar de novo
              </>
            )}
            {status === 'error' && 'Não consegui ouvir. Tente de novo ou use o teclado.'}
          </p>
        </div>
      )}

      {canRecognize() && (
        <button
          onClick={() => setTyping((t) => !t)}
          disabled={locked}
          className="mx-auto flex items-center gap-2 text-sm font-bold uppercase text-slate-400 hover:text-slate-600"
        >
          {typing ? <Mic className="size-4" /> : <Keyboard className="size-4" />}
          {typing ? 'Usar o microfone' : 'Não posso falar agora'}
        </button>
      )}
    </div>
  );
}
