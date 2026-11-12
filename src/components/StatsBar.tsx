import { CandleIcon, FlameIcon, GoalIcon, GraceIcon } from './icons';
import type { UserProfile } from '../types';
import { dailyGoal, dailyXpToday, maxHearts, msToNextHeart } from '../lib/rules';
import { useNow } from '../lib/useNow';

export function formatMs(ms: number) {
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Números do topo. Ao tocar, `onHelp` abre a explicação de cada um. */
export function StatsBar({ profile, onHelp }: { profile: UserProfile; onHelp?: () => void }) {
  const now = useNow(1000);
  const next = msToNextHeart(profile, now);
  return (
    <button
      type="button"
      onClick={onHelp}
      aria-label={`Velas ${profile.streak}, meta ${Math.min(dailyXpToday(profile), dailyGoal(profile))} de ${dailyGoal(profile)}, graça ${profile.xp}, chamas ${profile.hearts} de ${maxHearts(profile)}. Toque para ver o que significam.`}
      className="flex items-center gap-1.5 rounded-full text-sm font-bold sm:gap-2"
    >
      <span className="flex items-center gap-1 rounded-full bg-gold-50 px-2 py-1 text-gold-700 ring-1 ring-gold-200" title="Dias seguidos (vela acesa)">
        <CandleIcon size={18} /> {profile.streak}
      </span>
      <span
        className={`flex items-center gap-1 rounded-full px-2 py-1 ring-1 ${dailyXpToday(profile) >= dailyGoal(profile) ? 'bg-gold-50 text-gold-700 ring-gold-200' : 'bg-brand-50 text-brand-700 ring-brand-100'}`}
        title="Meta de hoje"
      >
        <GoalIcon size={18} /> {Math.min(dailyXpToday(profile), dailyGoal(profile))}/{dailyGoal(profile)}
      </span>
      <span className="hidden items-center gap-1 rounded-full bg-gold-50 px-2 py-1 text-gold-600 ring-1 ring-gold-200 sm:flex" title="Graça acumulada (XP)">
        <GraceIcon size={18} /> {profile.xp}
      </span>
      <span
        className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-fire ring-1 ring-orange-200"
        title={next !== null ? `Próxima chama em ${formatMs(next)}` : 'Chamas cheias'}
      >
        <FlameIcon size={18} /> {profile.hearts}
        <span className="text-xs font-bold text-orange-400">/{maxHearts(profile)}</span>
        {profile.hearts < maxHearts(profile) && next !== null && (
          <span className="text-xs font-bold text-slate-500">{formatMs(next)}</span>
        )}
      </span>
    </button>
  );
}
