import { useState } from 'react';
import { Check } from 'lucide-react';
import type { UserProfile } from '../types';
import { AVATAR_CATEGORIES, avatarSrc, categoryOfPhoto, type AvatarCategory } from '../data/avatars';
import { Avatar } from './Avatar';
import { PhotoPicker } from './PhotoPicker';

/**
 * Foto do perfil no topo + botão de enviar foto própria; abaixo, avatares pré-definidos
 * em abas (Santos / Magistério e Ministérios). Escolher um avatar o salva como `photo`.
 */
export function AvatarChooser({
  profile,
  onChange,
}: {
  profile: Pick<UserProfile, 'avatar' | 'photo' | 'name'>;
  onChange: (photo: string | null) => void;
}) {
  const [tab, setTab] = useState<AvatarCategory['id']>(categoryOfPhoto(profile.photo) ?? 'santos');
  const category = AVATAR_CATEGORIES.find((c) => c.id === tab)!;

  return (
    <div>
      <div className="mb-5 flex flex-col items-center gap-3">
        <Avatar profile={profile} size="xl" className="ring-4 ring-brand-100" />
        <PhotoPicker photo={profile.photo} onChange={onChange} />
      </div>

      <p className="mb-2 text-center font-bold text-slate-600">Ou escolha um Avatar</p>
      <div role="tablist" className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
        {AVATAR_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={tab === c.id}
            onClick={() => setTab(c.id)}
            className={`rounded-xl px-2 py-2 text-sm font-bold transition ${
              tab === c.id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {c.label} ({c.avatars.length})
          </button>
        ))}
      </div>

      <div role="tabpanel" className="grid max-h-96 grid-cols-3 gap-x-2 gap-y-3 overflow-y-auto p-1 sm:grid-cols-5">
        {category.avatars.map((a) => {
          const src = avatarSrc(a.id);
          const selected = profile.photo === src;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(src)}
              aria-pressed={selected}
              className="group flex flex-col items-center gap-1 rounded-2xl p-1 text-center"
            >
              <span className="relative">
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className={`size-16 rounded-full transition sm:size-[4.5rem] ${
                    selected ? 'ring-4 ring-brand-500' : 'ring-2 ring-transparent group-hover:ring-brand-200'
                  }`}
                />
                {selected && (
                  <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className={`text-xs leading-tight ${selected ? 'font-bold text-brand-700' : 'text-slate-600'}`}>
                {a.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
