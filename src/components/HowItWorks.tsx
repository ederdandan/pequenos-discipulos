import type { ReactNode } from 'react';
import type { UserProfile } from '../types';
import { HEART_REFILL_MS, dailyGoal, maxHearts } from '../lib/rules';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Lamb } from './Lamb';
import { CandleIcon, FlameIcon, GoalIcon, GraceIcon } from './icons';

/**
 * O que significa cada número do topo. Abre ao tocar neles e, sozinho, na primeira vez
 * que o perfil entra no app (`welcome`).
 */
export function HowItWorks({ profile, welcome, onClose }: { profile: UserProfile; welcome: boolean; onClose: () => void }) {
  const refillMin = Math.round(HEART_REFILL_MS / 60_000);
  return (
    <BottomSheet title={welcome ? `Bem-vindo, ${profile.name}!` : 'Como funciona'} onClose={onClose}>
      {welcome && (
        <div className="mb-4 flex items-center gap-3">
          <Lamb pose="acolhimento" size={90} animated />
          <p className="text-slate-600">
            Eu sou o Cordeirinho e vou caminhar com você! Cada lição tem perguntas curtas sobre a fé. Veja o que
            significam os números lá em cima:
          </p>
        </div>
      )}
      <ul className="space-y-3">
        <Item icon={<CandleIcon size={26} />} tone="bg-gold-50 text-gold-700" title="Velas acesas">
          Quantos dias seguidos você estudou. Faça uma lição por dia para manter a vela acesa.
        </Item>
        <Item icon={<GoalIcon size={26} />} tone="bg-brand-50 text-brand-700" title="Meta de hoje">
          Quanto você já fez hoje da sua meta ({dailyGoal(profile)} XP). Uma lição vale cerca de 20 XP.
        </Item>
        <Item icon={<GraceIcon size={26} />} tone="bg-gold-50 text-gold-700" title="Graça (XP)">
          Pontos que você ganha a cada lição. Aparecem no ranking da Família.
        </Item>
        <Item icon={<FlameIcon size={26} />} tone="bg-orange-50 text-fire" title="Chamas">
          Cada erro apaga uma chama (você tem {maxHearts(profile)}). Sem chamas, as lições novas esperam; elas voltam a
          acender sozinhas, 1 a cada {refillMin} minutos. Treinar uma lição já feita reacende 1 chama.
        </Item>
      </ul>
      <p className="mt-4 rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
        💡 Toque nesses números a qualquer momento para ver esta explicação de novo.
      </p>
      <Button onClick={onClose} className="mt-4 w-full">
        {welcome ? 'Vamos começar!' : 'Entendi'}
      </Button>
    </BottomSheet>
  );
}

function Item({ icon, tone, title, children }: { icon: ReactNode; tone: string; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tone}`}>{icon}</span>
      <span>
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-slate-600">{children}</span>
      </span>
    </li>
  );
}
