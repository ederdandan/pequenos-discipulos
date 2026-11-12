import { useEffect, useState } from 'react';
import type { UserProfile } from '../types';
import { liturgicalDay, msToMidnight, type LiturgicalColor } from './liturgy';

// Aparência por perfil (a família divide o aparelho): uma COR de destaque e um MODO.
// A cor troca só o "brand" (botões, navegação, trilha): as cores com significado não mudam
// (verde = acerto, vermelho = erro, dourado = XP, fogo = chamas).
// O CSS de cada cor e modo fica em index.css: html[data-color=...] e html[data-mode=...].

export type ThemeColor = 'classico' | 'liturgico' | 'lilas' | 'rosa' | 'petroleo';
export type ThemeMode = 'claro' | 'leitura';
export interface Appearance {
  color: ThemeColor;
  mode: ThemeMode;
}

export const DEFAULT_APPEARANCE: Appearance = { color: 'classico', mode: 'claro' };

/** Paletas efetivas (o "liturgico" vira uma delas conforme o dia). */
export type Palette = 'azul' | 'roxo' | 'rosa' | 'verde' | 'ouro' | 'vermelho' | 'lilas' | 'petroleo';

export const THEME_COLORS: Record<ThemeColor, { label: string; hint: string; swatch: string }> = {
  classico: { label: 'Clássico', hint: 'Azul Mariano', swatch: '#1e3a8a' },
  liturgico: { label: 'Tempo litúrgico', hint: 'Muda com o calendário da Igreja', swatch: 'conic-gradient(#5b21b6 0 25%, #2f5d27 0 50%, #7c5a10 0 75%, #991b1b 0)' },
  lilas: { label: 'Lilás', hint: 'Suave e alegre', swatch: '#6d28d9' },
  rosa: { label: 'Rosa', hint: 'Para quem gosta de cor', swatch: '#9d174d' },
  petroleo: { label: 'Azul-petróleo', hint: 'Sereno', swatch: '#115e59' },
};

export const THEME_MODES: Record<ThemeMode, { label: string; hint: string; icon: string }> = {
  claro: { label: 'Claro', hint: 'O visual padrão', icon: '☀️' },
  leitura: { label: 'Leitura', hint: 'Fundo de papel, contraste suave e letra de livro', icon: '📖' },
};

/** Cor litúrgica → paleta. Branco é representado pelo dourado (as vestes douradas substituem o branco nas solenidades). */
const LITURGICAL_PALETTE: Record<LiturgicalColor, Palette> = {
  roxo: 'roxo',
  rosa: 'rosa',
  branco: 'ouro',
  verde: 'verde',
  vermelho: 'vermelho',
};

/** Cor principal (brand-700) de cada paleta: também vira a cor da barra do navegador. */
const PALETTE_MAIN: Record<Palette, string> = {
  azul: '#1e3a8a',
  roxo: '#5b21b6',
  rosa: '#9d174d',
  verde: '#2f5d27',
  ouro: '#7c5a10',
  vermelho: '#991b1b',
  lilas: '#6d28d9',
  petroleo: '#115e59',
};

export const appearanceOf = (p: Pick<UserProfile, 'appearance'> | null | undefined): Appearance => ({
  ...DEFAULT_APPEARANCE,
  ...p?.appearance,
});

export function paletteFor(color: ThemeColor, date = new Date()): Palette {
  switch (color) {
    case 'classico':
      return 'azul';
    case 'liturgico':
      return LITURGICAL_PALETTE[liturgicalDay(date).color];
    default:
      return color;
  }
}

/** Aplica a aparência no <html>. O tempo litúrgico é reavaliado à meia-noite. */
export function useAppearance(appearance: Appearance) {
  const [today, setToday] = useState(() => new Date().toDateString());
  useEffect(() => {
    if (appearance.color !== 'liturgico') return;
    const t = setTimeout(() => setToday(new Date().toDateString()), msToMidnight());
    return () => clearTimeout(t);
  }, [appearance.color, today]);

  useEffect(() => {
    const html = document.documentElement;
    const palette = paletteFor(appearance.color);
    html.dataset.color = palette;
    html.dataset.mode = appearance.mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PALETTE_MAIN[palette]);
  }, [appearance.color, appearance.mode, today]);
}
