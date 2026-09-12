import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-amber-500 ${className ?? ''}`} />;
}

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
      {label && <p className="text-zinc-500 text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-zinc-700">{icon}</div>
      <p className="text-lg font-semibold text-zinc-400">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>}
    </div>
  );
}
