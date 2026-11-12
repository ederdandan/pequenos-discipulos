import { useEffect, type DependencyList, type RefObject } from 'react';

// Conteúdo que "surge" suavemente: cada bloco da tela começa transparente e um pouco abaixo,
// e aparece um pouco ANTES de entrar na área visível ao rolar (margem de 25% abaixo da tela),
// para nunca deixar espaço em branco em rolagem rápida ou celular lento. Os que já estão na
// tela aparecem em sequência rápida (efeito cascata). Com "reduzir movimento", nada é animado.

/** Blocos animados: os filhos diretos da página e cada lição da trilha. */
const SELECTOR = ':scope > * > *, ol > li';
const STAGGER_MS = 45;
const MAX_DELAY_MS = 220;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useReveal(ref: RefObject<HTMLElement | null>, deps: DependencyList) {
  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion() || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        let n = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.setProperty('--reveal-delay', `${Math.min(n++ * STAGGER_MS, MAX_DELAY_MS)}ms`);
          el.classList.add('reveal-in');
          io.unobserve(el);
        }
      },
      { rootMargin: '0px 0px 25% 0px' },
    );

    // Cada observador guarda os próprios blocos: ao trocar de aba o anterior é desligado,
    // e o novo precisa assumir também os blocos que ainda não apareceram.
    const seen = new WeakSet<Element>();
    const scan = () => {
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (seen.has(el) || el.classList.contains('reveal-in')) return;
        seen.add(el);
        el.classList.add('reveal');
        io.observe(el);
      });
    };
    scan();
    // Blocos que aparecem depois (troca de aba, painéis que abrem) também entram.
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
