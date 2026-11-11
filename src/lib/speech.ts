// Web Speech API: síntese (TTS) e reconhecimento de voz, sem serviços externos.

const LANG = 'pt-BR';

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Preferências de voz do perfil ativo (definidas pelo App ao trocar de perfil). */
let prefs: { pitch: number; name: string | null } = { pitch: 1, name: null };
export function setVoicePrefs(p: { pitch?: number; name?: string | null } | undefined) {
  prefs = { pitch: p?.pitch ?? 1, name: p?.name ?? null };
}

/** Vozes em português instaladas no aparelho (pt-BR primeiro). A lista varia por navegador/sistema. */
export function portugueseVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('pt'));
  const br = (v: SpeechSynthesisVoice) => (v.lang.replace('_', '-') === LANG ? 0 : 1);
  return all.sort((a, b) => br(a) - br(b));
}

/** Avisa quando o navegador termina de carregar as vozes (Chrome carrega depois). */
export function onVoicesChanged(fn: () => void) {
  if (!canSpeak()) return () => {};
  window.speechSynthesis.addEventListener('voiceschanged', fn);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', fn);
}

function chosenVoice() {
  const voices = portugueseVoices();
  return (
    (prefs.name && voices.find((v) => v.name === prefs.name)) ||
    voices.find((v) => /natural|google|luciana|francisca/i.test(v.name)) ||
    voices[0] ||
    null
  );
}

export function speak(text: string, rate = 1) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG;
  u.rate = rate;
  u.pitch = prefs.pitch;
  const v = chosenVoice();
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
