import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge, StockBadge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, Skeleton } from '../../components/ui/Skeleton';
import { cn, formatQty } from '../../lib/utils';

export function LowStockPanel({ alerts }) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Low stock alerts"
        description="At or below the reorder minimum"
        actions={alerts?.length > 0 && <Badge className="bg-amber-50 text-amber-700">{alerts.length} to reorder</Badge>}
      />
      {!alerts ? (
        <div className="space-y-4 p-5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Stock levels look healthy" className="flex-1">
          Every product is above its reorder level.
        </EmptyState>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100">
          {alerts.map((a) => {
            const out = a.stock_state === 'out';
            const pct = a.min_qty ? Math.min(100, (a.on_hand / a.min_qty) * 100) : 0;
            return (
              <li key={a.product_id}>
                <Link to={`/products/${a.product_id}`} className="block px-5 py-3.5 transition-colors hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-900">{a.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{a.sku}</div>
                    </div>
                    <StockBadge state={a.stock_state} />
                  </div>
                  <div className={cn('mt-2.5 h-1.5 overflow-hidden rounded-full', out ? 'bg-rose-100' : 'bg-amber-100')}>
                    <div className={cn('h-full rounded-full', out ? 'bg-rose-500' : 'bg-amber-500')} style={{ width: `${Math.max(pct, out ? 0 : 3)}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs">
                    <span className="font-bold tabular-nums text-slate-800">
                      {formatQty(a.on_hand)} {a.uom} on hand
                    </span>
                    <span className="text-slate-500">
                      {a.min_qty !== null ? `min ${formatQty(a.min_qty)}` : 'no rule'}
                      {a.suggested_qty ? ` · order ${formatQty(a.suggested_qty)}` : ''}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-slate-100 p-2">
        <ButtonLink to="/products/reorder-rules" variant="ghost" size="sm" className="w-full">
          Manage reorder rules
        </ButtonLink>
      </div>
    </Card>
  );
}
