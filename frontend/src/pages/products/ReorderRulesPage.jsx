import { useState } from 'react';
import { Link } from 'react-router-dom';
import { saveReorderRuleFor, getReorderRules } from '../../api/inventory';
import { StockBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/Skeleton';
import { Table, TableSkeleton, Td, Th, Tr } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { formatQty } from '../../lib/utils';

const VIEWS = [
  { value: 'all', label: 'All products', test: () => true },
  { value: 'reorder', label: 'Needs reorder', test: (r) => r.stock_state !== 'ok' },
  { value: 'none', label: 'No rule', test: (r) => r.min_qty === null },
];

export default function ReorderRulesPage() {
  const { data } = useAsync(getReorderRules);
  const [view, setView] = useState('all');
  const rows = data?.filter(VIEWS.find((v) => v.value === view).test);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reorder Rules"
        description="Set a minimum per product. At or below it the product shows as low stock, raises an alert, and gets a suggested order to refill it to the maximum."
      />
      <Card>
        <div className="border-b border-slate-100 px-5 py-3">
          <Tabs label="Show" items={VIEWS.map((v) => ({ ...v, count: data?.filter(v.test).length }))} value={view} onChange={setView} />
        </div>
        {!rows ? (
          <TableSkeleton rows={6} columns={6} />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing to show">Every product in this view is covered.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th align="right">On hand</Th>
                <Th>Minimum</Th>
                <Th>Refill up to</Th>
                <Th align="right">Suggested order</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Save</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <RuleRow key={`${r.product_id}-${r.min_qty}-${r.max_qty}`} row={r} />
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function RuleRow({ row }) {
  const toast = useToast();
  const [min, setMin] = useState(row.min_qty ?? '');
  const [max, setMax] = useState(row.max_qty ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const changed = String(min) !== String(row.min_qty ?? '') || String(max) !== String(row.max_qty ?? '');

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveReorderRuleFor(row.product_id, { min_qty: min, max_qty: max });
      toast.success(`Rule saved for ${row.name}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && changed) save();
  };

  return (
    <Tr>
      <Td>
        <Link to={`/products/${row.product_id}`} className="font-bold text-slate-900 hover:text-blue-600">
          {row.name}
        </Link>
        <div className="font-mono text-[11px] text-slate-400">{row.sku}</div>
      </Td>
      <Td align="right">
        <span className="font-extrabold text-slate-900">{formatQty(row.on_hand)}</span> <span className="text-xs text-slate-500">{row.uom}</span>
      </Td>
      <Td className="py-2">
        <Input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="—"
          aria-label={`Minimum for ${row.name}`}
          aria-invalid={error ? true : undefined}
          className="h-8 w-28"
        />
      </Td>
      <Td className="py-2">
        <Input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="—"
          aria-label={`Refill level for ${row.name}`}
          className="h-8 w-28"
        />
        {error && <div className="mt-1 text-xs font-medium whitespace-normal text-rose-600">{error}</div>}
      </Td>
      <Td align="right">
        {row.suggested_qty ? (
          <span className="font-bold text-slate-900">
            {formatQty(row.suggested_qty)} <span className="text-xs font-normal text-slate-500">{row.uom}</span>
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </Td>
      <Td>
        <StockBadge state={row.stock_state} />
      </Td>
      <Td align="right">
        <Button size="sm" variant={changed ? 'primary' : 'outline'} disabled={!changed} loading={saving} onClick={save}>
          Save
        </Button>
      </Td>
    </Tr>
  );
}
