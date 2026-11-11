import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { openChest, questDone, questValue, todaysQuests } from '../lib/quests';
import { sounds } from '../lib/sounds';
import { useNow } from '../lib/useNow';

function untilMidnight(now: number) {
  const d = new Date(now);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  const h = Math.floor((end - now) / 3_600_000);
  const m = Math.floor(((end - now) % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

/** Missões do dia: 3 desafios, cada um libera um baú com prêmio surpresa. */
export function QuestsPanel() {
  const { active, updateActive } = useStore();
  const now = useNow(60_000);
  const [justOpened, setJustOpened] = useState<string | null>(null);
  if (!active?.quests) return null;
  const quests = todaysQuests(active);
  const opened = active.quests.opened;
  const allOpened = quests.every((q) => opened[q.id]);

  function open(id: string) {
    const out = openChest(active!, id);
    if (!out) return;
    updateActive(() => out.profile);
    setJustOpened(id);
    sounds.complete();
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-extrabold">🗓️ Missões do dia</p>
        <p className="text-xs font-bold text-slate-400">
          {allOpened ? 'Tudo feito! ' : ''}Novas em {untilMidnight(now)}
        </p>
      </div>
      <ul className="space-y-3">
        {quests.map((q) => {
          const value = Math.min(questValue(active, q), q.target);
          const done = questDone(active, q);
          const prize = opened[q.id];
          return (
            <li key={q.id} className="flex items-center gap-3">
              <span className="text-2xl">{q.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-bold">{q.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${done ? 'bg-gold-400' : 'bg-brand-500'}`}
                      style={{ width: `${(value / q.target) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-slate-400">
                    {value}/{q.target}
                  </span>
                </div>
              </div>
              {prize ? (
                <span
                  className={`w-24 text-center text-xs font-extrabold text-gold-700 ${justOpened === q.id ? 'animate-pop' : ''}`}
                  title="Prêmio recebido"
                >
                  🎉 {prize}
                </span>
              ) : done ? (
                <button
                  onClick={() => open(q.id)}
                  className="w-24 animate-bounce rounded-xl border-2 border-b-4 border-gold-600 bg-gold-400 py-1 text-sm font-extrabold text-white hover:bg-gold-300"
                  aria-label={`Abrir baú da missão ${q.label}`}
                >
                  🎁 Abrir
                </button>
              ) : (
                <span className="w-24 text-center text-2xl opacity-40 grayscale" title="Baú fechado">
                  🎁
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

