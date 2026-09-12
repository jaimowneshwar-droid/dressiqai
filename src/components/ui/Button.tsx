import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20',
    secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',
    outline: 'border border-amber-500/40 text-amber-400 hover:bg-amber-500/10',
    ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <button
      className={classNames(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
