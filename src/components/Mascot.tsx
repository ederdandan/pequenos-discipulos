/**
 * Mascote guia: pomba estilizada (símbolo do Espírito Santo) com auréola dourada.
 * SVG puro, sem arquivos externos.
 */
export function Mascot({ size = 96, className = '', halo = true }: { size?: number; className?: string; halo?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Pomba, mascote do Pequenos Discípulos"
    >
      {halo && (
        <>
          <circle cx="60" cy="60" r="54" fill="#fef3c7" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
        </>
      )}
      <g stroke="#1e3a8a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* asa de trás */}
        <path d="M56 64 C44 46 40 30 46 18 C54 32 64 44 72 58 Z" fill="#dbeafe" />
        {/* cauda */}
        <path d="M30 70 L10 62 L15 72 L8 82 L32 76 Z" fill="#ffffff" />
        {/* corpo e cabeça */}
        <path
          d="M26 72 C40 80 64 80 80 72 C90 67 96 62 99 55 C101 49 97 42 90 42 C83 42 80 48 78 53 C72 60 56 62 26 72 Z"
          fill="#ffffff"
        />
        {/* asa da frente */}
        <path d="M50 66 C46 46 52 26 70 12 C68 26 72 32 84 30 C78 44 70 56 60 64 Z" fill="#ffffff" />
        <path d="M58 58 C58 44 62 34 70 26 M64 60 C66 48 70 42 78 38" fill="none" strokeWidth="1.8" stroke="#93c5fd" />
      </g>
      {/* bico e olho */}
      <path d="M98 48 L110 51 L98 55 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="91" cy="49" r="2.6" fill="#1e3a8a" />
      <circle cx="92" cy="48" r="0.9" fill="#ffffff" />
      {/* bochecha */}
      <circle cx="88" cy="56" r="3" fill="#fca5a5" opacity="0.6" />
    </svg>
  );
}
