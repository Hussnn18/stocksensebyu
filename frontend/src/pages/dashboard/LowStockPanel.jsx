import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, Skeleton } from '../../components/ui/Skeleton';
import { cn, formatQty } from '../../lib/utils';

const SHOWN = 5;

export function LowStockPanel({ alerts }) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="Low stock" description={alerts ? `${alerts.length} product${alerts.length === 1 ? '' : 's'} at or below the minimum` : 'Loading…'} />
      {!alerts ? (
        <div className="space-y-4 p-5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-xl" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Stock levels look healthy" className="flex-1">
          Every product is above its reorder level.
        </EmptyState>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100">
          {alerts.slice(0, SHOWN).map((a) => {
            const out = a.stock_state === 'out';
            const pct = a.min_qty ? Math.min(100, (a.on_hand / a.min_qty) * 100) : 0;
            return (
              <li key={a.product_id}>
                <Link to={`/products/${a.product_id}`} className="block px-5 py-3 transition-colors hover:bg-slate-50">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-bold text-slate-900">{a.name}</span>
                    <span className={cn('shrink-0 text-xs font-extrabold tabular-nums', out ? 'text-rose-600' : 'text-amber-700')}>
                      {out ? 'Out of stock' : `${formatQty(a.on_hand)} / ${formatQty(a.min_qty)} ${a.uom}`}
                    </span>
                  </div>
                  <div className={cn('mt-2 h-1 overflow-hidden rounded-full', out ? 'bg-rose-100' : 'bg-amber-100')}>
                    <div className={cn('h-full rounded-full', out ? 'bg-rose-500' : 'bg-amber-500')} style={{ width: `${out ? 0 : Math.max(pct, 3)}%` }} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-slate-100 p-2">
        <ButtonLink to="/products/reorder-rules" variant="ghost" size="sm" className="w-full">
          {alerts?.length > SHOWN ? `See all ${alerts.length} in reorder rules` : 'Manage reorder rules'}
        </ButtonLink>
      </div>
    </Card>
  );
}
