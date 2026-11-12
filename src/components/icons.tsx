// Ícones próprios do Pequenos Discípulos (SVG inline, herdam a cor do texto via currentColor).
import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

/** Vela acesa: dias seguidos. */
export function CandleIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 2.5c1.6 1.9 2.3 3.3 2.3 4.5a2.3 2.3 0 0 1-4.6 0c0-1.2.7-2.6 2.3-4.5Z" fill="#F59E0B" />
      <path d="M12 5.2c.6.8.9 1.4.9 1.9a.9.9 0 0 1-1.8 0c0-.5.3-1.1.9-1.9Z" fill="#FEF3C7" />
      <rect x="9" y="10" width="6" height="11" rx="1.5" fill="currentColor" />
      <path d="M7 21h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Chama do Espírito Santo: vidas. */
export function FlameIcon(p: P) {
  return (
    <Svg {...p}>
      <path
        d="M12 2c3.5 3.6 6 6.9 6 10.6A6 6 0 0 1 6 12.6c0-2 .8-3.7 2.2-5.4.2 1.6.9 2.7 2 3.2C10 7.6 10.6 4.8 12 2Z"
        fill="currentColor"
      />
      <path d="M12 12c1.6 1.6 2.6 3 2.6 4.4a2.6 2.6 0 0 1-5.2 0c0-1.4 1-2.8 2.6-4.4Z" fill="#FED7AA" />
    </Svg>
  );
}

/** Estrela de quatro pontas: XP (graças acumuladas). */
export function GraceIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z" fill="currentColor" />
    </Svg>
  );
}

/** Meta do dia: alvo em forma de medalha. */
export function GoalIcon(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="13" r="3.5" fill="currentColor" />
      <path d="M9 2h6l-1.5 3h-3Z" fill="currentColor" />
    </Svg>
  );
}

/** Caminho (trilha): passos subindo para uma cruz. */
export function PathIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 2v7M9 4.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 21c0-4 3-5 7-6s7-2 7-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
    </Svg>
  );
}

/** Família: três pessoas. */
export function FamilyIcon(p: P) {
  return (
    <Svg {...p}>
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M2.5 20c0-3.5 2-5.5 4.5-5.5M21.5 20c0-3.5-2-5.5-4.5-5.5M8.5 21c0-2.8 1.5-4.5 3.5-4.5s3.5 1.7 3.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Pessoa com auréola: perfil. */
export function ProfileIcon(p: P) {
  return (
    <Svg {...p}>
      <ellipse cx="12" cy="3.5" rx="4" ry="1.3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 21c0-4.2 3.4-7 7.5-7s7.5 2.8 7.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Escudo medieval: forma dos níveis na trilha (especificação, seção 4.2).
 * `fill` e `stroke` são as cores do escudo; o conteúdo vai por cima, centralizado.
 */
export function Shield({
  size = 64,
  fill,
  stroke,
  children,
}: {
  size?: number;
  fill: string;
  stroke: string;
  children?: ReactNode;
}) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size * 1.12 }}>
      <svg viewBox="0 0 64 72" width={size} height={size * 1.12} className="absolute inset-0" aria-hidden="true">
        {/* style (e não atributo) para aceitar var(--color-…) do tema. */}
        <path d="M32 3 58 12v20c0 17-11 29-26 37C17 61 6 49 6 32V12Z" style={{ fill, stroke }} strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 9 52 16v16c0 13.5-8.5 23.5-20 30-11.5-6.5-20-16.5-20-30V16Z" fill="none" stroke="#FCD34D" strokeOpacity="0.7" strokeWidth="1.5" />
      </svg>
      <span className="relative -mt-1 flex items-center justify-center">{children}</span>
    </span>
  );
}

/**
 * Progresso da lição como as contas de um terço: uma conta por pergunta.
 */
export function RosaryProgress({ done, total }: { done: number; total: number }) {
  const n = Math.max(total, 1);
  return (
    <div className="flex flex-1 items-center" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={done}>
      <span className="mr-1 text-gold-600" aria-hidden="true">
        ✝
      </span>
      <div className="relative flex flex-1 items-center justify-between">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-gold-200" />
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            className={`relative size-3.5 rounded-full border-2 transition-all duration-300 sm:size-4 ${
              i < done ? 'scale-110 border-gold-600 bg-gold-500' : 'border-gold-300 bg-parchment'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
