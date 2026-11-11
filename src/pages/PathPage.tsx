import { Check, Dumbbell, Lock, Play, X } from 'lucide-react';
import { findLevel, isLevelUnlocked, trackLevels, tracks } from '../data/curriculum';
import { useStore } from '../store/AppStore';
import { AGE_GROUPS, INACTIVITY_DAYS } from '../lib/rules';
import type { AgeGroup, Level, Unit } from '../types';
import { DailyPanel } from '../components/DailyPanel';
import { QuestsPanel } from '../components/QuestsPanel';
import { Shield } from '../components/icons';

interface Props {
  onStart: (levelId: string, practice: boolean) => void;
  onReview: () => void;
}

export function PathPage({ onStart, onReview }: Props) {
  const { active, updateActive } = useStore();
  if (!active) return null;
  const g = active.ageGroup;
  const noHearts = active.hearts <= 0;
  const levels = trackLevels(g);
  const doneCount = levels.filter((l) => active.completedLevels.includes(l.id)).length;
  const questions = levels.reduce((n, l) => n + l.exercises.length, 0);
  const inProgress =
    active.lessonInProgress && levels.some((l) => l.id === active.lessonInProgress!.levelId)
      ? active.lessonInProgress
      : null;
  const inProgressLevel = inProgress ? findLevel(inProgress.levelId, g) : undefined;

  return (
    <div className="space-y-8 pb-8">
      {active.notice && (
        <div className="relative rounded-2xl border-2 border-gold-300 bg-gold-50 p-4 pr-10 text-gold-800">
          <p className="font-extrabold">⏰ Módulo reiniciado</p>
          <p className="text-sm">{active.notice}</p>
          <button
            onClick={() => updateActive((p) => ({ ...p, notice: null }))}
            className="absolute right-3 top-3 text-gold-500 hover:text-gold-700"
            aria-label="Fechar aviso"
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      {inProgress && !(noHearts && !inProgress.practice) && (
        <button
          onClick={() => onStart(inProgress.levelId, inProgress.practice)}
          className="flex w-full items-center gap-3 rounded-2xl border shadow-sm border-brand-600 bg-brand-50 p-4 text-left hover:bg-brand-100"
        >
          <Play className="size-8 shrink-0 text-brand-600" fill="currentColor" />
          <span>
            <span className="block font-extrabold text-brand-700">Continuar “{inProgressLevel?.title}”</span>
            <span className="text-sm text-brand-700/80">
              Você já acertou {inProgress.solved} de {inProgressLevel?.exercises.length}. Seu progresso está salvo.
            </span>
          </span>
        </button>
      )}

      <DailyPanel profile={active} onReview={onReview} />
      <QuestsPanel />

      {noHearts && (
        <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 text-orange-800">
          <p className="font-extrabold">🕊️ Sem chamas por enquanto</p>
          <p className="text-sm">
            Faça a <b>revisão de erros</b> ou <b>treine</b> uma lição já concluída para reacender 1 chama — ou espere a recarga.
          </p>
        </div>
      )}

      <TrackHeader g={g} done={doneCount} total={levels.length} questions={questions} />

      {tracks[g].map((unit) => (
        <section key={unit.id}>
          <ModuleHeader unit={unit} />
          {/* Caminho vertical: cada lição é um escudo ligado ao próximo por uma linha pontilhada. */}
          <ol className="relative ml-2">
            {unit.levels.map((level, i) => (
              <LevelRow
                key={level.id}
                level={level}
                last={i === unit.levels.length - 1}
                done={active.completedLevels.includes(level.id)}
                unlocked={isLevelUnlocked(g, level.id, active.completedLevels)}
                started={inProgress?.levelId === level.id}
                noHearts={noHearts}
                onStart={onStart}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function TrackHeader({ g, done, total, questions }: { g: AgeGroup; done: number; total: number; questions: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-bold">
          {AGE_GROUPS[g].emoji} Trilha {AGE_GROUPS[g].label}
        </p>
        <p className="text-sm font-bold text-slate-400">
          {done}/{total} lições · {questions} perguntas
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Fique {INACTIVITY_DAYS} dias sem estudar e o módulo atual recomeça (os anteriores ficam salvos).
      </p>
    </div>
  );
}

const PILLARS: Record<number, string> = {
  1: 'Pilar 1 · A Profissão de Fé',
  2: 'Pilar 2 · Os Sacramentos',
  3: 'Pilar 3 · A Vida em Cristo',
  4: 'Pilar 4 · A Oração Cristã',
  5: 'Módulo especial',
};

/** Cabeçalho do módulo com fundo de vitral (losangos translúcidos). */
function ModuleHeader({ unit }: { unit: Unit }) {
  return (
    <div
      className="relative mb-6 overflow-hidden rounded-2xl p-5 text-white shadow-md"
      style={{ backgroundColor: unit.color }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent 0 22px, #fff 22px 23px), repeating-linear-gradient(-45deg, transparent 0 22px, #fff 22px 23px)',
        }}
      />
      <div className="relative flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-gold-300 bg-white/15 text-3xl">
          {unit.icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-200">{PILLARS[unit.catechismPart]}</p>
          <h2 className="font-serif text-xl font-bold">{unit.title}</h2>
          <p className="opacity-90">{unit.description}</p>
        </div>
      </div>
    </div>
  );
}

function LevelRow({
  level,
  last,
  done,
  unlocked,
  started,
  noHearts,
  onStart,
}: {
  level: Level;
  last: boolean;
  done: boolean;
  unlocked: boolean;
  started: boolean;
  noHearts: boolean;
  onStart: Props['onStart'];
}) {
  const current = unlocked && !done;
  // Sem chamas: lições concluídas viram treino; novas ficam bloqueadas.
  const practice = done && noHearts;
  const playable = unlocked && (!noHearts || done);
  const shield = done
    ? { fill: '#DC2626', stroke: '#991B1B' }
    : unlocked
      ? { fill: '#1E3A8A', stroke: '#172554' }
      : { fill: '#E2E8F0', stroke: '#CBD5E1' };
  const status = done
    ? practice
      ? 'Treinar'
      : 'Concluída · treinar de novo'
    : current
      ? noHearts
        ? 'Aguardando chamas'
        : started
          ? 'Continuar'
          : 'Começar'
      : 'Bloqueada';

  return (
    <li className="relative flex gap-4 pb-6">
      {!last && (
        <span
          className={`absolute left-[31px] top-16 bottom-0 border-l-2 border-dashed ${done ? 'border-pentecost/50' : 'border-gold-300'}`}
          aria-hidden="true"
        />
      )}
      <button
        onClick={() => playable && onStart(level.id, practice)}
        disabled={!playable}
        className={`group flex flex-1 items-center gap-4 text-left ${!playable ? 'cursor-not-allowed' : ''}`}
      >
        <span className={`relative transition ${playable ? 'group-hover:scale-105' : ''}`}>
          <Shield size={64} {...shield}>
            {!unlocked ? <Lock className="size-6 text-slate-400" /> : <span className="text-3xl">{level.icon}</span>}
          </Shield>
          {done && (
            <span className="absolute -right-1 top-0 rounded-full border-2 border-white bg-gold-500 p-0.5 text-white">
              {practice ? <Dumbbell className="size-3.5" /> : <Check className="size-3.5" strokeWidth={4} />}
            </span>
          )}
        </span>
        <span
          className={`flex-1 rounded-xl border p-4 transition ${
            current
              ? 'border-gold-400 bg-white shadow-md ring-2 ring-gold-200'
              : unlocked
                ? 'border-slate-200 bg-white shadow-sm group-hover:border-brand-200'
                : 'border-slate-200 bg-slate-50'
          }`}
        >
          <span className={`block font-bold ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{level.title}</span>
          <span className="block text-sm text-slate-500">{level.description}</span>
          <span
            className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold ${
              current ? 'text-brand-700' : done ? 'text-pentecost' : 'text-slate-400'
            }`}
          >
            {current && !noHearts && <Play className="size-3.5" fill="currentColor" />}
            {status} · {level.exercises.length} perguntas
          </span>
        </span>
      </button>
    </li>
  );
}
