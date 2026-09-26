import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Pill buttons, same shapes as the landing page: dark primary, blue accent, white outline.
const VARIANTS = {
  primary: 'bg-slate-950 text-white hover:bg-slate-800 shadow-sm',
  accent: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20',
  outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  'danger-ghost': 'text-rose-600 hover:bg-rose-50',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  icon: 'h-9 w-9',
  'icon-sm': 'h-8 w-8',
};

export function buttonClasses({ variant = 'outline', size = 'md', className } = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({ variant, size, className, loading = false, disabled, children, type = 'button', ...props }) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, ...props }) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
