import { useEffect } from 'react';

/**
 * Cordeirinho, o companheiro das lições (a pomba continua sendo o mascote da marca).
 * Imagens em `public/cordeirinho/`, recortadas por `scripts/crop-lamb.py`.
 */
export type LambPose = 'acolhimento' | 'sucesso' | 'ops' | 'aprendendo' | 'descanso' | 'fe' | 'vamos';

const POSES: LambPose[] = ['acolhimento', 'sucesso', 'ops', 'aprendendo', 'descanso', 'fe', 'vamos'];

const ALT: Record<LambPose, string> = {
  acolhimento: 'Cordeirinho acenando',
  sucesso: 'Cordeirinho comemorando',
  ops: 'Cordeirinho coçando a cabeça',
  aprendendo: 'Cordeirinho lendo a Bíblia',
  descanso: 'Cordeirinho bocejando',
  fe: 'Cordeirinho rezando',
  vamos: 'Cordeirinho apontando para a frente',
};

export function lambSrc(pose: LambPose) {
  return `cordeirinho/${pose}.webp`;
}

/** Baixa todas as poses de antemão, para não piscarem na hora de aparecer. */
export function usePreloadLamb() {
  useEffect(() => {
    for (const p of POSES) new Image().src = lambSrc(p);
  }, []);
}

export function Lamb({ pose, size = 96, className = '' }: { pose: LambPose; size?: number; className?: string }) {
  return (
    <img
      src={lambSrc(pose)}
      alt={ALT[pose]}
      style={{ height: size }}
      className={`w-auto shrink-0 select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
