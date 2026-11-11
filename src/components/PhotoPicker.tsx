import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { photoToDataUrl } from '../lib/image';

/** Botões para escolher/tirar uma foto (no celular abre a câmera ou a galeria) ou removê-la. */
export function PhotoPicker({ photo, onChange }: { photo: string | null; onChange: (p: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setError(null);
      onChange(await photoToDataUrl(file));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded-2xl border shadow-sm border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
        >
          <Camera className="size-5" /> {photo ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-sm font-bold text-rose-500 hover:text-rose-600"
          >
            <Trash2 className="size-4" /> Remover foto
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <input ref={input} type="file" accept="image/*" onChange={onFile} hidden />
    </div>
  );
}
