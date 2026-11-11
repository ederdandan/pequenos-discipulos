import { Check, Dumbbell, Lock, Play, Star, X } from 'lucide-react';
import { findLevel, isLevelUnlocked, trackLevels, tracks } from '../data/curriculum';
import { useStore } from '../store/AppStore';
import { AGE_GROUPS, INACTIVITY_DAYS } from '../lib/rules';
import type { AgeGroup, Level, Unit } from '../types';
import { DailyPanel } from '../components/DailyPanel';
import { QuestsPanel } from '../components/QuestsPanel';

interface Props {
  onStart: (levelId: string, practice: boolean) => void;
  onReview: () => void;
}

// Deslocamento horizontal dos nós para formar um caminho em zigue-zague.
const OFFSETS = [0, 60, 90, 60, 0, -60, -90, -60];

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
  let globalIdx = 0;

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
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-brand-600 bg-brand-50 p-4 text-left hover:bg-brand-100"
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
          <div className="flex flex-col items-center gap-6">
            {unit.levels.map((level) => {
              const offset = OFFSETS[globalIdx++ % OFFSETS.length];
              return (
                <LevelNode
                  key={level.id}
                  level={level}
                  offset={offset}
                  done={active.completedLevels.includes(level.id)}
                  unlocked={isLevelUnlocked(g, level.id, active.completedLevels)}
                  started={inProgress?.levelId === level.id}
                  noHearts={noHearts}
                  onStart={onStart}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function TrackHeader({ g, done, total, questions }: { g: AgeGroup; done: number; total: number; questions: number }) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-extrabold">
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
      className="relative mb-8 overflow-hidden rounded-2xl border-b-4 p-5 text-white"
      style={{ backgroundColor: unit.color, borderBottomColor: 'rgb(0 0 0 / 0.3)' }}
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
          <p className="text-xs font-extrabold uppercase tracking-wider text-gold-200">{PILLARS[unit.catechismPart]}</p>
          <h2 className="text-xl font-extrabold">{unit.title}</h2>
          <p className="opacity-90">{unit.description}</p>
        </div>
      </div>
    </div>
  );
}

function LevelNode({
  level,
  offset,
  done,
  unlocked,
  started,
  noHearts,
  onStart,
}: {
  level: Level;
  offset: number;
  done: boolean;
  unlocked: boolean;
  started: boolean;
  noHearts: boolean;
  onStart: Props['onStart'];
}) {
  const current = unlocked && !done;
  // Sem corações: lições concluídas viram treino; novas ficam bloqueadas.
  const practice = done && noHearts;
  const playable = unlocked && (!noHearts || done);

  return (
    <div className="flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {current && !noHearts && (
        <span className="mb-2 animate-bounce rounded-xl border-2 border-gold-200 bg-white px-3 py-1 text-sm font-extrabold uppercase text-brand-700">
          {started ? 'Continuar' : 'Começar'}
        </span>
      )}
      <button
        onClick={() => playable && onStart(level.id, practice)}
        disabled={!playable}
        title={level.description}
        className={`relative flex size-20 items-center justify-center rounded-full border-b-8 text-3xl transition active:translate-y-1 active:border-b-4 ${
          done
            ? 'border-pentecost-dark bg-pentecost text-white'
            : unlocked
              ? 'border-brand-800 bg-brand-700 text-white'
              : 'border-slate-300 bg-slate-200 text-slate-400'
        } ${current ? 'ring-4 ring-gold-400/60 ring-offset-4 ring-offset-parchment' : ''} ${!playable ? 'cursor-not-allowed' : ''}`}
      >
        {/* medalha: aro dourado interno */}
        {unlocked && <span className="pointer-events-none absolute inset-1.5 rounded-full border-2 border-gold-300/80" />}
        {!unlocked ? <Lock className="size-8" /> : <span>{level.icon}</span>}
        {done && (
          <span className="absolute -right-1 -top-1 rounded-full border-2 border-white bg-gold-500 p-1 text-white">
            {practice ? <Dumbbell className="size-4" /> : <Check className="size-4" strokeWidth={4} />}
          </span>
        )}
        {current && <Star className="absolute -bottom-2 size-5 text-gold-400" fill="currentColor" />}
      </button>
      <span className={`mt-2 max-w-40 text-center font-extrabold leading-tight ${unlocked ? 'text-slate-700' : 'text-slate-400'}`}>
        {level.title}
      </span>
    </div>
  );
}
