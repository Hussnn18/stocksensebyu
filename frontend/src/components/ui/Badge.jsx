import { OPERATION_TYPES, STATUS_META, STOCK_META } from '../../lib/constants';
import { cn } from '../../lib/utils';

export function Badge({ className, dot, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap', className)}>
      {dot && <span className={cn('size-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <Badge className={meta.className} dot={meta.dot}>
      {meta.label}
    </Badge>
  );
}

export function StockBadge({ state }) {
  const meta = STOCK_META[state] || STOCK_META.ok;
  return (
    <Badge className={meta.className} dot={meta.dot}>
      {meta.label}
    </Badge>
  );
}

export function TypeChip({ type, label }) {
  return (
    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">
      {label || OPERATION_TYPES[type]?.label || type}
    </span>
  );
}
