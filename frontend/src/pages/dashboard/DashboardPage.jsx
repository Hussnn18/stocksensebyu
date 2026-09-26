import { useSearchParams } from 'react-router-dom';
import { History, Plus, RotateCcw } from 'lucide-react';
import { getCategories, getDashboardKpis, getLowStock, getOperations, getWarehouses } from '../../api/inventory';
import { OperationsTable } from '../../components/app/OperationsTable';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card';
import { FilterLabel, Select } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { OPERATION_TYPES, STATUSES, STATUS_META } from '../../lib/constants';
import { displayName, greeting } from '../../lib/utils';
import { KpiCards } from './KpiCards';
import { LowStockPanel } from './LowStockPanel';
import { MovementChart } from './MovementChart';

const FILTER_KEYS = ['type', 'status', 'warehouse', 'category'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
  const hasFilters = FILTER_KEYS.some((k) => filters[k]);

  const kpis = useAsync(getDashboardKpis);
  const allOperations = useAsync(() => getOperations());
  const alerts = useAsync(getLowStock);
  const warehouses = useAsync(getWarehouses);
  const categories = useAsync(getCategories);
  const operations = useAsync(
    () => getOperations({ type: filters.type, status: filters.status, warehouse_id: filters.warehouse, category_id: filters.category }),
    [filters.type, filters.status, filters.warehouse, filters.category],
  );

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const firstName = displayName(user?.name).split(' ')[0];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={today}
        title={`${greeting()}, ${firstName || 'there'}`}
        description="Here is today’s snapshot of stock and operations across your warehouses."
        actions={
          <>
            <ButtonLink to="/moves" variant="outline">
              <History />
              Move history
            </ButtonLink>
            <ButtonLink to="/products?new=1" variant="primary">
              <Plus />
              Add product
            </ButtonLink>
          </>
        }
      />

      <KpiCards kpis={kpis.data} operations={allOperations.data} warehouseCount={warehouses.data?.length ?? 0} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <MovementChart />
        <LowStockPanel alerts={alerts.data} />
      </div>

      <Card>
        <CardHeader
          title="Operations"
          description={
            operations.data && allOperations.data
              ? `${operations.data.length} of ${allOperations.data.length} documents`
              : 'Receipts, deliveries, transfers and adjustments'
          }
          actions={
            hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => setParams({}, { replace: true })}>
                <RotateCcw />
                Clear filters
              </Button>
            )
          }
        />
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 md:grid-cols-4">
          <FilterLabel label="Document type">
            <Select value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
              <option value="">All types</option>
              {Object.entries(OPERATION_TYPES).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.plural}
                </option>
              ))}
            </Select>
          </FilterLabel>
          <FilterLabel label="Status">
            <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">All statuses</option>
              <option value="open">Open (not done)</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </FilterLabel>
          <FilterLabel label="Warehouse">
            <Select value={filters.warehouse} onChange={(e) => setFilter('warehouse', e.target.value)}>
              <option value="">All warehouses</option>
              {warehouses.data?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </FilterLabel>
          <FilterLabel label="Product category">
            <Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
              <option value="">All categories</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FilterLabel>
        </div>
        <OperationsTable rows={operations.data} loading={operations.loading} />
      </Card>
    </div>
  );
}
