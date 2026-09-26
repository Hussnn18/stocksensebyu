import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, History, PackageCheck, Pencil, RefreshCw, ScanLine, X } from 'lucide-react';
import {
  cancelOperation,
  checkOperation,
  confirmOperation,
  getOperation,
  packOperation,
  pickOperation,
  validateOperation,
} from '../../api/inventory';
import { StatusBadge, TypeChip } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { ErrorState, Skeleton } from '../../components/ui/Skeleton';
import { Table, Td, Th, Tr } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { OPERATION_ROUTES, OPERATION_TYPES } from '../../lib/constants';
import { cn, displayName, formatDate, formatDateTime, formatQty } from '../../lib/utils';

function steps(o) {
  if (o.type === 'adjustment') return [{ key: 'done', label: 'Counted & applied', on: true }];
  const readyLabel = o.status === 'waiting' ? 'Waiting for stock' : 'Ready';
  const reached = { draft: 0, waiting: 1, ready: 1, done: 9, canceled: -1 }[o.status];
  const list = [
    { key: 'draft', label: 'Draft', on: reached >= 0 },
    { key: 'ready', label: readyLabel, on: reached >= 1, warn: o.status === 'waiting' },
  ];
  if (o.type === 'delivery') {
    list.push({ key: 'picked', label: 'Picked', on: Boolean(o.picked_at) || reached === 9 });
    list.push({ key: 'packed', label: 'Packed', on: Boolean(o.packed_at) || reached === 9 });
  }
  list.push({ key: 'done', label: 'Done', on: reached === 9 });
  return list;
}

function effectText(o, line) {
  if (o.type === 'receipt') return { text: `+${formatQty(line.quantity)} ${line.uom}`, tone: 'pos' };
  if (o.type === 'delivery') return { text: `−${formatQty(line.quantity)} ${line.uom}`, tone: 'neg' };
  return { text: `${formatQty(line.quantity)} ${line.uom} moved`, tone: 'neutral' };
}

export default function OperationDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const { data: o, error, reload } = useAsync(() => getOperation(id), [id]);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'validate' | 'cancel'

  if (error) {
    return (
      <Card>
        <ErrorState error={error} onRetry={reload} />
      </Card>
    );
  }
  if (!o) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  const meta = OPERATION_TYPES[o.type];
  const route = OPERATION_ROUTES[o.type];
  const open = ['draft', 'waiting', 'ready'].includes(o.status);
  const sourceInternal = o.lines.some((l) => l.available !== null);
  const shortLines = open && sourceInternal ? o.lines.filter((l) => l.available < l.quantity) : [];

  const run = async (key, action, message) => {
    setBusy(key);
    try {
      const updated = await action(o.id);
      toast.success(typeof message === 'function' ? message(updated) : message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const actions = [];
  if (open) actions.push(<Button key="cancel" variant="danger-ghost" onClick={() => setConfirm('cancel')} disabled={Boolean(busy)}><X />Cancel</Button>);
  if (o.status === 'draft') {
    actions.push(<ButtonLink key="edit" to={`/operations/${o.id}/edit`}><Pencil />Edit</ButtonLink>);
    actions.push(
      <Button
        key="confirm"
        variant={o.type === 'delivery' ? 'primary' : 'outline'}
        loading={busy === 'confirm'}
        onClick={() => run('confirm', confirmOperation, (u) => (u.status === 'ready' ? `${o.reference} is ready` : `${o.reference} is waiting for stock`))}
      >
        <Check />
        Mark as to do
      </Button>,
    );
  }
  if (sourceInternal && (o.status === 'waiting' || (o.status === 'ready' && !o.picked_at))) {
    actions.push(
      <Button
        key="check"
        variant={o.status === 'waiting' || shortLines.length ? 'primary' : 'outline'}
        loading={busy === 'check'}
        onClick={() => run('check', checkOperation, (u) => (u.status === 'ready' ? 'Stock is available. Ready to go.' : 'Still not enough stock at the source.'))}
      >
        <RefreshCw />
        Check availability
      </Button>,
    );
  }
  // Nothing to pick while the source is short.
  if (o.type === 'delivery' && o.status === 'ready' && !o.picked_at && !shortLines.length) {
    actions.push(<Button key="pick" variant="primary" loading={busy === 'pick'} onClick={() => run('pick', pickOperation, 'Items picked. Pack them next.')}><ScanLine />Pick items</Button>);
  }
  if (o.type === 'delivery' && o.status === 'ready' && o.picked_at && !o.packed_at) {
    actions.push(<Button key="pack" variant="primary" loading={busy === 'pack'} onClick={() => run('pack', packOperation, 'Packed. Validate to ship it.')}><PackageCheck />Pack items</Button>);
  }
  // Receipts can be validated straight from draft; deliveries must be picked and packed first.
  const canValidate = open && (o.type !== 'delivery' || Boolean(o.packed_at)) && !(sourceInternal && o.status === 'waiting');
  if (canValidate) {
    actions.push(<Button key="validate" variant="accent" loading={busy === 'validate'} onClick={() => setConfirm('validate')}><Check />Validate</Button>);
  }

  const effectSummary = o.lines
    .map((l) => {
      if (o.type === 'receipt') return `+${formatQty(l.quantity)} ${l.uom} ${l.name} into ${o.dest_location}`;
      if (o.type === 'delivery') return `−${formatQty(l.quantity)} ${l.uom} ${l.name} from ${o.source_location}`;
      return `${formatQty(l.quantity)} ${l.uom} ${l.name}`;
    })
    .join(', ');

  return (
    <div className="space-y-6">
      <Link to={meta.path} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" />
        {meta.plural}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-black tracking-tight text-slate-900">{o.reference}</h1>
            <TypeChip type={o.type} />
            <StatusBadge status={o.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {o.partner_name || 'Stock rebalancing'} · {o.source_location} → {o.dest_location}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      {o.status !== 'canceled' && (
        <ol className="flex flex-wrap items-center gap-2" aria-label="Progress">
          {steps(o).map((s, i, all) => (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold',
                  s.on ? (s.warn ? 'bg-amber-100 text-amber-800' : 'bg-slate-950 text-white') : 'border border-slate-200 bg-white text-slate-400',
                )}
              >
                {s.on && !s.warn && <Check className="size-3.5" />}
                {s.label}
              </span>
              {i < all.length - 1 && <span className={cn('h-px w-6', s.on ? 'bg-slate-400' : 'bg-slate-200')} />}
            </li>
          ))}
        </ol>
      )}

      {shortLines.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>
            Not enough stock at {o.source_location} for {shortLines.map((l) => `${l.name} (${formatQty(l.available)} of ${formatQty(l.quantity)} ${l.uom})`).join(', ')}.
            Validate is blocked until it arrives. Receive or transfer stock, then check availability.
          </p>
        </div>
      )}

      <Card>
        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Info label={o.type === 'adjustment' ? 'Reason' : route.partner} value={o.partner_name || '—'} />
          <Info label="From" value={o.source_location} />
          <Info label="To" value={o.dest_location} />
          <Info label="Scheduled" value={formatDate(o.scheduled_date, true)} />
          <Info label="Created by" value={o.created_by_name ? displayName(o.created_by_name) : '—'} />
          {o.type === 'delivery' && <Info label="Picked" value={o.picked_at ? formatDateTime(o.picked_at) : 'Not yet'} />}
          {o.type === 'delivery' && <Info label="Packed" value={o.packed_at ? formatDateTime(o.packed_at) : 'Not yet'} />}
          <Info
            label="Validated"
            value={o.validated_at ? `${formatDateTime(o.validated_at)}${o.validated_by_name ? ` · ${displayName(o.validated_by_name)}` : ''}` : 'Not yet'}
          />
          {o.notes && <Info label="Notes" value={o.notes} className="sm:col-span-2 lg:col-span-4" />}
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="Products"
          description={o.status === 'done' ? 'Stock was updated when this was validated.' : 'Stock changes only when the document is validated.'}
          actions={
            o.status === 'done' && (
              <ButtonLink to={`/moves?search=${encodeURIComponent(o.reference)}`} size="sm">
                <History />
                See ledger entries
              </ButtonLink>
            )
          }
        />
        {o.type === 'adjustment' ? (
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th align="right">Recorded</Th>
                <Th align="right">Counted</Th>
                <Th align="right">Difference</Th>
              </tr>
            </thead>
            <tbody>
              {o.lines.map((l) => {
                const diff = (l.counted_qty ?? l.quantity) - l.quantity;
                return (
                  <Tr key={l.id}>
                    <Td>
                      <ProductCell line={l} />
                    </Td>
                    <Td align="right">{formatQty(l.quantity)} {l.uom}</Td>
                    <Td align="right">{formatQty(l.counted_qty)} {l.uom}</Td>
                    <Td align="right" className={cn('font-extrabold', diff < 0 ? 'text-rose-600' : 'text-emerald-700')}>
                      {diff > 0 ? '+' : '−'}
                      {formatQty(Math.abs(diff))} {l.uom}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th align="right">Quantity</Th>
                {open && sourceInternal && <Th align="right">Available at {o.source_location}</Th>}
                <Th align="right">Stock effect</Th>
              </tr>
            </thead>
            <tbody>
              {o.lines.map((l) => {
                const effect = effectText(o, l);
                const short = open && l.available !== null && l.available < l.quantity;
                return (
                  <Tr key={l.id}>
                    <Td>
                      <ProductCell line={l} />
                    </Td>
                    <Td align="right" className="font-bold text-slate-900">
                      {formatQty(l.quantity)} <span className="text-xs font-normal text-slate-500">{l.uom}</span>
                    </Td>
                    {open && sourceInternal && (
                      <Td align="right" className={short ? 'font-bold text-amber-700' : 'text-slate-500'}>
                        {formatQty(l.available)} {l.uom}
                      </Td>
                    )}
                    <Td
                      align="right"
                      className={cn('font-extrabold', effect.tone === 'pos' ? 'text-emerald-700' : effect.tone === 'neg' ? 'text-rose-600' : 'text-slate-600')}
                    >
                      {effect.text}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={confirm === 'validate'}
        onClose={() => setConfirm(null)}
        title={`Validate ${o.reference}?`}
        body={`Stock updates right away and a ledger entry is written for each product: ${effectSummary}${o.type === 'internal' ? ` (${o.source_location} → ${o.dest_location})` : ''}.`}
        confirmLabel="Validate"
        onConfirm={async () => {
          try {
            await validateOperation(o.id);
            toast.success(`${o.reference} validated. Stock updated.`);
          } catch (e) {
            toast.error(e.message);
          }
        }}
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        title={`Cancel ${o.reference}?`}
        body="The document is closed and can’t be validated any more. Stock is not affected."
        confirmLabel="Cancel document"
        tone="danger"
        onConfirm={async () => {
          try {
            await cancelOperation(o.id);
            toast.success(`${o.reference} canceled`);
          } catch (e) {
            toast.error(e.message);
          }
        }}
      />
    </div>
  );
}

function Info({ label, value, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function ProductCell({ line }) {
  return (
    <>
      <Link to={`/products/${line.product_id}`} className="font-bold text-slate-900 hover:text-blue-600">
        {line.name}
      </Link>
      <div className="font-mono text-[11px] text-slate-400">{line.sku}</div>
    </>
  );
}
