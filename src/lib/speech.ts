// Web Speech API: síntese (TTS) e reconhecimento de voz, sem serviços externos.

let cachedVoice: SpeechSynthesisVoice | null | undefined;

const LANG = 'pt-BR';

function portugueseVoice() {
  if (cachedVoice !== undefined && cachedVoice !== null) return cachedVoice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const isPtBr = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-') === LANG;
  cachedVoice =
    voices.find((v) => isPtBr(v) && /natural|google|luciana|francisca/i.test(v.name)) ??
    voices.find(isPtBr) ??
    voices.find((v) => v.lang.startsWith('pt')) ??
    null;
  return cachedVoice;
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, rate = 1) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG;
  u.rate = rate;
  const v = portugueseVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// Tipagem mínima: SpeechRecognition ainda não está no lib.dom padrão.
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function recognitionCtor(): (new () => RecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => RecognitionLike) | null;
}

export const canRecognize = () => typeof window !== 'undefined' && recognitionCtor() !== null;

/**
 * Escuta o microfone uma vez. Resolve com as alternativas transcritas
 * (o navegador às vezes acerta na 2ª ou 3ª opção).
 */
export function listenOnce(): { promise: Promise<string[]>; stop: () => void } {
  const Ctor = recognitionCtor();
  if (!Ctor) return { promise: Promise.reject(new Error('unsupported')), stop: () => {} };
  const rec = new Ctor();
  rec.lang = LANG;
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  const promise = new Promise<string[]>((resolve, reject) => {
    let done = false;
    rec.onresult = (e) => {
      done = true;
      const alts = Array.from(e.results[0] ?? []).map((a) => a.transcript);
      resolve(alts);
    };
    rec.onerror = (e) => {
      done = true;
      reject(new Error(e.error));
    };
    rec.onend = () => {
      if (!done) resolve([]);
    };
  });
  rec.start();
  return { promise, stop: () => rec.stop() };
}
