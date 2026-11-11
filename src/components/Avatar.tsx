import type { UserProfile } from '../types';

const SIZES = {
  sm: 'size-9 text-2xl',
  md: 'size-12 text-4xl',
  lg: 'size-16 text-5xl',
  xl: 'size-24 text-7xl',
};

/** Foto do perfil (se houver) ou o emoji escolhido. */
export function Avatar({
  profile,
  size = 'md',
  className = '',
}: {
  profile: Pick<UserProfile, 'avatar' | 'photo' | 'name'>;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (profile.photo) {
    return (
      <img
        src={profile.photo}
        alt={`Foto de ${profile.name}`}
        className={`${SIZES[size]} shrink-0 rounded-full border-2 border-white object-cover shadow ${className}`}
      />
    );
  }
  return (
    <span className={`${SIZES[size]} inline-flex shrink-0 items-center justify-center rounded-full leading-none ${className}`}>
      {profile.avatar}
    </span>
  );
}
