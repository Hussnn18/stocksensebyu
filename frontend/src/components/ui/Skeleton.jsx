import { cn } from '../../lib/utils';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-full bg-slate-100', className)} />;
}

export function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      {Icon && (
        <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="size-5" />
        </div>
      )}
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {children && <p className="max-w-sm text-sm text-slate-500">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="text-sm font-bold text-rose-700">Couldn’t load this data</p>
      <p className="text-sm text-slate-500">{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button className="mt-1 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
