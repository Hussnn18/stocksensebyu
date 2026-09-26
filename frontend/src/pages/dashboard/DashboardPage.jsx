import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, RotateCcw, X } from 'lucide-react';
import { getCalendar, getCategories, getDashboardKpis, getLowStock, getOperations, getWarehouses } from '../../api/inventory';
import { ActivityCalendar } from '../../components/app/ActivityCalendar';
import { OperationsTable } from '../../components/app/OperationsTable';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card, PageHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { OPERATION_TYPES, STATUSES, STATUS_META, isManager } from '../../lib/constants';
import { displayName, greeting, toMonthKey } from '../../lib/utils';
import { KpiCards } from './KpiCards';
import { LowStockPanel } from './LowStockPanel';
import { MovementChart } from './MovementChart';

const FILTER_KEYS = ['type', 'status', 'place', 'category', 'date'];
const PAGE_SIZE = 7;

const longDate = (key) => new Date(`${key}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export default function DashboardPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
  const hasFilters = FILTER_KEYS.some((k) => f[k]);

  // "place" is one select for warehouse or location: "w:1" or "l:4".
  const [placeKind, placeId] = f.place.split(':');
  const query = {
    type: f.type,
    status: f.status,
    warehouse_id: placeKind === 'w' ? placeId : '',
    location_id: placeKind === 'l' ? placeId : '',
    category_id: f.category,
    date: f.date,
  };

  const [month, setMonth] = useState(() => {
    const base = f.date ? new Date(`${f.date}T00:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [page, setPage] = useState(0);

  const kpis = useAsync(getDashboardKpis);
  const allOperations = useAsync(() => getOperations());
  const alerts = useAsync(getLowStock);
  const warehouses = useAsync(getWarehouses);
  const categories = useAsync(getCategories);
  const calendar = useAsync(() => getCalendar(toMonthKey(month)), [toMonthKey(month)]);
  const operations = useAsync(() => getOperations(query), Object.values(query));
  const activity = useMemo(() => new Map((calendar.data || []).map((d) => [d.date, d])), [calendar.data]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(0);
  };

  const rows = operations.data;
  const pages = rows ? Math.max(1, Math.ceil(rows.length / PAGE_SIZE)) : 1;
  const current = Math.min(page, pages - 1);
  const pageRows = rows?.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const firstName = displayName(user?.name).split(' ')[0];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={today}
        title={`${greeting()}, ${firstName || 'there'}`}
        description="Today’s snapshot of stock and operations across your warehouses."
        actions={
          <>
            <ButtonLink to="/operations/new?type=receipt" variant="outline">
              <Plus />
              New receipt
            </ButtonLink>
            {isManager(user) && (
              <ButtonLink to="/products?new=1" variant="primary">
                <Plus />
                Add product
              </ButtonLink>
            )}
          </>
        }
      />

      <KpiCards kpis={kpis.data} operations={allOperations.data} />

      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[304px_minmax(0,1fr)]">
          <aside className="border-b border-slate-100 p-5 lg:border-r lg:border-b-0" aria-label="Calendar">
            <ActivityCalendar month={month} onMonthChange={setMonth} selected={f.date} onSelect={(key) => setFilter('date', key)} activity={activity} />
            <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              {f.date ? (
                <>
                  <b className="text-slate-900">{activity.get(f.date)?.scheduled || 0}</b> scheduled ·{' '}
                  <b className="text-slate-900">{activity.get(f.date)?.done || 0}</b> validated on this day
                </>
              ) : (
                'Pick a day to see every operation scheduled or validated on it.'
              )}
            </p>
          </aside>

          <section className="min-w-0" aria-label="Operations">
            <div className="flex flex-wrap items-center gap-2 px-5 pt-4 pb-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-extrabold tracking-tight text-slate-900">{f.date ? `Operations on ${longDate(f.date)}` : 'All operations'}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {rows ? `${rows.length} document${rows.length === 1 ? '' : 's'}` : 'Loading…'}
                  {hasFilters && allOperations.data ? ` of ${allOperations.data.length}` : ''}
                </p>
              </div>
              {f.date && (
                <Button variant="outline" size="sm" onClick={() => setFilter('date', '')}>
                  <X />
                  All dates
                </Button>
              )}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParams({}, { replace: true });
                    setPage(0);
                  }}
                >
                  <RotateCcw />
                  Clear filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 px-5 pb-4 xl:grid-cols-4">
              <Select value={f.type} onChange={(e) => setFilter('type', e.target.value)} aria-label="Document type">
                <option value="">All types</option>
                {Object.entries(OPERATION_TYPES).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.plural}
                  </option>
                ))}
              </Select>
              <Select value={f.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
                <option value="">All statuses</option>
                <option value="open">Open (not done)</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </Select>
              <Select value={f.place} onChange={(e) => setFilter('place', e.target.value)} aria-label="Warehouse or location">
                <option value="">All warehouses</option>
                {warehouses.data?.map((w) => (
                  <optgroup key={w.id} label={w.name}>
                    <option value={`w:${w.id}`}>All of {w.name}</option>
                    {w.locations
                      .filter((l) => l.is_active !== false)
                      .map((l) => (
                        <option key={l.id} value={`l:${l.id}`}>
                          {l.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </Select>
              <Select value={f.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Product category">
                <option value="">All categories</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="border-t border-slate-100">
              <OperationsTable
                rows={pageRows}
                loading={operations.loading}
                emptyText={f.date ? `Nothing was scheduled or validated on ${longDate(f.date)}.` : 'No operations match these filters.'}
              />
            </div>

            {rows && rows.length > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
                <span className="tabular-nums">
                  {current * PAGE_SIZE + 1}–{Math.min(rows.length, (current + 1) * PAGE_SIZE)} of {rows.length}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}>
                    <ChevronLeft />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <MovementChart />
        <LowStockPanel alerts={alerts.data} />
      </div>
    </div>
  );
}
