import type { AgeGroup, AppState, UserProfile } from '../types';
import { MAX_HEARTS } from '../lib/rules';
import { weekKey } from '../lib/dates';

// Chave própria: no GitHub Pages todos os projetos do mesmo usuário dividem o
// mesmo localStorage (mesma origem), então não pode colidir com outros apps.
const KEY = 'pequenos_discipulos_data';
const AGE_IDS: AgeGroup[] = ['kids', 'teens', 'adults'];

export const emptyState = (): AppState => ({ version: 1, profiles: [], activeProfileId: null });

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return parseState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // modo privado / armazenamento cheio: o app continua funcionando na memória
  }
}

/** Valida e completa campos faltantes (aceita backups antigos ou de outro dispositivo). */
export function parseState(data: unknown): AppState {
  if (!data || typeof data !== 'object' || !Array.isArray((data as AppState).profiles)) {
    throw new Error('Arquivo inválido: não parece um backup do Pequenos Discípulos.');
  }
  const d = data as Partial<AppState>;
  const raw = (d.profiles ?? []) as Array<Partial<UserProfile> | null>;
  const profiles = raw
    .filter((p): p is Partial<UserProfile> & Pick<UserProfile, 'id' | 'name'> =>
      !!p && typeof p.id === 'string' && typeof p.name === 'string',
    )
    .map((p): UserProfile => ({
      avatar: '🙂',
      photo: null,
      ageGroup: 'adults' as const,
      largeText: false,
      xp: 0,
      weeklyXp: 0,
      weekId: weekKey(),
      streak: 0,
      lastActiveDate: null,
      streakFreezes: 0,
      hearts: MAX_HEARTS,
      maxHearts: MAX_HEARTS,
      heartsUpdatedAt: Date.now(),
      completedLevels: [],
      badges: [],
      createdAt: Date.now(),
      lessonInProgress: null,
      history: [],
      answers: { correct: 0, wrong: 0 },
      inactivityResetFor: null,
      dailyGoal: 20,
      dailyXp: 0,
      dailyDate: null,
      goalDays: 0,
      reviews: {},
      mastered: 0,
      quests: null,
      chestsOpened: 0,
      notice: null,
      ...p,
    }))
    .map(migrateAgeGroup);
  const activeProfileId = profiles.some((p) => p.id === d.activeProfileId) ? d.activeProfileId! : null;
  return { version: 1, profiles, activeProfileId };
}

/** Faixas antigas: "seniors" (60+) vira Adulto com letra grande; valor desconhecido vira Adulto. */
function migrateAgeGroup(p: UserProfile): UserProfile {
  const g = p.ageGroup as string;
  if (g === 'seniors') return { ...p, ageGroup: 'adults', largeText: true };
  if (!AGE_IDS.includes(g as AgeGroup)) return { ...p, ageGroup: 'adults' };
  return p;
}

export function downloadBackup(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pequenos-discipulos-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Junta um backup com o estado atual: perfis novos entram, perfis existentes
 * ficam com a versão de maior XP (útil para sincronizar dois aparelhos).
 */
export function mergeStates(current: AppState, incoming: AppState): AppState {
  const byId = new Map(current.profiles.map((p) => [p.id, p]));
  for (const p of incoming.profiles) {
    const existing = byId.get(p.id);
    if (!existing || p.xp > existing.xp) byId.set(p.id, p);
  }
  return { ...current, profiles: [...byId.values()] };
}
