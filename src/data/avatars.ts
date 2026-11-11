/**
 * Avatares pré-definidos (recortados de `imagens/` por `scripts/crop-avatars.py`).
 * Ficam em `public/avatares/` e são salvos no perfil como `photo` (caminho relativo ao app).
 */
export interface PresetAvatar {
  id: string;
  name: string;
}

export interface AvatarCategory {
  id: 'santos' | 'magisterio';
  label: string;
  avatars: PresetAvatar[];
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    id: 'santos',
    label: 'Santos',
    avatars: [
      { id: 'nossa-senhora-aparecida', name: 'Nossa Sra. Aparecida' },
      { id: 'sao-jose', name: 'São José' },
      { id: 'santa-teresinha', name: 'Santa Teresinha' },
      { id: 'santo-antonio', name: 'Santo Antônio' },
      { id: 'sao-francisco', name: 'São Francisco' },
      { id: 'santa-rita', name: 'Santa Rita' },
      { id: 'sao-jorge', name: 'São Jorge' },
      { id: 'sao-pedro', name: 'São Pedro' },
      { id: 'santa-dulce', name: 'Santa Dulce' },
      { id: 'sao-carlo-acutis', name: 'São Carlo Acutis' },
      { id: 'sao-domingos-savio', name: 'São Domingos Sávio' },
      { id: 'sao-joao-bosco', name: 'São João Bosco' },
      { id: 'santa-ines', name: 'Santa Inês' },
      { id: 'sao-tarcisio', name: 'São Tarcísio' },
      { id: 'santa-maria-goretti', name: 'Santa Maria Goretti' },
      { id: 'santo-expedito', name: 'Santo Expedito' },
      { id: 'santa-clara', name: 'Santa Clara' },
      { id: 'sao-judas-tadeu', name: 'São Judas Tadeu' },
      { id: 'santa-joana-darc', name: "Santa Joana d'Arc" },
      { id: 'sao-padre-pio', name: 'São Padre Pio' },
    ],
  },
  {
    id: 'magisterio',
    label: 'Magistério e Ministérios',
    avatars: [
      { id: 'papa', name: 'Papa' },
      { id: 'bispo', name: 'Bispo' },
      { id: 'padre', name: 'Padre' },
      { id: 'diacono', name: 'Diácono' },
      { id: 'freira', name: 'Freira' },
      { id: 'monge', name: 'Monge' },
      { id: 'acolito', name: 'Acólito / Coroinha' },
      { id: 'catequista', name: 'Catequista' },
      { id: 'leitor', name: 'Leitor' },
      { id: 'ministro-eucaristia', name: 'Ministro da Eucaristia' },
    ],
  },
];

/** Caminho salvo em `photo` para um avatar pré-definido. */
export function avatarSrc(id: string): string {
  return `avatares/${id}.webp`;
}

/** Categoria do avatar pré-definido salvo em `photo` (ou null se for foto própria/sem foto). */
export function categoryOfPhoto(photo: string | null): AvatarCategory['id'] | null {
  if (!photo) return null;
  return AVATAR_CATEGORIES.find((c) => c.avatars.some((a) => avatarSrc(a.id) === photo))?.id ?? null;
}
