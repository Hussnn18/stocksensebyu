import { cn } from '../../lib/utils';

/** Segmented filter: a row of pill buttons, one selected. items: [{ value, label, count? }] */
export function Tabs({ items, value, onChange, className, label }) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors cursor-pointer',
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn('tabular-nums', active ? 'text-blue-600' : 'text-slate-400')}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
