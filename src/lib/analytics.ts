// Estatísticas de uso com o GoatCounter (https://pequenos-dicipulos.goatcounter.com).
//
// - Sem cookies e sem dados pessoais: nunca enviamos nome, foto ou id de perfil, só o nome da tela
//   ou do evento (ex.: "licao/concluida/etapa-2"). Não precisa de aviso de cookies.
// - Só no build de produção (no `npm run dev` nada é enviado; o count.js também ignora localhost).
// - O app é uma página só (SPA): cada aba/tela é contada como uma "página virtual" (`trackPage`),
//   e ações importantes como eventos (`trackEvent`).
// - Sem internet (encontros, retiros) o script não carrega e as contagens são simplesmente perdidas;
//   o app continua normal. O service worker não guarda nada de outro domínio além das fontes.
// - Para não contar os próprios acessos: abra o site com #toggle-goatcounter no fim do endereço.

const ENDPOINT = 'https://pequenos-dicipulos.goatcounter.com/count';
const SCRIPT = 'https://gc.zgo.at/count.js';

interface CountVars {
  path: string;
  title?: string;
  event?: boolean;
}
interface GoatCounter {
  no_onload?: boolean;
  allow_local?: boolean;
  count?: (vars: CountVars) => void;
}
declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

const enabled = import.meta.env.PROD && typeof window !== 'undefined';
// Contagens feitas antes do script terminar de carregar.
const queue: CountVars[] = [];
let lastPage = '';

function send(vars: CountVars) {
  if (!enabled) return;
  const count = window.goatcounter?.count;
  if (count) {
    try {
      count(vars);
    } catch {
      /* estatística nunca pode quebrar o app */
    }
  } else queue.push(vars);
}

/** Carrega o count.js (uma vez, em main.tsx). A contagem automática fica desligada: o app conta cada tela. */
export function setupAnalytics() {
  if (!enabled) return;
  window.goatcounter = { ...window.goatcounter, no_onload: true };
  const s = document.createElement('script');
  s.async = true;
  s.src = SCRIPT;
  s.dataset.goatcounter = ENDPOINT;
  s.onload = () => queue.splice(0).forEach(send);
  document.head.appendChild(s);

  // Como a pessoa usa: app instalado ou navegador (uma vez por abertura).
  trackEvent(isStandaloneNow() ? 'abertura/app-instalado' : 'abertura/navegador', 'Abertura do app');
  window.addEventListener('appinstalled', () => trackEvent('pwa/instalado', 'App instalado'));
}

const isStandaloneNow = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Faixa etária no nome dos eventos (sem nenhum dado pessoal). */
export const ageSlug = (g: 'kids' | 'teens' | 'adults') => ({ kids: 'infantil', teens: 'juvenil', adults: 'adulto' })[g];

/** Conta uma tela (página virtual). Repetições seguidas da mesma tela não contam de novo. */
export function trackPage(path: string, title: string) {
  if (path === lastPage) return;
  lastPage = path;
  send({ path, title });
}

/** Conta um evento (aparece na seção de eventos do painel do GoatCounter). */
export function trackEvent(path: string, title?: string) {
  send({ path, title: title ?? path, event: true });
}
