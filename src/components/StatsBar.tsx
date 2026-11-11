import { Flame, Target, Zap } from 'lucide-react';
import type { UserProfile } from '../types';
import { dailyGoal, dailyXpToday, maxHearts, msToNextHeart } from '../lib/rules';
import { useNow } from '../lib/useNow';

export function formatMs(ms: number) {
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function StatsBar({ profile }: { profile: UserProfile }) {
  const now = useNow(1000);
  const next = msToNextHeart(profile, now);
  return (
    <div className="flex items-center gap-3 font-extrabold sm:gap-4">
      <span className="flex items-center gap-1 text-gold-700" title="Dias seguidos (vela acesa)">
        <span className="text-lg leading-none">🕯️</span> {profile.streak}
      </span>
      <span
        className={`flex items-center gap-1 ${dailyXpToday(profile) >= dailyGoal(profile) ? 'text-gold-600' : 'text-brand-600'}`}
        title="Meta de hoje"
      >
        <Target className="size-5" /> {Math.min(dailyXpToday(profile), dailyGoal(profile))}/{dailyGoal(profile)}
      </span>
      <span className="hidden items-center gap-1 text-gold-500 sm:flex" title="XP total">
        <Zap className="size-5" fill="currentColor" /> {profile.xp}
      </span>
      <span
        className="flex items-center gap-1 text-fire"
        title={next !== null ? `Próxima chama em ${formatMs(next)}` : 'Chamas cheias'}
      >
        <Flame className="size-5" fill="currentColor" /> {profile.hearts}
        <span className="text-xs font-bold text-orange-300">/{maxHearts(profile)}</span>
        {profile.hearts < maxHearts(profile) && next !== null && (
          <span className="text-xs font-bold text-slate-400">{formatMs(next)}</span>
        )}
      </span>
    </div>
  );
}
