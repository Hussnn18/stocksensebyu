import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, History, Pencil } from 'lucide-react';
import { getMoves, getProduct } from '../../api/inventory';
import { StockBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Skeleton';
import { Table, TableSkeleton, Td, Th, Tr } from '../../components/ui/Table';
import { useAsync } from '../../hooks/useAsync';
import { STOCK_META } from '../../lib/constants';
import { cn, formatDate, formatDateTime, formatQty } from '../../lib/utils';
import { MoveQuantity } from '../moves/MoveQuantity';
import { ProductFormDialog } from './ProductFormDialog';
import { ReorderRuleForm } from './ReorderRuleForm';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const product = useAsync(() => getProduct(id), [id]);
  const moves = useAsync(() => getMoves({ product_id: id }), [id]);
  const p = product.data;

  if (product.error) {
    return (
      <Card>
        <ErrorState error={product.error} />
        <div className="pb-8 text-center">
          <ButtonLink to="/products">Back to products</ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" />
        All products
      </Link>

      {!p ? (
        <div className="space-y-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{p.name}</h1>
              <StockBadge state={p.stock_state} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-mono text-slate-700">{p.sku}</span> · {p.category || 'Uncategorized'} · measured in {p.uom} · added {formatDate(p.created_at, true)}
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonLink to={`/moves?search=${encodeURIComponent(p.sku)}`} variant="outline">
              <History />
              Full history
            </ButtonLink>
            <Button variant="primary" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit product
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="On hand" value={p && `${formatQty(p.on_hand)} ${p.uom}`} tone={p?.stock_state} />
        <Stat label="Reorder minimum" value={p && (p.min_qty !== null ? `${formatQty(p.min_qty)} ${p.uom}` : 'Not set')} />
        <Stat label="Stored in" value={p && `${p.locations.length} location${p.locations.length === 1 ? '' : 's'}`} />
        <Stat
          label="Suggested order"
          value={p && (p.suggested_qty ? `${formatQty(p.suggested_qty)} ${p.uom}` : p.stock_state === 'ok' ? 'None needed' : 'Set a rule')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Stock by location" description="Current balance at each internal location" />
          {!p ? (
            <TableSkeleton rows={2} columns={3} />
          ) : p.locations.length === 0 ? (
            <EmptyState title="No stock anywhere">Validate a receipt to bring this product in.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Location</Th>
                  <Th>Warehouse</Th>
                  <Th>Share</Th>
                  <Th align="right">Quantity</Th>
                </tr>
              </thead>
              <tbody>
                {p.locations.map((l) => {
                  const share = p.on_hand ? (l.quantity / p.on_hand) * 100 : 0;
                  return (
                    <Tr key={l.location_id}>
                      <Td className="font-semibold text-slate-900">{l.location}</Td>
                      <Td className="text-slate-500">{l.warehouse}</Td>
                      <Td className="w-40">
                        <div className="h-1.5 overflow-hidden rounded-full bg-blue-100">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${share}%` }} />
                        </div>
                      </Td>
                      <Td align="right">
                        <span className="font-extrabold text-slate-900">{formatQty(l.quantity)}</span> <span className="text-xs text-slate-500">{p.uom}</span>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Reordering rule" description="Low stock alert fires at or below the minimum" />
          <div className="p-5">{p ? <ReorderRuleForm key={p.product_id} product={p} /> : <Skeleton className="h-24 w-full rounded-2xl" />}</div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent moves" description="Latest ledger entries for this product" />
        {!moves.data ? (
          <TableSkeleton rows={4} columns={4} />
        ) : moves.data.length === 0 ? (
          <EmptyState title="No moves yet">Stock moves appear here once documents are validated.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Reference</Th>
                <Th>From → To</Th>
                <Th align="right">Quantity</Th>
              </tr>
            </thead>
            <tbody>
              {moves.data.slice(0, 8).map((m) => (
                <Tr key={m.id}>
                  <Td className="text-slate-500">{formatDateTime(m.moved_at)}</Td>
                  <Td className="font-mono text-xs font-semibold text-slate-900">{m.reference}</Td>
                  <Td className="text-xs text-slate-600">
                    {m.from_location}
                    <span className="mx-1.5 text-slate-300">→</span>
                    {m.to_location}
                  </Td>
                  <Td align="right">
                    <MoveQuantity move={m} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {p && <ProductFormDialog open={editOpen} onClose={() => setEditOpen(false)} product={p} />}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const meta = tone && tone !== 'ok' ? STOCK_META[tone] : null;
  return (
    <Card className={cn('p-5', meta && (tone === 'out' ? 'border-rose-200' : 'border-amber-200'))}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      {value === undefined || value === null ? (
        <Skeleton className="mt-3 h-6 w-24" />
      ) : (
        <div className={cn('mt-1.5 text-xl font-black tracking-tight', meta ? (tone === 'out' ? 'text-rose-600' : 'text-amber-600') : 'text-slate-900')}>
          {value}
        </div>
      )}
    </Card>
  );
}
