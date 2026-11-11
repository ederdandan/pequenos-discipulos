import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

// Botões planos, cantos suaves e texto normal (sem o visual "3D" de outros apps de jogos).
const styles: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white border-brand-700 hover:bg-brand-600 shadow-md shadow-brand-700/20',
  secondary: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm',
  success: 'bg-gold-600 text-white border-gold-600 hover:bg-gold-500 shadow-md shadow-gold-700/20',
  danger: 'bg-pentecost text-white border-pentecost hover:bg-red-500 shadow-md shadow-red-700/20',
  ghost: 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${styles[variant]} ${className}`}
    />
  );
}
