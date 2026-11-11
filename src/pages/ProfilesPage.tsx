import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import type { AgeGroup } from '../types';
import { useStore } from '../store/AppStore';
import { AGE_GROUPS, MAX_HEARTS, newProfile } from '../lib/rules';
import { HeartsPicker } from '../components/HeartsPicker';
import { Avatar } from '../components/Avatar';
import { PhotoPicker } from '../components/PhotoPicker';
import { InstallCard } from '../components/InstallCard';
import { Button } from '../components/Button';
import { ImportButton } from '../components/BackupControls';
import { Mascot } from '../components/Mascot';
import { LargeTextToggle } from '../components/LargeTextToggle';

const AVATARS = ['🕊️', '😇', '🐑', '🦁', '🐟', '🌻', '⭐', '🐶', '👵', '👴', '👩', '👨', '👧', '👦', '🧒', '🧑‍🦳'];

export function ProfilesPage() {
  const { state, selectProfile } = useStore();
  const [creating, setCreating] = useState(state.profiles.length === 0);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center px-4 py-10">
      <Mascot size={112} className="animate-float mb-2" />
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
                <span className="text-xs font-bold uppercase text-slate-400">
                  {AGE_GROUPS[p.ageGroup].label} · {p.xp} XP
                </span>
              </button>
            ))}
            <button
              onClick={() => setCreating(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 p-5 text-slate-400 transition hover:border-brand-500 hover:text-brand-600"
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

      <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
        <Upload className="size-4" />
        Trocando de aparelho? <ImportButton className="font-bold text-brand-600 underline" />
      </div>
    </div>
  );
}

function CreateProfile({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const { addProfile } = useStore();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('kids');
  const [largeText, setLargeText] = useState(false);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [photo, setPhoto] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addProfile(newProfile(name, avatar, ageGroup, hearts, photo, largeText));
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
        <legend className="mb-2 font-bold text-slate-600">Foto ou avatar</legend>
        <div className="mb-3 flex items-center gap-4">
          <Avatar profile={{ avatar, photo, name: name || 'perfil' }} size="lg" />
          <PhotoPicker photo={photo} onChange={setPhoto} />
        </div>
        <p className="mb-2 text-sm text-slate-500">
          {photo ? 'A foto aparece no lugar do avatar (inclusive no ranking).' : 'Sem foto? Escolha um avatar:'}
        </p>
        <div className={`grid grid-cols-8 gap-2 ${photo ? 'opacity-40' : ''}`}>
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              className={`aspect-square rounded-xl text-2xl transition sm:text-3xl ${
                avatar === a ? 'bg-brand-100 ring-2 ring-brand-500' : 'hover:bg-slate-100'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </fieldset>

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

      <fieldset>
        <legend className="mb-1 font-bold text-slate-600">Erros permitidos</legend>
        <p className="mb-2 text-sm text-slate-500">Dá para mudar depois na tela de Perfil.</p>
        <HeartsPicker value={hearts} onChange={setHearts} />
      </fieldset>

      <LargeTextToggle value={largeText} onChange={setLargeText} />

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
