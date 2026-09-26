import { useState } from 'react';
import { saveReorderRuleFor } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';

/** Min / max editor for one product's reordering rule. */
export function ReorderRuleForm({ product }) {
  const toast = useToast();
  const [min, setMin] = useState(product.min_qty ?? '');
  const [max, setMax] = useState(product.max_qty ?? '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const changed = String(min) !== String(product.min_qty ?? '') || String(max) !== String(product.max_qty ?? '');

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveReorderRuleFor(product.product_id, { min_qty: min, max_qty: max });
      toast.success(min === '' ? `Reorder rule removed for ${product.name}` : `Reorder rule saved for ${product.name}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Minimum (${product.uom})`}>
          {(p) => <Input {...p} type="number" min="0" step="any" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder="—" />}
        </Field>
        <Field label={`Refill up to (${product.uom})`}>
          {(p) => <Input {...p} type="number" min="0" step="any" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} placeholder="—" />}
        </Field>
      </div>
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      <p className="text-xs text-slate-500">Leave the minimum empty to switch low-stock alerts off for this product.</p>
      <Button type="submit" variant="primary" size="sm" loading={saving} disabled={!changed}>
        Save rule
      </Button>
    </form>
  );
}
