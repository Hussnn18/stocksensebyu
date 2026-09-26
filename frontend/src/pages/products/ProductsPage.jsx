import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PackageSearch, Pencil, Plus, RotateCcw, Tags } from 'lucide-react';
import { getCategories, getProducts } from '../../api/inventory';
import { StockBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card, PageHeader } from '../../components/ui/Card';
import { FilterLabel, SearchInput, Select } from '../../components/ui/Field';
import { EmptyState, ErrorState } from '../../components/ui/Skeleton';
import { Table, TableSkeleton, Td, Th, Tr } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { isManager } from '../../lib/constants';
import { formatQty } from '../../lib/utils';
import { ProductFormDialog } from './ProductFormDialog';

const STOCK_TABS = [
  { value: '', label: 'All' },
  { value: 'ok', label: 'In stock' },
  { value: 'low', label: 'Low' },
  { value: 'out', label: 'Out of stock' },
  { value: 'alert', label: 'Needs reorder' },
];

const matchesTab = (row, tab) => !tab || (tab === 'alert' ? row.stock_state !== 'ok' : row.stock_state === tab);

export default function ProductsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const stock = params.get('stock') || '';
  const [editing, setEditing] = useState(null);
  const canManage = isManager(useAuth().user);

  const { data: categories } = useAsync(getCategories);
  const products = useAsync(() => getProducts({ search, category_id: category }), [search, category]);

  const counts = useMemo(
    () => Object.fromEntries(STOCK_TABS.map((t) => [t.value, products.data?.filter((r) => matchesTab(r, t.value)).length])),
    [products.data],
  );
  const rows = products.data?.filter((r) => matchesTab(r, stock));

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const creating = canManage && params.get('new') === '1';
  const dialogOpen = creating || editing !== null;
  const closeDialog = () => {
    setEditing(null);
    if (creating) setParam('new', '');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Every SKU with its stock across all locations. Low stock is anything at or below its reorder minimum."
        actions={
          <>
            <ButtonLink to="/products/categories" variant="outline">
              <Tags />
              Categories
            </ButtonLink>
            {canManage && (
              <Button variant="primary" onClick={() => setParam('new', '1')}>
                <Plus />
                New product
              </Button>
            )}
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4">
          <FilterLabel label="Search" className="min-w-[220px] flex-1">
            <SearchInput value={search} onChange={(e) => setParam('search', e.target.value)} placeholder="SKU or product name" />
          </FilterLabel>
          <FilterLabel label="Category" className="w-full sm:w-56">
            <Select value={category} onChange={(e) => setParam('category', e.target.value)}>
              <option value="">All categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="none">Uncategorized</option>
            </Select>
          </FilterLabel>
          {(search || category || stock) && (
            <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>
              <RotateCcw />
              Clear
            </Button>
          )}
        </div>
        <div className="border-b border-slate-100 px-5 py-3">
          <Tabs label="Stock status" items={STOCK_TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={stock} onChange={(v) => setParam('stock', v)} />
        </div>

        {products.error ? (
          <ErrorState error={products.error} onRetry={products.reload} />
        ) : !rows ? (
          <TableSkeleton rows={6} columns={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={search ? `No products match “${search}”` : 'No products here'}
            action={<Button onClick={() => setParams({}, { replace: true })}>Clear filters</Button>}
          >
            Try a different SKU, category or stock status.
          </EmptyState>
        ) : (
          <div className={products.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th>Stored at</Th>
                  <Th align="right">On hand</Th>
                  <Th align="right">Reorder at</Th>
                  <Th>Status</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <Tr key={p.product_id} onClick={() => navigate(`/products/${p.product_id}`)}>
                    <Td>
                      <Link to={`/products/${p.product_id}`} className="font-bold text-slate-900 hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                        {p.name}
                      </Link>
                      <div className="font-mono text-[11px] text-slate-400">{p.sku}</div>
                    </Td>
                    <Td className="text-slate-500">{p.category || <span className="text-slate-400">Uncategorized</span>}</Td>
                    <Td className="text-xs text-slate-600">
                      {p.locations.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.locations.slice(0, 2).map((l) => (
                            <span key={l.location_id} className="rounded-full bg-slate-100 px-2 py-0.5">
                              {l.location} <span className="font-bold tabular-nums text-slate-900">{formatQty(l.quantity)}</span>
                            </span>
                          ))}
                          {p.locations.length > 2 && <span className="px-1 text-slate-400">+{p.locations.length - 2}</span>}
                        </div>
                      )}
                    </Td>
                    <Td align="right">
                      <span className="font-extrabold text-slate-900">{formatQty(p.on_hand)}</span> <span className="text-xs text-slate-500">{p.uom}</span>
                    </Td>
                    <Td align="right" className="text-slate-500">
                      {p.min_qty !== null ? formatQty(p.min_qty) : '—'}
                    </Td>
                    <Td>
                      <StockBadge state={p.stock_state} />
                    </Td>
                    <Td align="right">
                      {canManage && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${p.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(p);
                        }}
                      >
                        <Pencil />
                      </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <ProductFormDialog open={dialogOpen} onClose={closeDialog} product={editing} />
    </div>
  );
}
