import { Trophy } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { Avatar } from '../components/Avatar';
import { leagueTier } from '../lib/rules';
import { daysUntilWeekReset } from '../lib/dates';

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardPage() {
  const { state, active } = useStore();
  const ranking = [...state.profiles].sort((a, b) => b.weeklyXp - a.weeklyXp);
  const days = daysUntilWeekReset();
  const tier = active ? leagueTier(active.weeklyXp) : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="mx-auto size-14 text-gold-400" fill="currentColor" />
        <h1 className="text-2xl font-extrabold">Liga da Família</h1>
        <p className="text-slate-500">
          A semana termina em <b>{days} {days === 1 ? 'dia' : 'dias'}</b> · o XP semanal zera na segunda
        </p>
        {tier && (
          <p className={`mt-2 font-extrabold ${tier.color}`}>
            {tier.icon} Você está na divisão {tier.name}
          </p>
        )}
      </div>

      {ranking.length < 2 && (
        <p className="rounded-2xl bg-brand-50 p-4 text-center text-brand-700">
          Crie perfis para outras pessoas da família e comecem a competir! 👨‍👩‍👧‍👦
        </p>
      )}

      <ol className="divide-y-2 divide-slate-100 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white">
        {ranking.map((p, i) => {
          const t = leagueTier(p.weeklyXp);
          return (
            <li
              key={p.id}
              className={`flex items-center gap-4 px-5 py-4 ${p.id === active?.id ? 'bg-brand-50' : ''}`}
            >
              <span className="w-8 text-center text-xl font-extrabold text-slate-400">{MEDALS[i] ?? i + 1}</span>
              <Avatar profile={p} size="md" />
              <div className="flex-1">
                <p className="font-extrabold">
                  {p.name} {p.id === active?.id && <span className="text-sm text-brand-600">(você)</span>}
                </p>
                <p className="text-sm text-slate-400">
                  {t.icon} {t.name} · 🕯️ {p.streak}
                </p>
              </div>
              <span className="font-extrabold text-gold-600">{p.weeklyXp} XP</span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 text-sm text-slate-500">
        <p className="mb-1 font-extrabold text-slate-700">Divisões</p>
        🥉 Bronze: 0–59 XP · 🥈 Prata: 60–149 XP · 🥇 Ouro: 150+ XP na semana
      </div>
    </div>
  );
}
