import { RotateCcw, Target } from 'lucide-react';
import type { UserProfile } from '../types';
import { dailyGoal, dailyXpToday, reviewQueue } from '../lib/rules';
import { useNow } from '../lib/useNow';

function whenLabel(ts: number, now: number) {
  const hours = Math.round((ts - now) / 3_600_000);
  if (hours < 1) return 'em alguns minutos';
  if (hours < 24) return `em ${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'amanhã' : `em ${days} dias`;
}

/** Meta diária + revisão de erros, no topo da trilha. */
export function DailyPanel({ profile, onReview }: { profile: UserProfile; onReview: () => void }) {
  const now = useNow(60_000);
  const goal = dailyGoal(profile);
  const xp = dailyXpToday(profile, new Date(now));
  const done = xp >= goal;
  const pct = Math.min(100, (xp / goal) * 100);
  const { due, scheduled, nextDue } = reviewQueue(profile, now);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div
        className={`rounded-2xl border-2 p-4 ${done ? 'border-gold-300 bg-gold-50' : 'border-slate-200 bg-white'}`}
      >
        <p className="mb-2 flex items-center justify-between font-extrabold">
          <span className="flex items-center gap-2">
            <Target className={`size-5 ${done ? 'text-gold-600' : 'text-brand-600'}`} />
            {done ? 'Meta de hoje batida!' : 'Meta de hoje'}
          </span>
          <span className="text-sm text-slate-500">
            {Math.min(xp, goal)}/{goal} XP
          </span>
        </p>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {done ? '🎉 Volte amanhã para manter o ritmo.' : `Faltam ${goal - xp} XP — uma lição dá 20 XP.`}
        </p>
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
        <p className="mb-1 flex items-center gap-2 font-extrabold">
          <RotateCcw className="size-5 text-brand-600" /> Revisão de erros
        </p>
        {due.length > 0 ? (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {due.length} {due.length === 1 ? 'item para' : 'itens para'} revisar agora. Não gasta chamas e
              recupera 1.
            </p>
            <button
              onClick={onReview}
              className="w-full rounded-xl border-2 border-b-4 border-brand-700 bg-brand-600 py-2 font-extrabold uppercase text-white hover:bg-brand-500"
            >
              Revisar ({Math.min(due.length, 10)})
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            {scheduled > 0
              ? `Tudo em dia! ${scheduled} ${scheduled === 1 ? 'item volta' : 'itens voltam'} ${whenLabel(nextDue, now)}.`
              : 'Nada para revisar. Quando você errar algo, ele aparece aqui para fixar.'}
          </p>
        )}
      </div>
    </div>
  );
}
