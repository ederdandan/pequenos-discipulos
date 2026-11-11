/** Data local no formato AAAA-MM-DD. */
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Diferença em dias entre duas chaves AAAA-MM-DD. */
export function daysBetween(a: string, b: string) {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  const ta = Date.UTC(ya, ma - 1, da);
  const tb = Date.UTC(yb, mb - 1, db);
  return Math.round((tb - ta) / 86_400_000);
}

/**
 * Identificador da semana da liga. A semana começa na segunda-feira, então o
 * ranking zera na virada de domingo para segunda (meia-noite, horário local).
 */
export function weekKey(d = new Date()) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = (date.getDay() + 6) % 7; // segunda = 0
  date.setDate(date.getDate() - dayNum + 3); // quinta da mesma semana
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7,
    );
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Dias que faltam para o reset da liga (próxima segunda). */
export function daysUntilWeekReset(d = new Date()) {
  const dayNum = (d.getDay() + 6) % 7;
  return 7 - dayNum;
}
