import { Boxes } from 'lucide-react';
import { cn } from '../../lib/utils';

// Same mark as the landing page navbar.
export function Logo({ compact = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/20">
        <Boxes className="size-5" />
      </div>
      {!compact && (
        <span className="font-cursive text-2xl font-bold tracking-wide text-slate-900">
          Stock<span className="text-blue-600">Sense</span>
        </span>
      )}
    </div>
  );
}
