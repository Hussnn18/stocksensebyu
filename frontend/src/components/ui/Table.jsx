import { cn } from '../../lib/utils';
import { Skeleton } from './Skeleton';

export function Table({ className, children }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)}>{children}</table>
    </div>
  );
}

export function Th({ align = 'left', className, children }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-slate-400',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ align = 'left', className, children, ...props }) {
  return (
    <td
      className={cn('border-b border-slate-100 px-5 py-3 whitespace-nowrap text-slate-700', align === 'right' && 'text-right tabular-nums', className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function Tr({ className, onClick, children }) {
  return (
    <tr className={cn('[&:last-child>td]:border-b-0', onClick && 'cursor-pointer transition-colors hover:bg-slate-50', className)} onClick={onClick}>
      {children}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-6 px-5 py-3.5">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn('h-3.5', c === 0 ? 'w-28' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}
