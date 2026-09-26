import { useCallback, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, PanelLeft } from 'lucide-react';
import { findPage } from './navigation';
import { Button, ButtonLink } from '../ui/Button';
import { SearchInput } from '../ui/Field';
import { StockBadge } from '../ui/Badge';
import { useDismiss } from '../../hooks/useDismiss';
import { cn, formatQty } from '../../lib/utils';

export function Topbar({ onToggleSidebar, alerts }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const page = findPage(pathname);

  const handleSearch = (event) => {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get('q').trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <PanelLeft />
      </Button>
      <div className="h-5 w-px bg-slate-200" />

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-slate-400 sm:inline">{page.section}</span>
        <ChevronRight className="hidden size-3.5 shrink-0 text-slate-300 sm:block" />
        {page.detail ? (
          <>
            <Link to={page.to} className="truncate text-slate-500 hover:text-slate-900">
              {page.title}
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-slate-300" />
            <span className="truncate font-bold text-slate-900">{page.detail}</span>
          </>
        ) : (
          <span className="truncate font-bold text-slate-900">{page.title}</span>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <form role="search" onSubmit={handleSearch} className="hidden md:block">
          <SearchInput key={pathname} name="q" placeholder="Search SKU or product…" aria-label="Search SKU or product" className="w-64 xl:w-80" />
        </form>
        <LowStockBell alerts={alerts} />
      </div>
    </header>
  );
}

function LowStockBell({ alerts = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);
  const count = alerts.length;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={count ? `Low stock alerts, ${count} products` : 'Low stock alerts'}
        className="relative"
      >
        <Bell />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white tabular-nums">
            {count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute top-11 right-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-extrabold text-slate-900">Low stock alerts</span>
            <span className="text-xs text-slate-500">{count ? `${count} need attention` : 'All good'}</span>
          </div>
          {count === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Every product is above its reorder level.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.product_id}>
                  <Link to={`/products/${a.product_id}`} onClick={close} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-slate-900">{a.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{a.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn('text-sm font-extrabold tabular-nums', a.stock_state === 'out' ? 'text-rose-600' : 'text-amber-600')}>
                        {formatQty(a.on_hand)} {a.uom}
                      </div>
                      <StockBadge state={a.stock_state} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 p-2">
            <ButtonLink to="/products/reorder-rules" variant="ghost" size="sm" className="w-full" onClick={close}>
              Open reorder rules
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
