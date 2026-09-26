import { Link, useSearchParams } from 'react-router-dom';
import { Download, History, RotateCcw } from 'lucide-react';
import { getLocations, getMoves } from '../../api/inventory';
import { TypeChip } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader } from '../../components/ui/Card';
import { FilterLabel, Input, SearchInput, Select } from '../../components/ui/Field';
import { EmptyState, ErrorState } from '../../components/ui/Skeleton';
import { Table, TableSkeleton, Td, Th, Tr } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { MOVE_TYPES } from '../../lib/constants';
import { displayName, formatDateTime, toDateKey } from '../../lib/utils';
import { MoveQuantity } from './MoveQuantity';

const KEYS = ['search', 'type', 'location', 'from', 'to'];

function toCsv(rows) {
  const header = ['Date', 'Reference', 'Type', 'SKU', 'Product', 'From', 'To', 'Quantity', 'Stock effect', 'Unit', 'User'];
  const cell = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = rows.map((m) =>
    [m.moved_at, m.reference, MOVE_TYPES[m.operation_type], m.sku, m.product, m.from_location, m.to_location, m.quantity, m.stock_effect, m.uom, m.user_name]
      .map(cell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export default function MoveHistoryPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(KEYS.map((k) => [k, params.get(k) || '']));
  const { data: locations } = useAsync(() => getLocations());
  const moves = useAsync(
    () => getMoves({ search: f.search, type: f.type, location_id: f.location, from: f.from, to: f.to }),
    [f.search, f.type, f.location, f.from, f.to],
  );
  const hasFilters = KEYS.some((k) => f[k]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(moves.data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-ledger-${toDateKey(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${moves.data.length} ledger rows`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Move History"
        description="The stock ledger. Every validated document writes one row per product, and rows are never edited."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!moves.data?.length}>
            <Download />
            Export CSV
          </Button>
        }
      />

      <Card>
        <div className="grid gap-3 border-b border-slate-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <FilterLabel label="Search">
            <SearchInput value={f.search} onChange={(e) => setParam('search', e.target.value)} placeholder="Reference, SKU or product" />
          </FilterLabel>
          <FilterLabel label="Type">
            <Select value={f.type} onChange={(e) => setParam('type', e.target.value)}>
              <option value="">All types</option>
              {Object.entries(MOVE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FilterLabel>
          <FilterLabel label="Location">
            <Select value={f.location} onChange={(e) => setParam('location', e.target.value)}>
              <option value="">All locations</option>
              {locations?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </FilterLabel>
          <FilterLabel label="From">
            <Input type="date" value={f.from} max={f.to || undefined} onChange={(e) => setParam('from', e.target.value)} />
          </FilterLabel>
          <FilterLabel label="To">
            <Input type="date" value={f.to} min={f.from || undefined} onChange={(e) => setParam('to', e.target.value)} />
          </FilterLabel>
          {hasFilters && (
            <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>
              <RotateCcw />
              Clear
            </Button>
          )}
        </div>

        {moves.error ? (
          <ErrorState error={moves.error} onRetry={moves.reload} />
        ) : !moves.data ? (
          <TableSkeleton rows={8} columns={6} />
        ) : moves.data.length === 0 ? (
          <EmptyState icon={History} title="No moves match these filters">
            Try a wider date range or clear the filters.
          </EmptyState>
        ) : (
          <div className={moves.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Reference</Th>
                  <Th>Product</Th>
                  <Th>From → To</Th>
                  <Th align="right">Quantity</Th>
                  <Th>By</Th>
                </tr>
              </thead>
              <tbody>
                {moves.data.map((m) => (
                  <Tr key={m.id}>
                    <Td className="text-slate-500 tabular-nums">{formatDateTime(m.moved_at)}</Td>
                    <Td>
                      <div className="font-mono text-xs font-semibold text-slate-900">{m.reference}</div>
                      <div className="mt-0.5">
                        <TypeChip label={MOVE_TYPES[m.operation_type]} />
                      </div>
                    </Td>
                    <Td>
                      <Link to={`/products/${m.product_id}`} className="font-bold text-slate-900 hover:text-blue-600">
                        {m.product}
                      </Link>
                      <div className="font-mono text-[11px] text-slate-400">{m.sku}</div>
                    </Td>
                    <Td className="text-xs text-slate-600">
                      {m.from_location}
                      <span className="mx-1.5 text-slate-300">→</span>
                      {m.to_location}
                    </Td>
                    <Td align="right">
                      <MoveQuantity move={m} />
                    </Td>
                    <Td className="text-slate-500">{m.user_name ? displayName(m.user_name) : '—'}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              {moves.data.length} {moves.data.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
