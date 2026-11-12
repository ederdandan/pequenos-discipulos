import { useEffect, useState } from 'react';

// Instalação do app (PWA): registra o service worker e guarda o convite
// "Adicionar à tela inicial" que o navegador oferece.

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function setupPwa() {
  // iPhone antigo não entende o "display-mode" do CSS: marca o <html> para desligar a seleção de texto.
  if (isStandalone()) document.documentElement.dataset.standalone = '';
  // O evento pode chegar antes do React montar, então ouvimos desde o início.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // sem service worker o app continua funcionando, só não fica offline
      });
    });
  }
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Estado da instalação: 'installed' | 'available' (botão) | 'ios' (instruções) | 'unavailable'. */
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const status = isStandalone() ? 'installed' : deferred ? 'available' : isIos() ? 'ios' : 'unavailable';

  async function install() {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    notify();
    return outcome === 'accepted';
  }

  return { status, install } as const;
}
