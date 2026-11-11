import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppState, UserProfile } from '../types';
import { loadState, saveState } from './storage';
import { refreshProfile } from '../lib/rules';
import { ensureQuests } from '../lib/quests';

interface Store {
  state: AppState;
  active: UserProfile | null;
  setState: (fn: (s: AppState) => AppState) => void;
  addProfile: (p: UserProfile) => void;
  removeProfile: (id: string) => void;
  selectProfile: (id: string | null) => void;
  updateActive: (fn: (p: UserProfile) => UserProfile) => void;
}

const Ctx = createContext<Store | null>(null);

const refreshAll = (s: AppState): AppState => ({ ...s, profiles: s.profiles.map((p) => ensureQuests(refreshProfile(p))) });

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setRaw] = useState<AppState>(() => refreshAll(loadState()));

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Recarga de corações / reset semanal mesmo com o app aberto.
  useEffect(() => {
    const t = setInterval(() => setRaw((s) => refreshAll(s)), 30_000);
    return () => clearInterval(t);
  }, []);

  const setState = useCallback((fn: (s: AppState) => AppState) => setRaw(fn), []);

  const store = useMemo<Store>(() => {
    const active = state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
    return {
      state,
      active,
      setState,
      addProfile: (p) =>
        setRaw((s) => ({ ...s, profiles: [...s.profiles, ensureQuests(p)], activeProfileId: p.id })),
      removeProfile: (id) =>
        setRaw((s) => ({
          ...s,
          profiles: s.profiles.filter((p) => p.id !== id),
          activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
        })),
      selectProfile: (id) => setRaw((s) => refreshAll({ ...s, activeProfileId: id })),
      updateActive: (fn) =>
        setRaw((s) => ({
          ...s,
          // ensureQuests: se o dia virou com o app aberto, as missões já trocam na próxima ação.
          profiles: s.profiles.map((p) => (p.id === s.activeProfileId ? ensureQuests(fn(p)) : p)),
        })),
    };
  }, [state, setState]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore precisa estar dentro de <AppStoreProvider>');
  return s;
}
