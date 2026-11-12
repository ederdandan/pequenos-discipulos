import { useState } from 'react';
import { ChevronDown, Plus, Upload } from 'lucide-react';
import type { AgeGroup } from '../types';
import { useStore } from '../store/AppStore';
import { AGE_GROUPS, MAX_HEARTS, newProfile } from '../lib/rules';
import { HeartsPicker } from '../components/HeartsPicker';
import { Avatar } from '../components/Avatar';
import { AvatarChooser } from '../components/AvatarChooser';
import { InstallCard } from '../components/InstallCard';
import { Button } from '../components/Button';
import { ImportButton } from '../components/BackupControls';
import { Lamb } from '../components/Lamb';
import { LargeTextToggle } from '../components/LargeTextToggle';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { DIFFICULTY, type Difficulty } from '../lib/difficulty';

/** Emoji usado quando o perfil não tem foto nem avatar escolhido. */
const DEFAULT_AVATAR = '🐑';

/** Erros permitidos padrão: criança tem mais folga para não travar no meio da lição. */
const defaultHearts = (g: AgeGroup) => (g === 'kids' ? 10 : MAX_HEARTS);

export function ProfilesPage() {
  const { state, selectProfile } = useStore();
  const [creating, setCreating] = useState(state.profiles.length === 0);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center px-4 py-10">
      <Lamb pose="acolhimento" size={150} animated className="mb-2" />
      <h1 className="text-center text-3xl font-extrabold text-brand-700">Pequenos Discípulos</h1>
      <p className="mb-8 text-center text-slate-500">Catequese em família: cada um no seu ritmo, todos juntos.</p>

      {creating ? (
        <CreateProfile onDone={() => setCreating(false)} canCancel={state.profiles.length > 0} />
      ) : (
        <>
          <h2 className="mb-4 text-xl font-extrabold">Quem vai estudar agora?</h2>
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
            {state.profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProfile(p.id)}
                className="flex flex-col items-center gap-1 rounded-3xl border shadow-sm border-slate-200 bg-white p-5 transition hover:border-brand-500 hover:bg-brand-50"
              >
                <Avatar profile={p} size="lg" />
                <span className="text-lg font-extrabold">{p.name}</span>
                <span className="text-xs font-bold uppercase text-slate-500">
                  {AGE_GROUPS[p.ageGroup].label} · {p.xp} XP
                </span>
              </button>
            ))}
            <button
              onClick={() => setCreating(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 p-5 text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
            >
              <Plus className="size-10" />
              <span className="font-extrabold">Novo perfil</span>
            </button>
          </div>
        </>
      )}

      <div className="mt-8 w-full">
        <InstallCard compact />
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <Upload className="size-4" />
        Trocando de aparelho? <ImportButton className="font-bold text-brand-600 underline" />
      </div>
    </div>
  );
}

function CreateProfile({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const { addProfile } = useStore();
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('kids');
  const [largeText, setLargeText] = useState(false);
  // Sem escolha: padrão da faixa (criança erra mais sem travar a lição).
  const [hearts, setHearts] = useState<number | null>(null);
  const [more, setMore] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addProfile(newProfile(name, DEFAULT_AVATAR, ageGroup, hearts ?? defaultHearts(ageGroup), photo, largeText, difficulty));
    onDone();
  }

  return (
    <form onSubmit={submit} className="w-full space-y-6 rounded-3xl border-2 border-slate-200 bg-white p-6">
      <h2 className="text-xl font-extrabold">Criar perfil</h2>

      <label className="block">
        <span className="mb-1 block font-bold text-slate-600">Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="Ex.: Maria"
          autoFocus
          className="w-full rounded-2xl border-2 border-slate-200 p-3 text-lg outline-none focus:border-brand-500"
        />
      </label>


      <fieldset>
        <legend className="mb-2 font-bold text-slate-600">Faixa etária</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(AGE_GROUPS) as AgeGroup[]).map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setAgeGroup(g)}
              className={`rounded-2xl border shadow-sm p-3 text-left transition ${
                ageGroup === g ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl">{AGE_GROUPS[g].emoji}</span>
              <span className="block font-extrabold">{AGE_GROUPS[g].label}</span>
              <span className="block text-xs font-bold uppercase text-brand-600">{AGE_GROUPS[g].ages}</span>
              <span className="block text-sm text-slate-500">{AGE_GROUPS[g].hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* O essencial é nome e faixa; o resto já vem com um padrão bom e pode mudar depois em Perfil → Ajustes. */}
      <button
        type="button"
        onClick={() => setMore((m) => !m)}
        aria-expanded={more}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left"
      >
        <span>
          <span className="block font-bold text-slate-700">{more ? 'Menos opções' : 'Mais opções (opcional)'}</span>
          <span className="block text-sm text-slate-500">
            Foto, nível, erros permitidos e letra grande. Padrão: 🐑 · {DIFFICULTY[difficulty].label} ·{' '}
            {hearts ?? defaultHearts(ageGroup)} erros{largeText ? ' · letra grande' : ''}
          </span>
        </span>
        <ChevronDown className={`size-6 shrink-0 text-slate-500 transition ${more ? 'rotate-180' : ''}`} />
      </button>

      {more && (
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-2 font-bold text-slate-600">Foto ou avatar</legend>
            <AvatarChooser profile={{ avatar: DEFAULT_AVATAR, photo, name: name || 'perfil' }} onChange={setPhoto} />
          </fieldset>

          <fieldset>
            <legend className="mb-1 font-bold text-slate-600">Nível</legend>
            <p className="mb-2 text-sm text-slate-500">
              As perguntas são as da faixa; o nível muda o jeito de responder. Dá para mudar depois em Perfil → Ajustes.
            </p>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
          </fieldset>

          <fieldset>
            <legend className="mb-1 font-bold text-slate-600">Erros permitidos</legend>
            <p className="mb-2 text-sm text-slate-500">Dá para mudar depois em Perfil → Ajustes.</p>
            <HeartsPicker value={hearts ?? defaultHearts(ageGroup)} onChange={setHearts} />
          </fieldset>

          <LargeTextToggle value={largeText} onChange={setLargeText} />
        </div>
      )}

      <div className="flex gap-3">
        {canCancel && (
          <Button type="button" variant="secondary" onClick={onDone} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={!name.trim()} className="flex-1">
          Começar
        </Button>
      </div>
    </form>
  );
}
