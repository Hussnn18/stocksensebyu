import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { createOperation, getLocations, getOperation, getProducts, updateOperation } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { ErrorState, Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { OPERATION_ROUTES, OPERATION_TYPES } from '../../lib/constants';
import { cn, formatQty, toDateKey } from '../../lib/utils';

let lineKey = 0;
const emptyLine = () => ({ key: ++lineKey, product_id: '', quantity: '' });

/** Create (/operations/new?type=receipt) or edit a draft (/operations/:id/edit). */
export default function OperationFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const editing = Boolean(id);
  const existing = useAsync(() => (editing ? getOperation(id) : Promise.resolve(null)), [id]);
  const type = editing ? existing.data?.type : params.get('type');

  if (!editing && !OPERATION_ROUTES[type]) return <Navigate to="/operations/receipts" replace />;
  if (existing.error) return <ErrorState error={existing.error} />;
  if (editing && !existing.data) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (editing && existing.data.status !== 'draft') return <Navigate to={`/operations/${id}`} replace />;

  return <OperationForm key={id || type} type={type} operation={existing.data} />;
}

function OperationForm({ type, operation }) {
  const navigate = useNavigate();
  const toast = useToast();
  const route = OPERATION_ROUTES[type];
  const meta = OPERATION_TYPES[type];
  const { data: locations } = useAsync(() => getLocations());
  const { data: products } = useAsync(() => getProducts());

  const [values, setValues] = useState(() => ({
    partner_name: operation?.partner_name || '',
    source_location_id: operation?.source_location_id ?? '',
    dest_location_id: operation?.dest_location_id ?? '',
    scheduled_date: operation?.scheduled_date || toDateKey(new Date()),
    notes: operation?.notes || '',
  }));
  const [lines, setLines] = useState(() =>
    operation?.lines?.length ? operation.lines.map((l) => ({ key: ++lineKey, product_id: l.product_id, quantity: l.quantity })) : [emptyLine()],
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const internal = locations?.filter((l) => l.type === 'internal') || [];
  const fixedSource = route.source !== 'internal' ? locations?.find((l) => l.type === route.source) : null;
  const fixedDest = route.dest !== 'internal' ? locations?.find((l) => l.type === route.dest) : null;

  const productById = useMemo(() => new Map((products || []).map((p) => [p.product_id, p])), [products]);
  const sourceIsInternal = route.source === 'internal';
  const availableAt = (productId) => {
    const product = productById.get(Number(productId));
    return product?.locations.find((l) => l.location_id === Number(values.source_location_id))?.quantity || 0;
  };

  const set = (key) => (event) => {
    setValues((v) => ({ ...v, [key]: event.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const setLine = (key, patch) => {
    setLines((list) => list.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setErrors((e) => ({ ...e, lines: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const body = {
      type,
      ...values,
      // Vendor / Customer are fixed for receipts and deliveries.
      source_location_id: fixedSource?.id ?? (Number(values.source_location_id) || null),
      dest_location_id: fixedDest?.id ?? (Number(values.dest_location_id) || null),
      lines: lines.filter((l) => l.product_id || l.quantity !== '').map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) })),
    };
    try {
      const saved = operation ? await updateOperation(operation.id, body) : await createOperation(body);
      toast.success(operation ? `${saved.reference} saved` : `${saved.reference} created as a draft`);
      navigate(`/operations/${saved.id}`);
    } catch (error) {
      if (error.fields) setErrors(error.fields);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const title = operation ? `Edit ${operation.reference}` : `New ${meta.label.toLowerCase()}${type === 'internal' ? ' transfer' : ''}`;
  const backTo = operation ? `/operations/${operation.id}` : meta.path;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" />
        {operation ? operation.reference : meta.plural}
      </Link>
      <PageHeader
        title={title}
        description={
          type === 'receipt'
            ? 'Goods arriving from a supplier. Stock goes up when you validate.'
            : type === 'delivery'
              ? 'Goods going to a customer. Pick, pack, then validate to take them out of stock.'
              : 'Move stock between locations. The total stays the same.'
        }
      />

      <Card>
        <CardHeader title="Details" />
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={route.partner} error={errors.partner_name} optional={type === 'internal'} className="lg:col-span-2">
            {(p) => (
              <Input
                {...p}
                value={values.partner_name}
                onChange={set('partner_name')}
                placeholder={type === 'receipt' ? 'e.g. Tata Steel Ltd' : type === 'delivery' ? 'e.g. Sharma Furnishings' : 'e.g. Restock production floor'}
                autoFocus
              />
            )}
          </Field>
          <Field label="Scheduled date" error={errors.scheduled_date}>
            {(p) => <Input {...p} type="date" value={values.scheduled_date} onChange={set('scheduled_date')} />}
          </Field>
          <div className="hidden lg:block" />
          <LocationField label={route.sourceLabel} fixed={fixedSource} options={internal} value={values.source_location_id} onChange={set('source_location_id')} error={errors.source_location_id} />
          <LocationField
            label={route.destLabel}
            fixed={fixedDest}
            options={internal.filter((l) => type !== 'internal' || l.id !== Number(values.source_location_id))}
            value={values.dest_location_id}
            onChange={set('dest_location_id')}
            error={errors.dest_location_id}
          />
          <Field label="Notes" optional className="sm:col-span-2">
            {(p) => <Input {...p} value={values.notes} onChange={set('notes')} placeholder="Anything the team should know" />}
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Products"
          description={sourceIsInternal ? 'Available shows what is at the source location right now.' : 'Quantities you expect to receive.'}
          actions={
            <Button size="sm" onClick={() => setLines((list) => [...list, emptyLine()])}>
              <Plus />
              Add product
            </Button>
          }
        />
        <div className="divide-y divide-slate-100">
          {lines.map((line, index) => {
            const product = productById.get(Number(line.product_id));
            const qty = Number(line.quantity);
            const available = sourceIsInternal && product && values.source_location_id ? availableAt(line.product_id) : null;
            const short = available !== null && qty > available;
            return (
              <div key={line.key} className="grid items-start gap-3 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_160px_150px_auto]">
                <Select
                  value={line.product_id}
                  onChange={(e) => setLine(line.key, { product_id: e.target.value })}
                  aria-label={`Product on line ${index + 1}`}
                  aria-invalid={errors.lines && !line.product_id ? true : undefined}
                >
                  <option value="">Choose a product…</option>
                  {products?.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.sku} · {p.name}
                    </option>
                  ))}
                </Select>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={line.quantity}
                    onChange={(e) => setLine(line.key, { quantity: e.target.value })}
                    placeholder="Qty"
                    aria-label={`Quantity on line ${index + 1}`}
                    aria-invalid={(errors.lines && !(qty > 0)) || short ? true : undefined}
                    className="pr-14"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-slate-400">{product?.uom}</span>
                </div>
                <div className={cn('flex h-9 items-center text-xs', short ? 'font-bold text-amber-700' : 'text-slate-500')}>
                  {available === null ? (
                    ''
                  ) : short ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="size-3.5" />
                      Only {formatQty(available)} {product.uom} there
                    </span>
                  ) : (
                    `${formatQty(available)} ${product.uom} available`
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove line ${index + 1}`}
                  disabled={lines.length === 1}
                  onClick={() => setLines((list) => list.filter((l) => l.key !== line.key))}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </div>
        {errors.lines && <p className="px-5 pb-4 text-xs font-medium text-rose-600">{errors.lines}</p>}
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={() => navigate(backTo)} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          {operation ? 'Save changes' : 'Save as draft'}
        </Button>
      </div>
    </form>
  );
}

function LocationField({ label, fixed, options, value, onChange, error }) {
  return (
    <Field label={label} error={error}>
      {(p) =>
        fixed ? (
          <Input {...p} value={fixed.name} readOnly disabled />
        ) : (
          <Select {...p} value={value} onChange={onChange}>
            <option value="">Choose a location</option>
            {options.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        )
      }
    </Field>
  );
}
