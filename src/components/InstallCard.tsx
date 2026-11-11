import { Download, Share, Smartphone } from 'lucide-react';
import { useInstall } from '../lib/pwa';

/** Convite para instalar o app na tela inicial do celular/computador. */
export function InstallCard({ compact = false }: { compact?: boolean }) {
  const { status, install } = useInstall();
  if (status === 'installed') {
    return compact ? null : (
      <section className="rounded-3xl border-2 border-gold-200 bg-gold-50 p-5 text-gold-800">
        <p className="font-extrabold">📱 App instalado</p>
        <p className="text-sm">Você está usando o Pequenos Discípulos como app. Ele funciona até sem internet.</p>
      </section>
    );
  }
  if (status === 'unavailable' && compact) return null;

  return (
    <section className={`rounded-3xl border-2 border-brand-500/30 bg-brand-50 ${compact ? 'p-4' : 'p-5'}`}>
      <p className="mb-1 flex items-center gap-2 font-extrabold text-brand-700">
        <Smartphone className="size-5" /> Instale o Pequenos Discípulos
      </p>
      <p className="mb-3 text-sm text-slate-600">
        Ganha um ícone na tela inicial, abre em tela cheia e funciona sem internet: ótimo para encontros e retiros.
      </p>
      {status === 'available' && (
        <button
          onClick={install}
          className="inline-flex items-center gap-2 rounded-2xl border shadow-sm border-brand-700 bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500"
        >
          <Download className="size-5" /> Instalar app
        </button>
      )}
      {status === 'ios' && (
        <p className="text-sm text-slate-700">
          No iPhone/iPad: toque em <Share className="inline size-4" /> <b>Compartilhar</b> no Safari e depois em{' '}
          <b>“Adicionar à Tela de Início”</b>.
        </p>
      )}
      {status === 'unavailable' && (
        <p className="text-sm text-slate-700">
          No Chrome ou Edge, use o menu <b>⋮</b> → <b>“Instalar app”</b> ou <b>“Adicionar à tela inicial”</b>.
        </p>
      )}
    </section>
  );
}
