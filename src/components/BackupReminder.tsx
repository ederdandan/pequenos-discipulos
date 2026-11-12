import { useState } from 'react';
import { Save } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { BACKUP_EVERY_DAYS, downloadBackup, needsBackupReminder, snoozeBackupReminder } from '../store/storage';

/** Aviso na trilha: o progresso só existe neste aparelho; salve uma cópia de tempos em tempos. */
export function BackupReminder() {
  const { state } = useStore();
  const [hidden, setHidden] = useState(false);
  if (hidden || !needsBackupReminder(state)) return null;

  return (
    <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4 text-brand-800">
      <p className="flex items-center gap-2 font-extrabold">
        <Save className="size-5" /> Guarde uma cópia do progresso
      </p>
      <p className="mt-1 text-sm">
        O progresso da família fica só neste aparelho. Se os dados do navegador forem apagados ou você trocar de
        celular, ele se perde. Salve um arquivo de backup (leva um segundo) e guarde-o, por exemplo, no seu e-mail ou
        no Drive. Lembramos de novo a cada {BACKUP_EVERY_DAYS} dias.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => {
            downloadBackup(state);
            setHidden(true);
          }}
          className="rounded-xl bg-brand-600 px-4 py-2 font-bold text-white hover:bg-brand-700"
        >
          Salvar backup
        </button>
        <button
          onClick={() => {
            snoozeBackupReminder();
            setHidden(true);
          }}
          className="rounded-xl px-4 py-2 font-bold text-brand-700 hover:bg-brand-100"
        >
          Depois
        </button>
      </div>
    </div>
  );
}
