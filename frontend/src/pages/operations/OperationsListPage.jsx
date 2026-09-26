import { useSearchParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { getOperations } from '../../api/inventory';
import { OperationsTable } from '../../components/app/OperationsTable';
import { Card, PageHeader } from '../../components/ui/Card';
import { SearchInput } from '../../components/ui/Field';
import { Tabs } from '../../components/ui/Tabs';
import { useAsync } from '../../hooks/useAsync';
import { OPEN_STATUSES, OPERATION_TYPES, STATUSES, STATUS_META } from '../../lib/constants';

const DESCRIPTIONS = {
  receipt: 'Goods arriving from vendors. Validating a receipt adds its quantities to stock.',
  delivery: 'Goods leaving for customers. Pick, pack, then validate to take the quantities out of stock.',
  internal: 'Stock moving between racks, floors and warehouses. The total stays the same.',
  adjustment: 'Physical counts that fix differences between recorded and counted stock.',
};

/**
 * Read-only list of one operation type with status tabs. The create / validate / cancel
 * screens come from the operations module and plug in here.
 */
export default function OperationsListPage({ type }) {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const search = params.get('search') || '';
  const all = useAsync(() => getOperations({ type }), [type]);
  const filtered = all.data?.filter(
    (o) =>
      (!status || (status === 'open' ? OPEN_STATUSES.includes(o.status) : o.status === status)) &&
      (!search || [o.reference, o.partner_name, ...o.products].some((v) => v?.toLowerCase().includes(search.toLowerCase()))),
  );

  const count = (s) => all.data?.filter((o) => (s === 'open' ? OPEN_STATUSES.includes(o.status) : o.status === s)).length;
  const tabs = [
    { value: '', label: 'All', count: all.data?.length },
    { value: 'open', label: 'Open', count: count('open') },
    ...STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label, count: count(s) })),
  ];

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={OPERATION_TYPES[type].plural} description={DESCRIPTIONS[type]} />

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <p>This list is read-only for now. Creating, validating and canceling documents is being built in the operations module.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
          <Tabs label="Status" items={tabs} value={status} onChange={(v) => setParam('status', v)} />
          <SearchInput value={search} onChange={(e) => setParam('search', e.target.value)} placeholder="Reference, partner or product" className="ml-auto w-full sm:w-72" />
        </div>
        <OperationsTable rows={filtered} loading={all.loading} showType={false} emptyText="No documents in this view." />
      </Card>
    </div>
  );
}
