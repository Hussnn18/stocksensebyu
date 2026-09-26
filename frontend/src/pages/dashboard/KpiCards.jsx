import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowDownToLine, ArrowRightLeft, Package, Truck } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { OPEN_STATUSES } from '../../lib/constants';
import { cn, formatDate } from '../../lib/utils';

function pipeline(operations, type) {
  const open = operations.filter((o) => o.type === type && OPEN_STATUSES.includes(o.status));
  const ready = open.filter((o) => o.status === 'ready').length;
  const next = open.map((o) => o.scheduled_date).sort()[0];
  return next ? `${ready} ready · next ${formatDate(next)}` : 'Nothing scheduled';
}

export function KpiCards({ kpis, operations }) {
  if (!kpis || !operations) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-12" />
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  const alerts = kpis.low_stock + kpis.out_of_stock;
  const cards = [
    {
      to: '/products',
      label: 'Products in stock',
      value: kpis.products_in_stock,
      icon: Package,
      line: `of ${kpis.total_products} SKUs`,
    },
    {
      to: '/products?stock=alert',
      label: 'Low / out of stock',
      value: alerts,
      icon: AlertTriangle,
      warn: alerts > 0,
      line: `${kpis.low_stock} low · ${kpis.out_of_stock} out`,
    },
    { to: '/operations/receipts?status=open', label: 'Pending receipts', value: kpis.pending_receipts, icon: ArrowDownToLine, line: pipeline(operations, 'receipt') },
    { to: '/operations/deliveries?status=open', label: 'Pending deliveries', value: kpis.pending_deliveries, icon: Truck, line: pipeline(operations, 'delivery') },
    { to: '/operations/transfers?status=open', label: 'Transfers scheduled', value: kpis.transfers_scheduled, icon: ArrowRightLeft, line: pipeline(operations, 'internal') },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((card, i) => (
        <KpiCard key={card.label} {...card} className={i === 0 ? 'col-span-2 lg:col-span-1' : undefined} />
      ))}
    </div>
  );
}

function KpiCard({ to, label, value, icon: Icon, line, warn, className }) {
  return (
    <Link
      to={to}
      className={cn(
        'group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-colors hover:border-blue-300',
        warn && 'hover:border-amber-300',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs leading-snug font-semibold text-slate-500">{label}</span>
        <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', warn ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600')}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className={cn('mt-2 text-3xl font-black tracking-tight', warn ? 'text-amber-600' : 'text-slate-900')}>{value}</div>
      <div className="mt-1 truncate text-xs text-slate-500">{line}</div>
    </Link>
  );
}
