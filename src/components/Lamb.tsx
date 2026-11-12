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

/**
 * `animated`: entra com um pulinho e repete o movimento da pose (telas em que aparece por inteiro).
 * `once`: só a entrada e um movimento (rodapé de correção).
 */
export function Lamb({
  pose,
  size = 96,
  className = '',
  animated = false,
  once = false,
}: {
  pose: LambPose;
  size?: number;
  className?: string;
  animated?: boolean;
  once?: boolean;
}) {
  const anim = animated || once ? `lamb-anim lamb-${pose} ${once ? 'lamb-once' : ''}` : '';
  return (
    <img
      src={lambSrc(pose)}
      alt={ALT[pose]}
      style={{ height: size }}
      className={`w-auto shrink-0 select-none object-contain ${anim} ${className}`}
      draggable={false}
    />
  );
}
