import { useEffect, useState } from 'react';
import { FamilyIcon, PathIcon, ProfileIcon } from './components/icons';
import { useStore } from './store/AppStore';
import { StatsBar } from './components/StatsBar';
import { Avatar } from './components/Avatar';
import { ProfilesPage } from './pages/ProfilesPage';
import { PathPage } from './pages/PathPage';
import { LessonPage } from './pages/LessonPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import type { UserProfile } from './types';

type Tab = 'path' | 'ranking' | 'profile';

// Tamanho base da fonte: como o Tailwind usa rem, a interface inteira escala.
const fontSize = (p: UserProfile) => (p.largeText ? '20px' : p.ageGroup === 'kids' ? '17px' : '16px');

const TABS: Array<{ id: Tab; label: string; icon: typeof PathIcon }> = [
  { id: 'path', label: 'Trilha', icon: PathIcon },
  { id: 'ranking', label: 'Família', icon: FamilyIcon },
  { id: 'profile', label: 'Perfil', icon: ProfileIcon },
];

export default function App() {
  const { active } = useStore();
  const [tab, setTab] = useState<Tab>('path');
  const [lesson, setLesson] = useState<{ levelId: string; practice: boolean; review?: boolean } | null>(null);

  // Faixa etária no <html>: o CSS ajusta a tipografia (Adulto usa fonte de leitura serifada).
  useEffect(() => {
    const html = document.documentElement;
    html.style.fontSize = active ? fontSize(active) : '';
    if (active) html.dataset.age = active.ageGroup;
    else delete html.dataset.age;
  }, [active?.ageGroup, active?.largeText]);

  // Ao trocar de perfil, volta para a trilha.
  useEffect(() => {
    setTab('path');
    setLesson(null);
  }, [active?.id]);

  // Cada tela nova começa do topo.
  useEffect(() => {
    window.scrollTo(0, 0);
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
        <StatsBar profile={active} />
      </header>

      <main className="flex-1 px-4 py-6">
        {tab === 'path' && (
          <PathPage
            onStart={(levelId, practice) => setLesson({ levelId, practice })}
            onReview={() => setLesson({ levelId: '', practice: false, review: true })}
          />
        )}
        {tab === 'ranking' && <LeaderboardPage />}
        {tab === 'profile' && <ProfilePage />}
      </main>

      <nav className="sticky bottom-0 grid grid-cols-3 border-t border-gold-200 bg-white/95 backdrop-blur">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex flex-col items-center gap-1 py-3 text-xs font-semibold ${
              tab === id ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600'
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
