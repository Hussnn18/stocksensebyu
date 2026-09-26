import { useState } from 'react';
import { createProduct, getCategories, getLocations, updateProduct } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Field, Input, Select } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { UNITS } from '../../lib/constants';

const EMPTY = { name: '', sku: '', category_id: '', uom: 'units', initial_qty: '', location_id: '', min_qty: '', max_qty: '' };

/** Create a product (with optional opening stock) or edit one. Pass `product` to edit. */
export function ProductFormDialog({ open, onClose, product, onSaved }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={false}
      title={product ? 'Edit product' : 'New product'}
      description={product ? `${product.sku} · changes apply right away` : 'Add a SKU to the catalog. Opening stock is optional.'}
      className="max-w-2xl"
    >
      <ProductForm product={product} onCancel={onClose} onSaved={onSaved} />
    </Dialog>
  );
}

function ProductForm({ product, onCancel, onSaved }) {
  const toast = useToast();
  const { data: categories } = useAsync(getCategories);
  const { data: locations } = useAsync(() => getLocations('internal'));
  const [values, setValues] = useState(() =>
    product
      ? {
          ...EMPTY,
          name: product.name,
          sku: product.sku,
          category_id: product.category_id ?? '',
          uom: product.uom,
          min_qty: product.min_qty ?? '',
          max_qty: product.max_qty ?? '',
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) => {
    setValues((v) => ({ ...v, [key]: event.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = product ? await updateProduct(product.product_id, values) : await createProduct(values);
      toast.success(product ? `${saved.name} updated` : `${saved.name} added to the catalog`);
      onSaved?.(saved);
      onCancel();
    } catch (error) {
      if (error.fields) setErrors(error.fields);
      else toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const units = UNITS.includes(values.uom) ? UNITS : [values.uom, ...UNITS];

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name" error={errors.name} className="sm:col-span-2">
          {(p) => <Input {...p} value={values.name} onChange={set('name')} placeholder="e.g. Steel Rods 12mm" data-autofocus />}
        </Field>
        <Field label="SKU / code" error={errors.sku} hint="Unique. Letters, numbers and dashes.">
          {(p) => (
            <Input
              {...p}
              value={values.sku}
              onChange={set('sku')}
              placeholder="STL-ROD-12"
              className="font-mono uppercase placeholder:normal-case"
              autoCapitalize="characters"
              spellCheck={false}
            />
          )}
        </Field>
        <Field label="Category" optional>
          {(p) => (
            <Select {...p} value={values.category_id} onChange={set('category_id')}>
              <option value="">Uncategorized</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Unit of measure" error={errors.uom}>
          {(p) => (
            <Select {...p} value={values.uom} onChange={set('uom')}>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </section>

      {!product && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-xs font-extrabold text-slate-900">Opening stock</h3>
          <p className="mt-0.5 text-xs text-slate-500">Written to the ledger as an “INITIAL” move.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label={`Quantity (${values.uom})`} error={errors.initial_qty} optional>
              {(p) => <Input {...p} type="number" min="0" step="any" inputMode="decimal" value={values.initial_qty} onChange={set('initial_qty')} placeholder="0" />}
            </Field>
            <Field label="Location" error={errors.location_id}>
              {(p) => (
                <Select {...p} value={values.location_id} onChange={set('location_id')} disabled={!Number(values.initial_qty)}>
                  <option value="">Choose a location</option>
                  {locations?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h3 className="text-xs font-extrabold text-slate-900">Reordering rule</h3>
        <p className="mt-0.5 text-xs text-slate-500">At or below the minimum, the product shows as low stock and raises an alert.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label={`Minimum (${values.uom})`} error={errors.min_qty} optional>
            {(p) => <Input {...p} type="number" min="0" step="any" inputMode="decimal" value={values.min_qty} onChange={set('min_qty')} placeholder="e.g. 50" />}
          </Field>
          <Field label={`Refill up to (${values.uom})`} error={errors.max_qty} optional>
            {(p) => <Input {...p} type="number" min="0" step="any" inputMode="decimal" value={values.max_qty} onChange={set('max_qty')} placeholder="e.g. 200" />}
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          {product ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
