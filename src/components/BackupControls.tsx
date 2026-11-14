import { useRef } from 'react';
import { useStore } from '../store/AppStore';
import { trackEvent } from '../lib/analytics';
import { downloadBackup, mergeStates, parseState } from '../store/storage';

export function ExportButton({ className }: { className?: string }) {
  const { state } = useStore();
  return (
    <button onClick={() => downloadBackup(state)} className={className}>
      Exportar backup
    </button>
  );
}

/** Importa um backup JSON e junta com os perfis deste aparelho. */
export function ImportButton({ className }: { className?: string }) {
  const { setState } = useStore();
  const input = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const incoming = parseState(JSON.parse(await file.text()));
      setState((s) => mergeStates(s, incoming));
      trackEvent('backup/importado', 'Backup importado');
      alert(`Backup importado: ${incoming.profiles.length} perfil(is).`);
    } catch (err) {
      alert((err as Error).message || 'Não foi possível ler o arquivo.');
    }
  }

  return (
    <>
      <button onClick={() => input.current?.click()} className={className}>
        Importar backup
      </button>
      <input ref={input} type="file" accept="application/json,.json" onChange={onFile} hidden />
    </>
  );
}
