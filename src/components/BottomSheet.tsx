import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Painel que sobe de baixo para cima. Fecha no X, no fundo escurecido ou com Esc. */
export function BottomSheet({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button className="animate-fade absolute inset-0 bg-slate-900/40" onClick={onClose} aria-label="Fechar" />
      <div className="animate-slide-up relative max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-parchment px-5 pb-8 pt-3 text-slate-800 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-600" aria-label="Fechar">
            <X className="size-6" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
