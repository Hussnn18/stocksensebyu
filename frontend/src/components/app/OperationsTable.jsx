import { ClipboardList } from 'lucide-react';
import { StatusBadge, TypeChip } from '../ui/Badge';
import { Table, TableSkeleton, Td, Th, Tr } from '../ui/Table';
import { EmptyState } from '../ui/Skeleton';
import { formatDate } from '../../lib/utils';

/** Read-only list of operations (receipts, deliveries, transfers, adjustments). */
export function OperationsTable({ rows, loading, showType = true, emptyText = 'No operations match these filters.' }) {
  if (!rows) return <TableSkeleton rows={6} columns={showType ? 5 : 4} />;
  if (!rows.length) {
    return (
      <EmptyState icon={ClipboardList} title="Nothing here">
        {emptyText}
      </EmptyState>
    );
  }

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <Table>
        <thead>
          <tr>
            <Th>Reference</Th>
            {showType && <Th>Type</Th>}
            <Th>Partner &amp; products</Th>
            <Th>From → To</Th>
            <Th>Scheduled</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <Tr key={o.id}>
              <Td className="font-mono text-xs font-semibold text-slate-900">{o.reference}</Td>
              {showType && (
                <Td>
                  <TypeChip type={o.type} />
                </Td>
              )}
              <Td className="max-w-[260px]">
                <div className="truncate font-semibold text-slate-900">
                  {o.partner_name || <span className="font-medium text-slate-400">Stock rebalancing</span>}
                </div>
                <div className="truncate text-xs text-slate-500" title={o.products.join(', ')}>
                  {o.products.join(', ')}
                </div>
              </Td>
              <Td className="text-xs text-slate-600">
                {o.source_location}
                <span className="mx-1.5 text-slate-300">→</span>
                {o.dest_location}
              </Td>
              <Td className="tabular-nums text-slate-500">{formatDate(o.scheduled_date)}</Td>
              <Td>
                <StatusBadge status={o.status} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
