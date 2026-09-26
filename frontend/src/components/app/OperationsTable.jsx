import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { StatusBadge, TypeChip } from '../ui/Badge';
import { Table, TableSkeleton, Td, Th, Tr } from '../ui/Table';
import { EmptyState } from '../ui/Skeleton';
import { formatDate } from '../../lib/utils';

/** List of operations (receipts, deliveries, transfers, adjustments). Rows open the document. */
export function OperationsTable({ rows, loading, showType = true, emptyText = 'No operations match these filters.', emptyAction }) {
  const navigate = useNavigate();
  if (!rows) return <TableSkeleton rows={6} columns={5} />;
  if (!rows.length) {
    return (
      <EmptyState icon={ClipboardList} title="Nothing here" action={emptyAction}>
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
            <Th>Partner &amp; products</Th>
            <Th>From → To</Th>
            <Th>Scheduled</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <Tr key={o.id} onClick={() => navigate(`/operations/${o.id}`)}>
              <Td>
                <Link
                  to={`/operations/${o.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-xs font-semibold text-slate-900 hover:text-blue-600"
                >
                  {o.reference}
                </Link>
                {showType && (
                  <div className="mt-0.5">
                    <TypeChip type={o.type} />
                  </div>
                )}
              </Td>
              <Td className="max-w-[240px]">
                <div className="truncate font-semibold text-slate-900">
                  {o.partner_name || <span className="font-medium text-slate-400">Stock rebalancing</span>}
                </div>
                <div className="truncate text-xs text-slate-500" title={o.products.join(', ')}>
                  {o.products.join(', ')}
                </div>
              </Td>
              <Td className="max-w-[210px] text-xs whitespace-normal text-slate-600">
                {o.source_location}
                <span className="mx-1.5 text-slate-300">→</span>
                <span className="whitespace-nowrap">{o.dest_location}</span>
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
