import { forwardRef, useId } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

const control =
  'h-9 w-full rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition-colors hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-[invalid=true]:border-rose-400';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, className)} {...props} />;
});

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(control, 'pl-4', className)} {...props}>
      {children}
    </select>
  );
}

/** Label + control + hint or inline error. `children` is a render function receiving the control's id. */
export function Field({ label, hint, error, className, children, optional }) {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-bold text-slate-700">
        {label}
        {optional && <span className="ml-1 font-medium text-slate-400">(optional)</span>}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error || hint ? messageId : undefined })}
      {(error || hint) && (
        <p id={messageId} className={cn('text-xs', error ? 'font-medium text-rose-600' : 'text-slate-500')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

/** Small uppercase-label wrapper used in filter bars. */
export function FilterLabel({ label, className, children }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function SearchInput({ className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
      <Input type="search" className="pl-10" {...props} />
    </div>
  );
}
