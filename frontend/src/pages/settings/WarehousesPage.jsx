import { MapPin, Warehouse } from 'lucide-react';
import { getLocations, getWarehouses } from '../../api/inventory';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAsync } from '../../hooks/useAsync';

const VIRTUAL_HINT = {
  vendor: 'Source of every receipt',
  customer: 'Destination of every delivery',
  adjustment: 'Other side of adjustments and opening stock',
};

export default function WarehousesPage() {
  const { data: warehouses } = useAsync(getWarehouses);
  const { data: locations } = useAsync(() => getLocations());
  const virtual = locations?.filter((l) => l.type !== 'internal');

  return (
    <div className="space-y-6">
      <PageHeader title="Warehouses" description="Your warehouses and the locations inside them. Stock is always held at a location." />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {!warehouses
          ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
          : warehouses.map((w) => (
              <Card key={w.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Warehouse className="size-4 text-blue-600" />
                      {w.name}
                    </span>
                  }
                  description={w.address}
                  actions={<span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{w.short_code}</span>}
                />
                <ul className="divide-y divide-slate-100">
                  {w.locations.map((l) => (
                    <li key={l.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                      <span className="flex items-center gap-2 font-mono text-xs text-slate-800">
                        <MapPin className="size-3.5 text-slate-400" />
                        {l.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {l.product_count} product{l.product_count === 1 ? '' : 's'}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}

        <Card>
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
    </div>
  );
}
