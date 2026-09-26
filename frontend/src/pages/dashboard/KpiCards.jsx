import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowDownToLine, ArrowRightLeft, ArrowUpRight, Package, Truck } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { OPEN_STATUSES } from '../../lib/constants';
import { cn, formatDate } from '../../lib/utils';

function nextDue(operations, type) {
  const open = operations.filter((o) => o.type === type && OPEN_STATUSES.includes(o.status));
  const ready = open.filter((o) => o.status === 'ready').length;
  const next = open.map((o) => o.scheduled_date).sort()[0];
  const first = open.find((o) => o.scheduled_date === next);
  return { ready, next, first };
}

export function KpiCards({ kpis, operations, warehouseCount }) {
  if (!kpis || !operations) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[158px] rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-8 w-14" />
            <Skeleton className="mt-6 h-3 w-36" />
          </div>
        ))}
      </div>
    );
  }

  const receipts = nextDue(operations, 'receipt');
  const deliveries = nextDue(operations, 'delivery');
  const transfers = nextDue(operations, 'internal');
  const alerts = kpis.low_stock + kpis.out_of_stock;
  const withoutStock = kpis.total_products - kpis.products_in_stock;

  const cards = [
    {
      to: '/products',
      label: 'Total products in stock',
      value: kpis.products_in_stock,
      icon: Package,
      badge: `of ${kpis.total_products} SKUs`,
      headline: withoutStock ? `${withoutStock} SKU${withoutStock === 1 ? '' : 's'} with no stock` : 'Every SKU has stock',
      detail: `Kept across ${warehouseCount} warehouse${warehouseCount === 1 ? '' : 's'}`,
    },
    {
      to: '/products?stock=alert',
      label: 'Low / out of stock',
      value: alerts,
      icon: AlertTriangle,
      warn: alerts > 0,
      badge: alerts ? 'Reorder' : 'All good',
      headline: `${kpis.low_stock} low · ${kpis.out_of_stock} out of stock`,
      detail: 'At or below reorder level',
    },
    {
      to: '/operations/receipts?status=open',
      label: 'Pending receipts',
      value: kpis.pending_receipts,
      icon: ArrowDownToLine,
      badge: `${receipts.ready} ready`,
      headline: receipts.next ? `Next arrival ${formatDate(receipts.next)}` : 'Nothing expected',
      detail: receipts.first?.partner_name ? `From ${receipts.first.partner_name}` : 'Incoming goods from vendors',
    },
    {
      to: '/operations/deliveries?status=open',
      label: 'Pending deliveries',
      value: kpis.pending_deliveries,
      icon: Truck,
      badge: `${deliveries.ready} ready`,
      headline: deliveries.next ? `Next dispatch ${formatDate(deliveries.next)}` : 'Nothing to ship',
      detail: deliveries.first?.partner_name ? `To ${deliveries.first.partner_name}` : 'Outgoing goods to customers',
    },
    {
      to: '/operations/transfers?status=open',
      label: 'Transfers scheduled',
      value: kpis.transfers_scheduled,
      icon: ArrowRightLeft,
      badge: `${transfers.ready} ready`,
      headline: transfers.next ? `Next move ${formatDate(transfers.next)}` : 'No moves planned',
      detail: transfers.first ? `${transfers.first.source_location} → ${transfers.first.dest_location}` : 'Between racks and warehouses',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function KpiCard({ to, label, value, icon: Icon, badge, headline, detail, warn }) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex flex-col rounded-2xl border bg-gradient-to-t to-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md',
        warn ? 'border-amber-200 from-amber-50/70 hover:border-amber-300' : 'border-slate-200 from-blue-50/50 hover:border-blue-300',
      )}
    >
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-3xl leading-none font-black tracking-tight text-slate-900">{value}</span>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold',
            warn ? 'border-amber-200 bg-white text-amber-700' : 'border-slate-200 bg-white text-slate-600',
          )}
        >
          <Icon className={cn('size-3', warn ? 'text-amber-600' : 'text-blue-600')} />
          {badge}
        </span>
      </div>
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
          <span className="truncate">{headline}</span>
          <ArrowUpRight className="size-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-500">{detail}</div>
      </div>
    </Link>
  );
}
