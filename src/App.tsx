import { useEffect, useRef, useState } from 'react';
import { useReveal } from './lib/reveal';
import { appearanceOf, useAppearance } from './lib/theme';
import { FamilyIcon, PathIcon, ProfileIcon } from './components/icons';
import { useStore } from './store/AppStore';
import { setVoicePrefs } from './lib/speech';
import { StatsBar } from './components/StatsBar';
import { HowItWorks } from './components/HowItWorks';
import { Avatar } from './components/Avatar';
import { ProfilesPage } from './pages/ProfilesPage';
import { PathPage } from './pages/PathPage';
import { LessonPage } from './pages/LessonPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage, type ProfileTab } from './pages/ProfilePage';
import type { UserProfile } from './types';
import { applyUpdate, useAppUpdate } from './lib/update';
import { RefreshCw } from 'lucide-react';

type Tab = 'path' | 'ranking' | 'profile';

// Tamanho base da fonte: como o Tailwind usa rem, a interface inteira escala.
const fontSize = (p: UserProfile) => (p.largeText ? '20px' : p.ageGroup === 'kids' ? '17px' : '16px');

const TABS: Array<{ id: Tab; label: string; icon: typeof PathIcon }> = [
  { id: 'path', label: 'Trilha', icon: PathIcon },
  { id: 'ranking', label: 'Família', icon: FamilyIcon },
  { id: 'profile', label: 'Perfil', icon: ProfileIcon },
];

export default function App() {
  const { active, updateActive } = useStore();
  // Tela de perfis (sem perfil ativo) usa a aparência padrão.
  useAppearance(appearanceOf(active));
  const [tab, setTab] = useState<Tab>('path');
  const [lesson, setLesson] = useState<{ levelId: string; practice: boolean; review?: boolean } | null>(null);
  const [help, setHelp] = useState(false);
  // Aba que o Perfil abre (o pedido de troca de nível leva direto aos Ajustes).
  const [profileTab, setProfileTab] = useState<ProfileTab>('progresso');
  // Versão nova do app: atualiza sozinho (se ligado), mas nunca no meio de uma lição.
  const update = useAppUpdate(!!lesson);
  // Conteúdo surge suavemente ao abrir a aba e ao rolar.
  const mainRef = useRef<HTMLElement>(null);
  useReveal(mainRef, [tab, active?.id, !!lesson]);

  // Faixa etária no <html>: o CSS ajusta a tipografia (Adulto usa fonte de leitura serifada).
  useEffect(() => {
    const html = document.documentElement;
    html.style.fontSize = active ? fontSize(active) : '';
    if (active) html.dataset.age = active.ageGroup;
    else delete html.dataset.age;
  }, [active?.ageGroup, active?.largeText]);

  // Tom e voz da leitura em voz alta seguem o perfil ativo.
  useEffect(() => setVoicePrefs(active?.voice), [active?.voice?.pitch, active?.voice?.name]);

  // Ao trocar de perfil, volta para a trilha.
  useEffect(() => {
    setTab('path');
    setLesson(null);
  }, [active?.id]);

  // Cada tela nova começa do topo.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab, lesson]);

  if (!active) return <ProfilesPage />;

  if (lesson) return <LessonPage {...lesson} onExit={() => setLesson(null)} />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-gold-100 bg-parchment/95 px-4 py-3 backdrop-blur">
        <span className="flex items-center gap-2 font-extrabold">
          <Avatar profile={active} size="sm" />
          <span className="hidden sm:inline">{active.name}</span>
        </span>
        <StatsBar profile={active} onHelp={() => setHelp(true)} />
      </header>

      {/* Primeira vez do perfil: boas-vindas explicando os números do topo. Perfis antigos veem uma vez. */}
      {(help || !active.introSeen) && (
        <HowItWorks
          profile={active}
          welcome={!active.introSeen}
          onClose={() => {
            setHelp(false);
            if (!active.introSeen) updateActive((p) => ({ ...p, introSeen: true }));
          }}
        />
      )}

      {update.available && (
        <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
          <span className="font-semibold text-brand-800">Há uma versão nova do app.</span>
          <button
            onClick={applyUpdate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 font-bold text-white hover:bg-brand-700"
          >
            <RefreshCw className="size-4" /> Atualizar
          </button>
        </div>
      )}

      <main ref={mainRef} className="flex-1 px-4 py-6">
        {tab === 'path' && (
          <PathPage
            onStart={(levelId, practice) => setLesson({ levelId, practice })}
            onReview={() => setLesson({ levelId: '', practice: false, review: true })}
            onChooseLevel={() => {
              setProfileTab('ajustes');
              setTab('profile');
              setTimeout(() => document.getElementById('nivel')?.scrollIntoView({ block: 'start' }), 80);
            }}
          />
        )}
        {tab === 'ranking' && <LeaderboardPage />}
        {tab === 'profile' && <ProfilePage key={profileTab} update={update} initialTab={profileTab} />}
      </main>

      <nav className="sticky bottom-0 grid grid-cols-3 border-t border-gold-200 bg-white/95 backdrop-blur">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setProfileTab('progresso');
              setTab(id);
            }}
            className={`relative flex flex-col items-center gap-1 py-3 text-xs font-semibold ${
              tab === id ? 'text-brand-700' : 'text-slate-500 hover:text-slate-600'
            }`}
          >
            {tab === id && <span className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-gold-500" />}
            <Icon size={24} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
