import { Check, Dumbbell, Lock, Play, X } from 'lucide-react';
import { findLevel, isLevelUnlocked, trackLevels, tracks } from '../data/curriculum';
import { useStore } from '../store/AppStore';
import { AGE_GROUPS, INACTIVITY_DAYS } from '../lib/rules';
import type { AgeGroup, Level, Unit } from '../types';
import { DailyPanel } from '../components/DailyPanel';
import { QuestsPanel } from '../components/QuestsPanel';
import { Shield } from '../components/icons';
import { STAGES } from '../data/schema';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Lamb } from '../components/Lamb';
import { DIFFICULTY, difficultyOf, nextDifficulty, setDifficulty, type Difficulty } from '../lib/difficulty';

interface Props {
  onStart: (levelId: string, practice: boolean) => void;
  onReview: () => void;
  /** Abre a aba Perfil na escolha de nível. */
  onChooseLevel: () => void;
}

export function PathPage({ onStart, onReview, onChooseLevel }: Props) {
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
      {active.levelOffer && (
        <LevelOffer
          name={active.name}
          current={difficultyOf(active)}
          onAnswer={(d) => updateActive((p) => (d ? setDifficulty(p, d) : { ...p, levelOffer: false }))}
          onChooseLevel={() => {
            updateActive((p) => ({ ...p, levelOffer: false }));
            onChooseLevel();
          }}
        />
      )}

      {active.notice && (
        <div className="relative rounded-2xl border-2 border-gold-300 bg-gold-50 p-4 pr-10 text-gold-800">
          <p className="font-extrabold">⏰ Etapa reiniciada</p>
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

      <TrackHeader g={g} difficulty={difficultyOf(active)} done={doneCount} total={levels.length} questions={questions} />

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

/** Concluiu a trilha toda: pergunta se quer mudar de nível e explica onde fazer isso depois. */
function LevelOffer({
  name,
  current,
  onAnswer,
  onChooseLevel,
}: {
  name: string;
  current: Difficulty;
  onAnswer: (d: Difficulty | null) => void;
  onChooseLevel: () => void;
}) {
  const next = nextDifficulty(current);
  const cur = DIFFICULTY[current];
  return (
    <BottomSheet title="Trilha concluída!" onClose={() => onAnswer(null)}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Lamb pose="sucesso" size={130} animated />
        <p className="text-lg font-extrabold">
          Parabéns, {name}! Você concluiu toda a trilha no nível {cur.icon} {cur.label}.
        </p>
        {next ? (
          <p className="text-slate-600">
            Quer mudar para o nível <b>{DIFFICULTY[next].icon} {DIFFICULTY[next].label}</b>? A trilha recomeça do
            início com um jeito mais desafiador de responder ({DIFFICULTY[next].hint.toLowerCase()}). Seu progresso no{' '}
            {cur.label} fica guardado.
          </p>
        ) : (
          <p className="text-slate-600">
            Você chegou ao nível mais alto! Continue treinando as lições ou escolha outro nível para recomeçar a trilha.
          </p>
        )}
        <div className="mt-2 flex w-full flex-col gap-2">
          {next && <Button onClick={() => onAnswer(next)}>Sim, mudar para {DIFFICULTY[next].label}</Button>}
          <Button variant="secondary" onClick={onChooseLevel}>
            Escolher outro nível
          </Button>
          <Button variant="ghost" onClick={() => onAnswer(null)}>
            {next ? `Agora não, continuar no ${cur.label}` : 'Continuar'}
          </Button>
        </div>
        <p className="rounded-2xl bg-brand-50 p-3 text-sm text-brand-700">
          💡 Você pode mudar de nível quando quiser em <b>Perfil → Nível de dificuldade</b>.
        </p>
      </div>
    </BottomSheet>
  );
}

function TrackHeader({
  g,
  difficulty,
  done,
  total,
  questions,
}: {
  g: AgeGroup;
  difficulty: Difficulty;
  done: number;
  total: number;
  questions: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-bold">
          {AGE_GROUPS[g].emoji} Trilha {AGE_GROUPS[g].label} · {DIFFICULTY[difficulty].icon} {DIFFICULTY[difficulty].label}
        </p>
        <p className="text-sm font-bold text-slate-400">
          {done}/{total} lições · {questions} perguntas
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Cada etapa passa por todos os temas e é um pouco mais difícil que a anterior. Fique {INACTIVITY_DAYS} dias sem
        estudar e a etapa atual recomeça (as anteriores ficam salvas). O nível de dificuldade muda em Perfil.
      </p>
    </div>
  );
}

/** Cabeçalho da etapa com fundo de vitral (losangos translúcidos) e o nível de dificuldade. */
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
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-200">
            Etapa {unit.stage} de {STAGES.length}
            <span className="flex gap-0.5" aria-label={`Dificuldade ${unit.stage} de ${STAGES.length}`}>
              {STAGES.map((_, i) => (
                <span key={i} className={`size-1.5 rounded-full ${i < unit.stage ? 'bg-gold-300' : 'bg-white/30'}`} />
              ))}
            </span>
          </p>
          <h2 className="font-serif text-xl font-bold">{unit.title}</h2>
          <p className="opacity-90">
            {unit.description} · {unit.levels.length} lições · {unit.levels.reduce((n, l) => n + l.exercises.length, 0)} perguntas
          </p>
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
          <span
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
            style={{ color: unlocked ? level.theme.color : undefined }}
          >
            {level.theme.icon} {level.theme.title}
          </span>
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
