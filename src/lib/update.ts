import { useCallback, useEffect, useState } from 'react';

// Atualização do app: compara o arquivo de código em uso (assets/index-<hash>.js) com o do
// index.html publicado. Se mudou, há versão nova. Com "Atualizar automaticamente" ligado
// (padrão), o app recarrega sozinho ao abrir ou ao voltar para ele — nunca no meio de uma
// lição. Desligado, mostra um aviso com o botão "Atualizar".

const AUTO_KEY = 'pequenos_discipulos_auto_update';
const RELOAD_KEY = 'pequenos_discipulos_update_reload';
const CHECK_EVERY = 30 * 60 * 1000;

/** Data e hora do build (vite.config.ts → define). */
export const BUILD_DATE: string = __BUILD_DATE__;

export function getAutoUpdate(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) !== 'off';
  } catch {
    return true;
  }
}

function saveAutoUpdate(on: boolean) {
  try {
    localStorage.setItem(AUTO_KEY, on ? 'on' : 'off');
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
}

const scriptIn = (html: string) => html.match(/assets\/index-[\w-]+\.js/)?.[0] ?? null;

function currentScript() {
  const el = document.querySelector<HTMLScriptElement>('script[type="module"][src*="assets/index-"]');
  return el ? scriptIn(el.getAttribute('src') ?? '') : null;
}

/** true se o index.html publicado aponta para outro código (versão nova). */
export async function checkForUpdate(): Promise<boolean> {
  if (!import.meta.env.PROD || !navigator.onLine) return false;
  const mine = currentScript();
  if (!mine) return false;
  try {
    // "no-store": não usa cache do navegador e o service worker deixa passar direto.
    const res = await fetch('./index.html', { cache: 'no-store' });
    if (!res.ok) return false;
    const latest = scriptIn(await res.text());
    return !!latest && latest !== mine;
  } catch {
    return false;
  }
}

/** Recarrega já com a versão nova (o service worker busca o index.html na rede). */
export async function applyUpdate() {
  try {
    sessionStorage.setItem(RELOAD_KEY, `${currentScript()}|${Date.now()}`);
    await (await navigator.serviceWorker?.getRegistration())?.update();
  } catch {
    /* segue para o reload mesmo assim */
  }
  location.reload();
}

/**
 * Evita recarregar em loop: só bloqueia se o último reload (há menos de 1 min) não trouxe
 * a versão nova — continuamos no mesmo código de antes. Aí fica o aviso com o botão.
 */
function reloadedRecently() {
  try {
    const [from, at] = (sessionStorage.getItem(RELOAD_KEY) ?? '').split('|');
    return from === currentScript() && Date.now() - Number(at) < 60_000;
  } catch {
    return false;
  }
}

/**
 * Procura atualização ao abrir, ao voltar para o app e a cada 30 min.
 * `busy` = em lição: só atualiza quando terminar.
 */
export function useAppUpdate(busy: boolean) {
  const [auto, setAutoState] = useState(getAutoUpdate);
  const [available, setAvailable] = useState(false);

  const check = useCallback(async () => {
    const has = await checkForUpdate();
    setAvailable(has);
    return has;
  }, []);

  useEffect(() => {
    check();
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => document.visibilityState === 'visible' && check(), CHECK_EVERY);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [check]);

  // Atualização automática: assim que houver versão nova e a pessoa não estiver numa lição.
  useEffect(() => {
    if (available && auto && !busy && !reloadedRecently()) applyUpdate();
  }, [available, auto, busy]);

  const setAuto = (on: boolean) => {
    saveAutoUpdate(on);
    setAutoState(on);
  };

  return { auto, setAuto, available, check } as const;
}
