import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { Avatar } from '../components/Avatar';
import { leagueTier } from '../lib/rules';
import { daysUntilWeekReset } from '../lib/dates';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Dois jeitos de ver a família: XP da semana (quem estudou mais) ou constância (dias seguidos e
 * metas batidas). Na constância, quem estuda um pouco todo dia — como uma criança — fica no topo.
 */
type Sort = 'xp' | 'constancia';

export function LeaderboardPage() {
  const { state, active } = useStore();
  const [sort, setSort] = useState<Sort>('xp');
  const ranking = [...state.profiles].sort((a, b) =>
    sort === 'xp' ? b.weeklyXp - a.weeklyXp : b.streak - a.streak || b.goalDays - a.goalDays,
  );
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

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Ordenar a família">
        {(
          [
            ['xp', '⚡ XP da semana'],
            ['constancia', '🕯️ Constância'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={sort === id}
            onClick={() => setSort(id)}
            className={`rounded-xl py-2 text-sm font-bold transition ${sort === id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="-mt-3 text-center text-sm text-slate-500">
        {sort === 'xp'
          ? 'Toda lição vale o mesmo XP em qualquer faixa: conta o quanto cada um estudou.'
          : 'Dias seguidos estudando e metas batidas: quem estuda um pouco todo dia fica na frente.'}
      </p>

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
              <span className="w-8 text-center text-xl font-extrabold text-slate-500">{MEDALS[i] ?? i + 1}</span>
              <Avatar profile={p} size="md" />
              <div className="flex-1">
                <p className="font-extrabold">
                  {p.name} {p.id === active?.id && <span className="text-sm text-brand-600">(você)</span>}
                </p>
                <p className="text-sm text-slate-500">
                  {t.icon} {t.name} · 🕯️ {p.streak}
                </p>
              </div>
              <span className="text-right font-extrabold text-gold-600">
                {sort === 'xp' ? (
                  `${p.weeklyXp} XP`
                ) : (
                  <>
                    🕯️ {p.streak} {p.streak === 1 ? 'dia' : 'dias'}
                    <span className="block text-xs font-semibold text-slate-500">{p.goalDays} metas</span>
                  </>
                )}
              </span>
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
