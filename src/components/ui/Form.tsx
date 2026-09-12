import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { classNames } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-zinc-300">{label}</label>}
      <input
        className={classNames(
          'w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-zinc-300">{label}</label>}
      <textarea
        className={classNames(
          'w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition resize-y min-h-[80px]',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-zinc-300">{label}</label>}
      <select
        className={classNames(
          'w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={classNames(
          'relative h-6 w-11 rounded-full transition',
          checked ? 'bg-amber-500' : 'bg-zinc-700'
        )}
      >
        <span
          className={classNames(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
