import { LogOut, Snowflake, Trash2 } from 'lucide-react';
import type { AgeGroup } from '../types';
import { useStore } from '../store/AppStore';
import { trackLevels } from '../data/curriculum';
import type { HistoryEntry } from '../types';
import {
  AGE_GROUPS,
  BADGES,
  MAX_STREAK_FREEZES,
  STREAK_FREEZE_COST,
  buyStreakFreeze,
  DAILY_GOAL_OPTIONS,
  dailyGoal,
  maxHearts,
  setMaxHearts,
} from '../lib/rules';
import { Button } from '../components/Button';
import { HeartsPicker } from '../components/HeartsPicker';
import { Avatar } from '../components/Avatar';
import { PhotoPicker } from '../components/PhotoPicker';
import { InstallCard } from '../components/InstallCard';
import { ExportButton, ImportButton } from '../components/BackupControls';
import { LargeTextToggle } from '../components/LargeTextToggle';

export function ProfilePage() {
  const { active, updateActive, selectProfile, removeProfile } = useStore();
  if (!active) return null;

  const canBuy = active.xp >= STREAK_FREEZE_COST && active.streakFreezes < MAX_STREAK_FREEZES;
  const levels = trackLevels(active.ageGroup);
  const progress = Math.round((levels.filter((l) => active.completedLevels.includes(l.id)).length / levels.length) * 100);
  const totalAnswers = active.answers.correct + active.answers.wrong;
  const accuracy = totalAnswers ? Math.round((active.answers.correct / totalAnswers) * 100) : 0;

  function remove() {
    if (confirm(`Apagar o perfil de ${active!.name}? O progresso será perdido.`)) removeProfile(active!.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar profile={active} size="xl" />
        <div>
          <h1 className="text-2xl font-extrabold">{active.name}</h1>
          <p className="mb-2 text-slate-500">
            {AGE_GROUPS[active.ageGroup].emoji} {AGE_GROUPS[active.ageGroup].label} ({AGE_GROUPS[active.ageGroup].ages})
          </p>
          <PhotoPicker photo={active.photo} onChange={(photo) => updateActive((p) => ({ ...p, photo }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="XP total" value={active.xp} icon="⚡" />
        <Stat label="Dias seguidos" value={active.streak} icon="🕯️" />
        <Stat label="Esta semana" value={active.weeklyXp} icon="📅" />
        <Stat label="Trilha" value={`${progress}%`} icon="🗺️" />
        <Stat label="Respostas certas" value={active.answers.correct} icon="✅" />
        <Stat label="Respostas erradas" value={active.answers.wrong} icon="❌" />
        <Stat label="Taxa de acerto" value={`${accuracy}%`} icon="🎯" />
        <Stat label="Lições feitas" value={active.history.filter((h) => h.kind === 'lesson').length} icon="📚" />
        <Stat label="Metas batidas" value={active.goalDays} icon="🎯" />
        <Stat label="Para revisar" value={Object.keys(active.reviews).length} icon="🔁" />
        <Stat label="Erros fixados" value={active.mastered} icon="🧠" />
      </div>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-extrabold">🎯 Meta diária</h2>
        <p className="mb-3 text-sm text-slate-500">Quanto XP você quer ganhar por dia. Uma lição dá 20 XP.</p>
        <div className="grid grid-cols-4 gap-2">
          {DAILY_GOAL_OPTIONS.map((g, i) => (
            <button
              key={g}
              onClick={() => updateActive((p) => ({ ...p, dailyGoal: g }))}
              className={`rounded-2xl border shadow-sm p-2 text-center transition ${
                dailyGoal(active) === g ? 'border-gold-400 bg-gold-50 text-gold-800' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="block text-xl font-extrabold">{g} XP</span>
              <span className="text-xs font-bold text-slate-500">{['Leve', 'Regular', 'Sério', 'Intenso'][i]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-extrabold">🔥 Erros permitidos</h2>
        <p className="mb-3 text-sm text-slate-500">
          Quantos erros você pode cometer antes de pausar as lições novas. Cada erro apaga uma chama, e elas voltam a
          acender com o tempo. Hoje: <b>{maxHearts(active)}</b>.
        </p>
        <HeartsPicker value={maxHearts(active)} onChange={(v) => updateActive((p) => setMaxHearts(p, v))} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Conquistas</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Object.entries(BADGES).map(([id, b]) => {
            const has = active.badges.includes(id);
            return (
              <div
                key={id}
                title={b.description}
                className={`rounded-2xl border-2 p-3 text-center ${has ? 'border-pentecost/40 bg-red-50' : 'border-slate-200 opacity-40 grayscale'}`}
              >
                <div className="text-3xl">{b.icon}</div>
                <p className="text-xs font-extrabold">{b.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <InstallCard />

      <History entries={active.history} />

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
          <Snowflake className="size-5 text-brand-500" /> Bloqueio de sequência
        </h2>
        <p className="mb-3 text-sm text-slate-500">
          Protege sua sequência se você ficar um dia sem estudar. Você tem {active.streakFreezes}/{MAX_STREAK_FREEZES}.
        </p>
        <Button
          variant="secondary"
          disabled={!canBuy}
          onClick={() => updateActive((p) => buyStreakFreeze(p) ?? p)}
        >
          Comprar por {STREAK_FREEZE_COST} XP
        </Button>
      </section>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-extrabold">Faixa etária</h2>
        <p className="mb-3 text-sm text-slate-500">
          A trilha é a mesma para todos, mas as perguntas, a linguagem e as citações mudam conforme a faixa. As lições
          já concluídas continuam valendo se você trocar.
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AGE_GROUPS) as AgeGroup[]).map((g) => (
            <button
              key={g}
              onClick={() => updateActive((p) => ({ ...p, ageGroup: g }))}
              className={`rounded-xl border-2 px-3 py-2 font-bold ${
                active.ageGroup === g ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'
              }`}
            >
              {AGE_GROUPS[g].emoji} {AGE_GROUPS[g].label} <span className="text-xs text-slate-400">({AGE_GROUPS[g].ages})</span>
            </button>
          ))}
        </div>
        <div className="mt-4">
          <LargeTextToggle value={active.largeText} onChange={(v) => updateActive((p) => ({ ...p, largeText: v }))} />
        </div>
      </section>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-extrabold">Backup da família</h2>
        <p className="mb-3 text-sm text-slate-500">
          Os dados ficam só neste navegador. Exporte um arquivo para guardar ou levar para outro aparelho.
        </p>
        <div className="flex flex-wrap gap-4 font-bold text-brand-600">
          <ExportButton className="underline" />
          <ImportButton className="underline" />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => selectProfile(null)}>
          <LogOut className="size-5" /> Trocar de perfil
        </Button>
        <Button variant="ghost" onClick={remove} className="text-pentecost">
          <Trash2 className="size-5" /> Apagar perfil
        </Button>
      </div>
    </div>
  );
}

const KIND = {
  lesson: { icon: '📘', label: 'Lição' },
  practice: { icon: '💪', label: 'Treino' },
  review: { icon: '🔁', label: 'Revisão' },
  reset: { icon: '⏰', label: 'Módulo reiniciado' },
} as const;

function History({ entries }: { entries: HistoryEntry[] }) {
  return (
    <section className="rounded-3xl border-2 border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-lg font-extrabold">📜 Histórico</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma lição ainda. Que tal começar agora?</p>
      ) : (
        <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
          {entries.map((h, i) => (
            <li key={`${h.at}-${i}`} className="flex items-center gap-3 py-2">
              <span className="text-2xl">{KIND[h.kind].icon}</span>
              <div className="flex-1">
                <p className="font-bold">
                  {KIND[h.kind].label}: {h.title}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(h.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  {h.mistakes !== undefined && ` · ${h.mistakes === 0 ? 'sem erros' : `${h.mistakes} erro(s)`}`}
                </p>
              </div>
              {h.xp > 0 && <span className="font-extrabold text-gold-600">+{h.xp} XP</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-3">
      <p className="text-2xl font-extrabold">
        {icon} {value}
      </p>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
    </div>
  );
}
