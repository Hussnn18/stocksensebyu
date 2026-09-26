import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-xs', className)} {...props} />;
}

export function CardHeader({ title, description, actions, className, children }) {
  return (
    <div className={cn('flex flex-wrap items-start gap-3 border-b border-slate-100 px-5 py-4', className)}>
      <div className="min-w-0 flex-1">
        {title && <h2 className="text-sm font-extrabold tracking-tight text-slate-900">{title}</h2>}
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      {children}
    </div>
  );
}

export function CardBody({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />;
}

/** Page title row: heading, one-line description and the page's main actions. */
export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold text-blue-600">{eyebrow}</div>}
        <h1 className="text-2xl font-black tracking-tight text-slate-900 text-balance">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
