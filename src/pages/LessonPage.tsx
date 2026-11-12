import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Volume2, X, XCircle } from 'lucide-react';
import type { AgeGroup, Exercise } from '../types';
import { findExercise, findLevel, trackLevels } from '../data/curriculum';
import { useStore } from '../store/AppStore';
import {
  BADGES,
  REVIEW_SESSION_SIZE,
  completeLesson,
  gradeReview,
  loseHeart,
  markForReview,
  recordAnswer,
  reviewQueue,
  ttsRateFor,
  type LessonReward,
} from '../lib/rules';
import { sounds } from '../lib/sounds';
import { newlyCompleted, questsAfterAnswer, questsAfterLesson, type Quest } from '../lib/quests';
import { speak } from '../lib/speech';
import { Button } from '../components/Button';
import { correctAnswer, type AudioMode } from '../components/exercises/shared';
import { MultipleChoice } from '../components/exercises/MultipleChoice';
import { FillBlank } from '../components/exercises/FillBlank';
import { WordBank } from '../components/exercises/WordBank';
import { Speaking } from '../components/exercises/Speaking';
import { MatchPairs } from '../components/exercises/MatchPairs';
import { TypeAnswer } from '../components/exercises/TypeAnswer';
import { Lamb, usePreloadLamb, type LambPose } from '../components/Lamb';
import { FlameIcon, RosaryProgress } from '../components/icons';
import { BottomSheet } from '../components/BottomSheet';
import { describeReference, sourceSummary } from '../lib/sources';
import { adaptExercises, difficultyOf } from '../lib/difficulty';

interface Props {
  /** Lição a jogar (vazio no modo revisão). */
  levelId: string;
  /** Treino: revisa lição já feita, não perde chamas e recupera 1. */
  practice: boolean;
  /** Revisão de erros: exercícios que a pessoa errou e estão na hora de revisar. */
  review?: boolean;
  onExit: () => void;
}

type Feedback = { correct: boolean; answer: string; exercise: Exercise } | null;

/** Tela rápida de incentivo do Cordeirinho entre uma pergunta e outra (só em momentos especiais). */
type Cheer = { pose: LambPose; title: string; text: string };

const STREAK_CHEERS: Record<number, Cheer> = {
  3: { pose: 'sucesso', title: '3 seguidas!', text: 'Você está indo muito bem!' },
  5: { pose: 'sucesso', title: '5 seguidas!', text: 'Que beleza! Continue assim.' },
  8: { pose: 'sucesso', title: '8 seguidas!', text: 'Impressionante! O Espírito Santo está com você.' },
};

/** Escolhe o incentivo depois de uma resposta certa (ou nenhum). Um por vez, nunca dois seguidos. */
function pickCheer(o: {
  combo: number;
  afterMistake: boolean;
  solved: number;
  total: number;
  remaining: number;
  shown: Set<string>;
}): [key: string, cheer: Cheer] | null {
  if (STREAK_CHEERS[o.combo]) return [`combo-${o.combo}`, STREAK_CHEERS[o.combo]];
  if (o.afterMistake && !o.shown.has('perseverou'))
    return ['perseverou', { pose: 'fe', title: 'Perseverança!', text: 'Errar faz parte do caminho. Seguimos juntos!' }];
  // ">=" e não "===": se a metade cair numa resposta em pausa, aparece na seguinte (uma vez só).
  if (o.total >= 6 && o.solved >= Math.ceil(o.total / 2) && o.remaining > 1 && !o.shown.has('metade'))
    return ['metade', { pose: 'vamos', title: 'Metade do caminho!', text: 'Vamos em frente, falta pouco.' }];
  if (o.total >= 4 && o.remaining === 1 && !o.shown.has('ultima'))
    return ['ultima', { pose: 'vamos', title: 'Falta só uma!', text: 'Última pergunta. Vamos!' }];
  return null;
}

export function LessonPage({ levelId, practice, review = false, onExit }: Props) {
  const { active, updateActive } = useStore();
  // Só as perguntas da faixa etária do perfil.
  const level = active ? findLevel(levelId, active.ageGroup) : undefined;
  // Se a pessoa saiu no meio desta lição, continua exatamente de onde parou.
  const [saved] = useState(() => {
    const s = active?.lessonInProgress;
    return !review && s && s.levelId === levelId && s.practice === practice ? s : null;
  });
  const [queue, setQueue] = useState<Exercise[]>(() => {
    // Nível de dificuldade: as mesmas perguntas, com outro jeito de responder.
    const d = active ? difficultyOf(active) : 'normal';
    const pool = active && d !== 'normal' ? trackLevels(active.ageGroup).flatMap((l) => l.exercises) : [];
    if (review && active) {
      const due = reviewQueue(active)
        .due.slice(0, REVIEW_SESSION_SIZE)
        .map(findExercise)
        .filter((e): e is Exercise => !!e);
      return adaptExercises(due, d, pool);
    }
    const all = adaptExercises(level?.exercises ?? [], d, pool);
    if (!saved) return all;
    const restored = saved.queue.map((id) => all.find((e) => e.id === id)).filter((e): e is Exercise => !!e);
    return restored.length ? restored : all;
  });
  const [idx, setIdx] = useState(() => (saved && saved.idx < queue.length ? saved.idx : 0));
  const [mistakes, setMistakes] = useState(saved?.mistakes ?? 0);
  const [solved, setSolved] = useState(saved?.solved ?? 0);
  const [checker, setChecker] = useState<(() => boolean) | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [reward, setReward] = useState<LessonReward | null>(null);
  const [pendingReward, setPendingReward] = useState<LessonReward | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  // Na revisão só a 1ª tentativa de cada item conta para o agendamento.
  const [graded, setGraded] = useState<Set<string>>(() => new Set());
  const [total] = useState(() => (review ? queue.length : level?.exercises.length) || 1);
  const safe = review || practice; // não perde chamas
  // Acertos seguidos (para a missão "acerte N seguidas").
  const [combo, setCombo] = useState(0);
  const [questsDone, setQuestsDone] = useState<Quest[]>([]);
  const [cheer, setCheer] = useState<Cheer | null>(null);
  const [pendingCheer, setPendingCheer] = useState<Cheer | null>(null);
  const [cheersShown, setCheersShown] = useState<Set<string>>(() => new Set());
  // Depois de um incentivo, a resposta seguinte não ganha outro.
  const [cheerCooldown, setCheerCooldown] = useState(false);
  usePreloadLamb();
  const endCheer = useCallback(() => {
    setCheer(null);
    setPendingCheer(null);
  }, []);

  // setState com função precisa ser embrulhado para guardar a função em si.
  const onReady = useCallback((fn: (() => boolean) | null) => setChecker(() => fn), []);

  if (!active) return null;
  if (queue.length === 0) {
    return (
      <Screen>
        <Lamb pose="aprendendo" size={150} animated />
        <h1 className="text-3xl font-extrabold">Nada para revisar agora</h1>
        <p className="text-slate-500">Os itens que você errar aparecem aqui na hora certa.</p>
        <Button onClick={onExit}>Voltar</Button>
      </Screen>
    );
  }
  const ttsRate = ttsRateFor(active);
  const exercise = queue[idx];

  function check() {
    if (!checker || !exercise) return;
    const correct = checker();
    setFeedback({ correct, answer: correctAnswer(exercise), exercise });

    // Exercício errado volta no fim da fila: só termina quando acertar tudo.
    const nextQueue = correct ? queue : [...queue, exercise];
    const nextMistakes = mistakes + (correct ? 0 : 1);
    const nextSolved = solved + (correct ? 1 : 0);
    setQueue(nextQueue);
    setMistakes(nextMistakes);
    setSolved(nextSolved);
    if (correct) sounds.correct();
    else sounds.wrong();
    const nextCombo = correct ? combo + 1 : 0;
    setCombo(nextCombo);

    // Incentivo do Cordeirinho para mostrar depois do "Continuar" (nunca em duas perguntas seguidas).
    const picked =
      correct && !cheerCooldown
        ? pickCheer({
            combo: nextCombo,
            afterMistake: combo === 0 && mistakes > 0,
            solved: nextSolved,
            total,
            remaining: nextQueue.length - (idx + 1),
            shown: cheersShown,
          })
        : null;
    setPendingCheer(picked ? picked[1] : null);
    setCheerCooldown(!!picked);
    if (picked) setCheersShown((s) => new Set(s).add(picked[0]));

    // Última resposta certa: a lição já conta como concluída (mesmo se fechar agora).
    const firstTry = review && !graded.has(exercise.id);
    if (firstTry) setGraded((g) => new Set(g).add(exercise.id));

    if (correct && idx + 1 >= nextQueue.length) {
      let base = questsAfterAnswer(recordAnswer(active!, true), exercise.type, true, nextCombo);
      if (firstTry) base = gradeReview(base, exercise.id, true);
      const out = completeLesson(base, { levelId, mistakes: nextMistakes, practice, review });
      const finalProfile = questsAfterLesson(out.profile, { mistakes: nextMistakes, practice, review });
      updateActive(() => finalProfile);
      setQuestsDone(newlyCompleted(active!, finalProfile));
      setPendingReward(out.reward);
      return;
    }

    // Salva o progresso a cada resposta: sair e voltar não perde nada.
    updateActive((p) => {
      let n = questsAfterAnswer(recordAnswer(p, correct), exercise.type, correct, nextCombo);
      if (review) {
        if (firstTry) n = gradeReview(n, exercise.id, correct);
        return n;
      }
      // Errou na lição ou no treino: o item entra na revisão de erros.
      if (!correct) n = markForReview(n, exercise.id);
      if (!correct && !practice) n = loseHeart(n);
      return {
        ...n,
        lessonInProgress: {
          levelId,
          practice,
          queue: nextQueue.map((e) => e.id),
          idx: idx + 1,
          mistakes: nextMistakes,
          solved: nextSolved,
          updatedAt: Date.now(),
        },
      };
    });
    if (!correct && !safe && active!.hearts - 1 <= 0) setOutOfHearts(true);
  }

  function next() {
    setFeedback(null);
    setChecker(null);
    if (pendingReward) {
      setReward(pendingReward);
      sounds.complete();
      return;
    }
    if (outOfHearts) return;
    if (pendingCheer) setCheer(pendingCheer);
    setIdx((i) => i + 1);
  }

  if (reward)
    return (
      <LessonComplete
        reward={reward}
        mistakes={mistakes}
        practice={practice}
        review={review}
        quests={questsDone}
        onExit={onExit}
      />
    );

  if (outOfHearts && !feedback) {
    return (
      <Screen>
        <Lamb pose="descanso" size={150} animated />
        <h1 className="text-3xl font-extrabold">As chamas se apagaram</h1>
        <p className="max-w-sm text-slate-500">
          Sem problemas! Elas voltam a acender com o tempo (1 a cada 30 min), ou você pode{' '}
          <b>treinar uma lição já feita</b> para reacender uma chama agora.
        </p>
        <p className="max-w-sm font-bold text-brand-700">Seu progresso nesta lição ficou salvo.</p>
        <Button onClick={onExit}>Voltar para a trilha</Button>
      </Screen>
    );
  }

  // A próxima pergunta só aparece (e só é lida em voz alta) depois do incentivo.
  if (cheer) return <CheerScreen cheer={cheer} onDone={endCheer} />;

  // Áudio: Infantil lê sozinho (ainda aprendendo a ler); letra grande ganha o botão; os demais leem em silêncio.
  const audio: AudioMode = active.ageGroup === 'kids' ? 'auto' : active.largeText ? 'button' : 'off';
  const props = { ageGroup: active.ageGroup, ttsRate, audio, locked: !!feedback, onReady };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
      <header className="flex items-center gap-4 py-5">
        <button onClick={onExit} className="text-slate-400 hover:text-slate-600" aria-label="Sair da lição">
          <X className="size-7" />
        </button>
        <RosaryProgress done={Math.min(solved, total)} total={total} />
        {safe ? (
          <span className="rounded-lg bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
            {review ? 'Revisão' : 'Treino'}
          </span>
        ) : (
          <span className="flex items-center gap-1 font-bold text-fire" title="Chamas">
            <FlameIcon size={24} /> {active.hearts}
          </span>
        )}
      </header>

      <main key={`${idx}-${exercise.id}`} className="animate-question flex-1 py-6">
        {exercise.type === 'multiple-choice' && <MultipleChoice exercise={exercise} {...props} />}
        {exercise.type === 'fill-blank' && <FillBlank exercise={exercise} {...props} />}
        {exercise.type === 'word-bank' && <WordBank exercise={exercise} {...props} />}
        {exercise.type === 'speaking' && <Speaking exercise={exercise} {...props} />}
        {exercise.type === 'match-pairs' && <MatchPairs exercise={exercise} {...props} />}
        {exercise.type === 'type-answer' && <TypeAnswer exercise={exercise} {...props} />}
      </main>

      <footer
        className={`sticky bottom-0 -mx-4 mb-3 rounded-2xl border px-4 py-5 ${
          feedback
            ? feedback.correct
              ? 'animate-slide-up border-gold-300 bg-gold-50 shadow-lg'
              : 'animate-slide-up border-red-200 bg-red-50 shadow-lg'
            : 'border-transparent bg-parchment'
        }`}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {feedback && (
            <div className={`flex gap-3 ${feedback.correct ? 'text-gold-800' : 'text-red-800'}`}>
              <Lamb pose={feedback.correct ? 'sucesso' : 'ops'} size={76} once className="-my-2" />
              <div>
              <p className="flex items-center gap-2 font-serif text-xl font-bold">
                {feedback.correct ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
                {feedback.correct ? PRAISE[feedback.exercise.id.length % PRAISE.length] : 'Resposta certa:'}
              </p>
              {!feedback.correct && (
                <p className="mt-1 flex items-center gap-2 font-bold">
                  {feedback.answer}
                  {audio !== 'off' && (
                    <button onClick={() => speak(feedback.answer, ttsRate)} aria-label="Ouvir resposta">
                      <Volume2 className="size-5" />
                    </button>
                  )}
                </p>
              )}
              <Explanation exercise={feedback.exercise} age={active.ageGroup} audio={audio} ttsRate={ttsRate} />
              {!feedback.correct && (
                <p className="mt-1 text-sm opacity-80">
                  Essa volta no final {review ? 'da revisão' : 'da lição'} e também na sua revisão de erros.
                </p>
              )}
              </div>
            </div>
          )}
          {feedback ? (
            <Button variant={feedback.correct ? 'success' : 'danger'} onClick={next} className="sm:ml-auto sm:min-w-40">
              Continuar
            </Button>
          ) : (
            <Button onClick={check} disabled={!checker} className="sm:ml-auto sm:min-w-40">
              Verificar
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

const PRAISE = ['Muito bem!', 'Isso mesmo!', 'Excelente!', 'Que beleza!', 'Mandou bem!'];

/**
 * Explicação depois da resposta + fonte, conforme a faixa (seção 2.1 da especificação):
 * Infantil esconde a fonte; Juvenil e Adulto tocam em "Ver fonte" e abre um painel
 * com a referência por extenso e o resumo do que ela diz (src/data/fontes.json).
 */
function Explanation({ exercise, age, audio, ttsRate }: { exercise: Exercise; age: AgeGroup; audio: AudioMode; ttsRate: number }) {
  const [open, setOpen] = useState(false);
  const source = age === 'kids' ? undefined : exercise.sourceReference;
  if (!exercise.explanation && !source) return null;
  return (
    <div className="mt-2 space-y-2">
      {exercise.explanation && <p className="font-reading leading-snug text-slate-700">{exercise.explanation}</p>}
      {source && (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-current/20 bg-white/70 px-3 py-1 text-sm font-semibold hover:bg-white"
        >
          <BookOpen className="size-4" />
          {/* Adulto já vê a sigla; Juvenil vê só o convite. */}
          {age === 'adults' ? source : 'Ver fonte'}
          <ChevronRight className="size-4" />
        </button>
      )}
      {open && source && <SourceSheet source={source} audio={audio} ttsRate={ttsRate} onClose={() => setOpen(false)} />}
    </div>
  );
}

function SourceSheet({ source, audio, ttsRate, onClose }: { source: string; audio: AudioMode; ttsRate: number; onClose: () => void }) {
  const parts = describeReference(source);
  const summary = sourceSummary(source);
  return (
    <BottomSheet
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <BookOpen className="size-5 text-gold-600" /> Fonte
        </span>
      }
    >
      <ul className="space-y-2">
        {parts.map((p, i) => (
          <li key={i} className="rounded-xl border border-gold-200 bg-white p-3 shadow-sm">
            <p className="font-bold text-brand-700">{p.work}</p>
            {p.where && <p className="text-sm text-slate-500">{p.where}</p>}
          </li>
        ))}
      </ul>
      {summary && (
        <div className="mt-5">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gold-700">
            O que diz
            {audio !== 'off' && (
              <button onClick={() => speak(summary, ttsRate)} className="text-brand-600" aria-label="Ouvir o resumo">
                <Volume2 className="size-4" />
              </button>
            )}
          </p>
          <p className="font-reading text-lg leading-relaxed">{summary}</p>
          <p className="mt-3 text-xs text-slate-400">Resumo em palavras simples, não é citação literal.</p>
        </div>
      )}
      <p className="mt-5 text-xs text-slate-400">Referência: {source}</p>
    </BottomSheet>
  );
}

/** Incentivo rápido entre perguntas: some sozinho em ~1,8 s ou com um toque. */
function CheerScreen({ cheer, onDone }: { cheer: Cheer; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <button
      onClick={onDone}
      className="animate-fade mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
      aria-label={`${cheer.title} ${cheer.text} Toque para continuar.`}
    >
      <Lamb pose={cheer.pose} size={190} animated />
      <p className="font-serif text-3xl font-bold text-brand-700">{cheer.title}</p>
      <p className="text-lg text-slate-600">{cheer.text}</p>
      <p className="mt-4 text-sm text-slate-400">Toque para continuar</p>
    </button>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      {children}
    </div>
  );
}

function LessonComplete({
  reward,
  mistakes,
  practice,
  review,
  quests,
  onExit,
}: {
  reward: LessonReward;
  mistakes: number;
  practice: boolean;
  review: boolean;
  quests: Quest[];
  onExit: () => void;
}) {
  const pct = Math.min(100, (reward.dailyXp / reward.dailyGoal) * 100);
  return (
    <Screen>
      <Lamb pose={mistakes === 0 && !practice && !review ? 'fe' : 'sucesso'} size={160} animated />
      <h1 className="text-3xl font-extrabold text-gold-600">{review ? 'Revisão concluída!' : practice ? 'Treino concluído!' : 'Lição concluída!'}</h1>
      <div className="grid w-full grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-gold-400 bg-gold-50 p-4">
          <p className="text-sm font-semibold text-gold-700">Graça (XP)</p>
          <p className="text-3xl font-extrabold text-gold-600">+{reward.xp}</p>
        </div>
        <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-700">Velas acesas</p>
          <p className="text-3xl font-extrabold text-brand-700">🕯️ {reward.streak}</p>
        </div>
      </div>
      <div
        className={`w-full rounded-2xl border-2 p-4 text-left ${
          reward.dailyGoalReached ? 'animate-pop border-gold-400 bg-gold-50' : 'border-slate-200 bg-white'
        }`}
      >
        <p className="mb-2 flex justify-between font-extrabold">
          <span>{reward.dailyGoalReached ? '🎯 Meta diária batida!' : '🎯 Meta do dia'}</span>
          <span className="text-slate-500">
            {Math.min(reward.dailyXp, reward.dailyGoal)}/{reward.dailyGoal} XP
          </span>
        </p>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {(practice || review) && <p className="font-bold text-fire">+1 🔥 chama reacesa</p>}
      {mistakes === 0 && !practice && !review && <p className="font-bold text-gold-700">Sem erros! Bônus de perfeição 💎</p>}
      {quests.length > 0 && (
        <div className="w-full animate-pop rounded-2xl border-2 border-gold-400 bg-gold-50 p-4">
          <p className="mb-1 font-extrabold text-gold-800">🎁 Missão concluída!</p>
          {quests.map((q) => (
            <p key={q.id} className="font-bold">
              {q.icon} {q.label}
            </p>
          ))}
          <p className="mt-1 text-sm text-gold-700">Abra o baú na trilha para pegar o prêmio.</p>
        </div>
      )}
      {reward.newBadges.length > 0 && (
        <div className="w-full rounded-2xl border-2 border-pentecost bg-red-50 p-4">
          <p className="mb-2 font-extrabold text-pentecost-dark">Nova conquista!</p>
          {reward.newBadges.map((b) => (
            <p key={b} className="text-lg font-bold">
              {BADGES[b]?.icon} {BADGES[b]?.label}
            </p>
          ))}
        </div>
      )}
      <Button onClick={onExit} className="w-full">
        Continuar
      </Button>
    </Screen>
  );
}
