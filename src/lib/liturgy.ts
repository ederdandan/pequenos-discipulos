// Calendário litúrgico (rito romano, como no Brasil) para a cor automática do tema.
// Calcula o tempo e a cor de um dia: Advento, Natal, Tempo Comum, Quaresma, Tríduo, Páscoa.
// Simplificação consciente: solenidades e festas do Tempo Comum (ex.: Cristo Rei, apóstolos)
// não mudam a cor; só os tempos e os dias mais marcantes (Gaudete, Laetare, Ramos, Sexta-feira
// Santa, Pentecostes).

export type LiturgicalColor = 'roxo' | 'rosa' | 'branco' | 'verde' | 'vermelho';

export interface LiturgicalDay {
  /** Nome do tempo ou do dia (ex.: "Advento", "Domingo de Pentecostes"). */
  season: string;
  color: LiturgicalColor;
}

/** Meia-noite local do dia (para comparar só datas). */
const day = (y: number, m: number, d: number) => new Date(y, m, d);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const same = (a: Date, b: Date) => a.getTime() === b.getTime();

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
export function easter(y: number): Date {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const dd = ((h + l - 7 * m + 114) % 31) + 1;
  return day(y, month - 1, dd);
}

/** 1º Domingo do Advento: o 4º domingo antes do Natal (entre 27/11 e 3/12). */
export function adventStart(y: number): Date {
  const christmas = day(y, 11, 25);
  return addDays(christmas, -(christmas.getDay() || 7) - 21);
}

/**
 * Batismo do Senhor (fim do Tempo do Natal). No Brasil a Epifania é no domingo entre 2 e 8/1;
 * o Batismo é no domingo seguinte, ou na segunda-feira se a Epifania cair em 7 ou 8/1.
 */
export function baptismOfTheLord(y: number): Date {
  const jan2 = day(y, 0, 2);
  const epiphany = addDays(jan2, (7 - jan2.getDay()) % 7);
  return epiphany.getDate() >= 7 ? addDays(epiphany, 1) : addDays(epiphany, 7);
}

export function liturgicalDay(date = new Date()): LiturgicalDay {
  const d = day(date.getFullYear(), date.getMonth(), date.getDate());
  const y = d.getFullYear();
  const e = easter(y);
  const advent = adventStart(y);
  const ash = addDays(e, -46);
  const pentecost = addDays(e, 49);

  // Tempo do Natal: 25/12 até o Batismo do Senhor (atravessa o ano).
  if (d >= day(y, 11, 25) || d <= baptismOfTheLord(y)) return { season: 'Tempo do Natal', color: 'branco' };
  if (d >= advent) {
    if (same(d, addDays(advent, 14))) return { season: 'Domingo Gaudete (Advento)', color: 'rosa' };
    return { season: 'Advento', color: 'roxo' };
  }
  if (d >= ash && d < addDays(e, -3)) {
    if (same(d, addDays(e, -21))) return { season: 'Domingo Laetare (Quaresma)', color: 'rosa' };
    if (same(d, addDays(e, -7))) return { season: 'Domingo de Ramos', color: 'vermelho' };
    return { season: 'Quaresma', color: 'roxo' };
  }
  if (same(d, addDays(e, -3))) return { season: 'Quinta-feira Santa', color: 'branco' };
  if (same(d, addDays(e, -2))) return { season: 'Sexta-feira Santa', color: 'vermelho' };
  if (same(d, addDays(e, -1))) return { season: 'Sábado Santo', color: 'roxo' };
  if (same(d, pentecost)) return { season: 'Domingo de Pentecostes', color: 'vermelho' };
  if (d >= e && d < pentecost) return { season: 'Tempo Pascal', color: 'branco' };
  return { season: 'Tempo Comum', color: 'verde' };
}

/** Milissegundos até a meia-noite seguinte (para trocar a cor na virada do dia sem recarregar). */
export const msToMidnight = (now = new Date()) =>
  Math.max(1000, addDays(day(now.getFullYear(), now.getMonth(), now.getDate()), 1).getTime() - now.getTime());

