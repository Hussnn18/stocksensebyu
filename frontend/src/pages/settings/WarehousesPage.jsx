import { useState } from 'react';
import { Archive, ArchiveRestore, Check, MapPin, Pencil, Plus, Warehouse, X } from 'lucide-react';
import { createLocation, createWarehouse, getLocations, getWarehouses, updateLocation, updateWarehouse } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Field, Input } from '../../components/ui/Field';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { isManager } from '../../lib/constants';
import { cn } from '../../lib/utils';

const VIRTUAL_HINT = {
  vendor: 'Source of every receipt',
  customer: 'Destination of every delivery',
  adjustment: 'Other side of adjustments and opening stock',
};

export default function WarehousesPage() {
  const { user } = useAuth();
  const canManage = isManager(user);
  const { data: warehouses } = useAsync(getWarehouses);
  const { data: locations } = useAsync(() => getLocations());
  const [editing, setEditing] = useState(null); // null | 'new' | warehouse
  const virtual = locations?.filter((l) => l.type !== 'internal');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        description="Your warehouses and the locations inside them. Stock is always held at a location."
        actions={
          canManage && (
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Plus />
              New warehouse
            </Button>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {!warehouses
          ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
          : warehouses.map((w) => <WarehouseCard key={w.id} warehouse={w} canManage={canManage} onEdit={() => setEditing(w)} />)}

        <Card className="h-fit">
          <CardHeader title="Virtual locations" description="System locations, so every stock change is a move between two places" />
          <ul className="divide-y divide-slate-100">
            {virtual?.map((l) => (
              <li key={l.id} className="px-5 py-2.5">
                <div className="font-mono text-xs text-slate-800">{l.name}</div>
                <div className="text-xs text-slate-500">{VIRTUAL_HINT[l.type]}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <WarehouseDialog warehouse={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function WarehouseCard({ warehouse: w, canManage, onEdit }) {
  const toast = useToast();
  const [name, setName] = useState(`${w.short_code}/`);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const add = async (event) => {
    event.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const created = await createLocation({ warehouse_id: w.id, name });
      toast.success(`${created.name} added`);
      setName(`${w.short_code}/`);
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Warehouse className="size-4 text-blue-600" />
            {w.name}
          </span>
        }
        description={w.address || 'No address'}
        actions={
          <>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{w.short_code}</span>
            {canManage && (
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${w.name}`} onClick={onEdit}>
                <Pencil />
              </Button>
            )}
          </>
        }
      />
      <ul className="divide-y divide-slate-100">
        {w.locations.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">No locations yet.</li>}
        {w.locations.map((l) => (
          <LocationRow key={l.id} location={l} canManage={canManage} />
        ))}
      </ul>
      {canManage && (
        <form onSubmit={add} noValidate className="border-t border-slate-100 p-3">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              aria-label={`New location in ${w.name}`}
              aria-invalid={error ? true : undefined}
              className="h-8 font-mono text-xs"
            />
            <Button type="submit" size="sm" loading={adding} disabled={name.trim().length <= w.short_code.length + 1}>
              <Plus />
              Add
            </Button>
          </div>
          {error && <p className="mt-1.5 px-1 text-xs font-medium text-rose-600">{error}</p>}
        </form>
      )}
    </Card>
  );
}

function LocationRow({ location: l, canManage }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(l.name);
  const [error, setError] = useState(null);

  const save = async (patch, message) => {
    setError(null);
    try {
      await updateLocation(l.id, patch);
      toast.success(message);
      setEditing(false);
    } catch (e) {
      if (editing) setError(e.message);
      else toast.error(e.message);
    }
  };

  if (editing) {
    return (
      <li className="px-3 py-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ name: value }, 'Location renamed');
          }}
          className="flex gap-2"
        >
          <Input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setEditing(false)} aria-label="Location name" className="h-8 font-mono text-xs" autoFocus />
          <Button type="submit" variant="primary" size="icon-sm" aria-label="Save">
            <Check />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setEditing(false)}>
            <X />
          </Button>
        </form>
        {error && <p className="mt-1 px-1 text-xs font-medium text-rose-600">{error}</p>}
      </li>
    );
  }

  return (
    <li className={cn('flex items-center gap-2 px-5 py-2', !l.is_active && 'opacity-60')}>
      <MapPin className="size-3.5 shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-800">{l.name}</span>
      <span className="text-xs text-slate-500">{l.is_active ? `${l.product_count} product${l.product_count === 1 ? '' : 's'}` : 'Archived'}</span>
      {canManage && (
        <span className="flex">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Rename ${l.name}`}
            onClick={() => {
              setValue(l.name);
              setEditing(true);
            }}
          >
            <Pencil />
          </Button>
          {l.is_active ? (
            <Button variant="ghost" size="icon-sm" aria-label={`Archive ${l.name}`} title="Archive" onClick={() => save({ is_active: false }, `${l.name} archived`)}>
              <Archive />
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" aria-label={`Restore ${l.name}`} title="Restore" onClick={() => save({ is_active: true }, `${l.name} restored`)}>
              <ArchiveRestore />
            </Button>
          )}
        </span>
      )}
    </li>
  );
}

function WarehouseDialog({ warehouse, onClose }) {
  const isNew = warehouse === 'new';
  return (
    <Dialog
      open={warehouse !== null}
      onClose={onClose}
      dismissible={false}
      title={isNew ? 'New warehouse' : `Edit ${warehouse?.name}`}
      description="The short code starts every location name, like WH3/Stock."
    >
      <WarehouseForm key={isNew ? 'new' : warehouse?.id} warehouse={isNew ? null : warehouse} onClose={onClose} />
    </Dialog>
  );
}

function WarehouseForm({ warehouse, onClose }) {
  const toast = useToast();
  const [values, setValues] = useState({ name: warehouse?.name || '', short_code: warehouse?.short_code || '', address: warehouse?.address || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = warehouse ? await updateWarehouse(warehouse.id, values) : await createWarehouse(values);
      toast.success(warehouse ? `${saved.name} saved` : `${saved.name} added. Add its locations next.`);
      onClose();
    } catch (e) {
      if (e.fields) setErrors(e.fields);
      else toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Name" error={errors.name}>
        {(p) => <Input {...p} value={values.name} onChange={set('name')} placeholder="e.g. Warehouse 3" data-autofocus />}
      </Field>
      <Field label="Short code" error={errors.short_code} hint="Up to 10 letters or numbers.">
        {(p) => <Input {...p} value={values.short_code} onChange={set('short_code')} placeholder="WH3" className="font-mono uppercase" />}
      </Field>
      <Field label="Address" optional>
        {(p) => <Input {...p} value={values.address} onChange={set('address')} placeholder="Street, city" />}
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          {warehouse ? 'Save changes' : 'Create warehouse'}
        </Button>
      </div>
    </form>
  );
}
