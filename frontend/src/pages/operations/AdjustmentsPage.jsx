import { useState } from 'react';
import { createAdjustment, getLocations, getOperations, getProducts } from '../../api/inventory';
import { OperationsTable } from '../../components/app/OperationsTable';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { Field, Input, Select } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { cn, formatQty } from '../../lib/utils';

const EMPTY = { location_id: '', product_id: '', counted_qty: '', reason: '' };

export default function AdjustmentsPage() {
  const toast = useToast();
  const { data: locations } = useAsync(() => getLocations('internal'));
  const { data: products } = useAsync(() => getProducts());
  const history = useAsync(() => getOperations({ type: 'adjustment' }));
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  const product = products?.find((p) => p.product_id === Number(values.product_id));
  const recorded = product && values.location_id ? product.locations.find((l) => l.location_id === Number(values.location_id))?.quantity || 0 : null;
  const counted = values.counted_qty === '' ? null : Number(values.counted_qty);
  const diff = recorded !== null && counted !== null && !Number.isNaN(counted) ? counted - recorded : null;
  const locationName = locations?.find((l) => l.id === Number(values.location_id))?.name;

  const set = (key) => (event) => {
    setValues((v) => ({ ...v, [key]: event.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const review = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.location_id) next.location_id = 'Choose the location you counted.';
    if (!values.product_id) next.product_id = 'Choose the product you counted.';
    if (counted === null || Number.isNaN(counted) || counted < 0) next.counted_qty = 'Enter the counted quantity (0 or more).';
    else if (diff === 0) next.counted_qty = 'Same as the recorded quantity. Nothing to adjust.';
    setErrors(next);
    if (!Object.keys(next).length) setConfirming(true);
  };

  const apply = async () => {
    try {
      const saved = await createAdjustment({ ...values, location_id: Number(values.location_id), product_id: Number(values.product_id), counted_qty: counted });
      toast.success(`${saved.reference} applied. ${product.name} at ${locationName} is now ${formatQty(counted)} ${product.uom}.`);
      setValues((v) => ({ ...EMPTY, location_id: v.location_id }));
    } catch (error) {
      if (error.fields) setErrors(error.fields);
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Adjustment"
        description="Fix differences between recorded stock and a physical count. Applying writes the difference to the ledger straight away."
      />

      <Card>
        <CardHeader title="Count stock" description="Select a location and product, then enter what you counted." />
        <form onSubmit={review} noValidate className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_140px_140px]">
          <Field label="Location" error={errors.location_id}>
            {(p) => (
              <Select {...p} value={values.location_id} onChange={set('location_id')}>
                <option value="">Choose a location</option>
                {locations?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Product" error={errors.product_id}>
            {(p) => (
              <Select {...p} value={values.product_id} onChange={set('product_id')}>
                <option value="">Choose a product</option>
                {products?.map((pr) => (
                  <option key={pr.product_id} value={pr.product_id}>
                    {pr.sku} · {pr.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Reason" optional>
            {(p) => <Input {...p} value={values.reason} onChange={set('reason')} placeholder="e.g. 3 kg damaged" />}
          </Field>
          <Field label={`Counted${product ? ` (${product.uom})` : ''}`} error={errors.counted_qty}>
            {(p) => <Input {...p} type="number" min="0" step="any" inputMode="decimal" value={values.counted_qty} onChange={set('counted_qty')} placeholder="0" />}
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="primary" className="w-full">
              Apply
            </Button>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm md:col-span-2 xl:col-span-5">
            <span className="text-slate-500">
              Recorded: <b className="text-slate-900 tabular-nums">{recorded === null ? '—' : `${formatQty(recorded)} ${product.uom}`}</b>
            </span>
            <span className="text-slate-500">
              Difference:{' '}
              <b className={cn('tabular-nums', diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-600' : 'text-slate-900')}>
                {diff === null ? '—' : `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${formatQty(Math.abs(diff))} ${product.uom}`}
              </b>
            </span>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Past adjustments" description="Every applied count, newest first" />
        <OperationsTable rows={history.data} loading={history.loading} showType={false} emptyText="No adjustments yet." />
      </Card>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Apply this adjustment?"
        body={
          product && diff !== null
            ? `${product.name} at ${locationName} changes from ${formatQty(recorded)} to ${formatQty(counted)} ${product.uom} (${diff > 0 ? '+' : '−'}${formatQty(Math.abs(diff))}). A ledger entry is written.`
            : ''
        }
        confirmLabel="Apply adjustment"
        onConfirm={apply}
      />
    </div>
  );
}
