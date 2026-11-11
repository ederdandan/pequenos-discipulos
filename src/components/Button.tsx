import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

const styles: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white border-brand-700 hover:bg-brand-500',
  secondary: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50',
  success: 'bg-gold-500 text-white border-gold-700 hover:bg-gold-400',
  danger: 'bg-pentecost text-white border-pentecost-dark hover:bg-red-500',
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
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-b-4 px-5 py-3 font-extrabold uppercase tracking-wide transition active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 disabled:active:border-b-4 ${styles[variant]} ${className}`}
    />
  );
}
