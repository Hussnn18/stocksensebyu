import { useMemo, useRef, useState } from 'react';
import { Table2 } from 'lucide-react';
import { getMoves } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Table, Td, Th, Tr } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAsync } from '../../hooks/useAsync';
import { useElementWidth } from '../../hooks/useElementWidth';
import { formatDate, toDateKey } from '../../lib/utils';

// Categorical colors checked with the dataviz palette validator on white (all checks pass;
// the aqua sits below 3:1 contrast, so the legend and the table view carry identity too).
const SERIES = [
  { key: 'incoming', label: 'Incoming', color: '#2563eb', hint: 'receipts & stock added' },
  { key: 'outgoing', label: 'Outgoing', color: '#eb6834', hint: 'deliveries & write-offs' },
  { key: 'internal', label: 'Internal', color: '#1baf7a', hint: 'moves between locations' },
];

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

const HEIGHT = 240;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 32 };
const GAP = 2;

function buildDays(moves, days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const list = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    list.push({ key: toDateKey(date), date, incoming: 0, outgoing: 0, internal: 0 });
  }
  const byKey = new Map(list.map((d) => [d.key, d]));
  moves.forEach((m) => {
    const day = byKey.get(toDateKey(m.moved_at));
    if (!day) return;
    if (m.stock_effect > 0) day.incoming += 1;
    else if (m.stock_effect < 0) day.outgoing += 1;
    else day.internal += 1;
  });
  return list.map((d) => ({ ...d, total: d.incoming + d.outgoing + d.internal }));
}

// Column segment with a rounded top (data end) and a square base.
function segmentPath(x, yTop, width, height, rounded) {
  const r = rounded ? Math.min(4, width / 2, height) : 0;
  const yBottom = yTop + height;
  return `M${x},${yBottom}V${yTop + r}${r ? `Q${x},${yTop} ${x + r},${yTop}` : ''}H${x + width - r}${
    r ? `Q${x + width},${yTop} ${x + width},${yTop + r}` : ''
  }V${yBottom}Z`;
}

export function MovementChart() {
  const [range, setRange] = useState(14);
  const [view, setView] = useState('chart');
  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (range - 1));
    return toDateKey(d);
  }, [range]);
  const { data: moves, loading } = useAsync(() => getMoves({ from }), [from]);
  const days = useMemo(() => buildDays(moves || [], range), [moves, range]);
  const totals = SERIES.map((s) => days.reduce((sum, d) => sum + d[s.key], 0));

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Stock movements"
        description="Ledger entries per day"
        actions={
          <>
            <Tabs label="Time range" items={RANGES} value={range} onChange={setRange} />
            <Button
              variant={view === 'table' ? 'primary' : 'outline'}
              size="icon-sm"
              aria-pressed={view === 'table'}
              aria-label="Show as table"
              title="Show as table"
              onClick={() => setView((v) => (v === 'table' ? 'chart' : 'table'))}
            >
              <Table2 />
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 pt-4" aria-label="Legend">
        {SERIES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 text-xs" title={s.hint}>
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="font-bold tabular-nums text-slate-900">{moves ? totals[i] : '–'}</span>
          </div>
        ))}
      </div>
      <div className={loading && moves ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        {!moves ? (
          <div className="p-5">
            <Skeleton className="h-[240px] w-full rounded-2xl" />
          </div>
        ) : view === 'chart' ? (
          <ColumnChart days={days} range={range} />
        ) : (
          <MovementTable days={days} />
        )}
      </div>
    </Card>
  );
}

function ColumnChart({ days, range }) {
  const ref = useRef(null);
  const width = useElementWidth(ref); // content width, inside the 20px side padding
  const [hover, setHover] = useState(null);

  const max = Math.max(...days.map((d) => d.total), 0);
  const step = Math.max(1, Math.ceil(max / 4));
  const yMax = step * 4;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = days.length ? plotW / days.length : 0;
  const barW = Math.min(24, band * 0.62);
  const y = (v) => MARGIN.top + plotH - (v / yMax) * plotH;
  const labelEvery = range <= 14 ? (band < 44 ? 2 : 1) : 5;
  const active = hover !== null ? days[hover] : null;
  const tooltipW = 176;

  return (
    <div ref={ref} className="relative px-5 pt-2 pb-4">
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={`Stock movements over the last ${range} days`} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#e2e8f0' : '#f1f5f9'} strokeWidth="1" />
              <text x={MARGIN.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[10px] tabular-nums">
                {t}
              </text>
            </g>
          ))}

          {days.map((d, i) => {
            const x0 = MARGIN.left + i * band;
            const x = x0 + (band - barW) / 2;
            const filled = SERIES.filter((s) => d[s.key] > 0);
            let cursor = 0;
            return (
              <g key={d.key}>
                {hover === i && <rect x={x0 + 1} y={MARGIN.top} width={band - 2} height={plotH} rx="8" fill="#f1f5f9" />}
                {filled.map((s, idx) => {
                  const yTop = y(cursor + d[s.key]);
                  const yBase = y(cursor) - (idx > 0 ? GAP : 0); // 2px surface gap between stacked segments
                  cursor += d[s.key];
                  const h = yBase - yTop;
                  if (h <= 0.5) return null;
                  return <path key={s.key} d={segmentPath(x, yTop, barW, h, idx === filled.length - 1)} fill={s.color} />;
                })}
                {i % labelEvery === 0 && (
                  <text x={x0 + band / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
                    {formatDate(d.date)}
                  </text>
                )}
                <rect
                  x={x0}
                  y={MARGIN.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${formatDate(d.date, true)}: ${SERIES.map((s) => `${d[s.key]} ${s.label.toLowerCase()}`).join(', ')}`}
                  className="outline-none"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {width > 0 && max === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">No stock moved in this period</p>
        </div>
      )}

      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-xl"
          style={{
            width: tooltipW,
            left: Math.min(Math.max(20 + MARGIN.left + (hover + 0.5) * band - tooltipW / 2, 8), width + 40 - tooltipW - 8),
          }}
        >
          <div className="mb-2 font-bold text-slate-500">{formatDate(active.date, true)}</div>
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-2 py-0.5">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              <span className="font-extrabold tabular-nums text-slate-900">{active[s.key]}</span>
              <span className="text-slate-500">{s.label.toLowerCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MovementTable({ days }) {
  const rows = [...days].reverse();
  return (
    <div className="max-h-[272px] overflow-y-auto">
      <Table>
        <thead>
          <tr>
            <Th>Date</Th>
            {SERIES.map((s) => (
              <Th key={s.key} align="right">
                {s.label}
              </Th>
            ))}
            <Th align="right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <Tr key={d.key}>
              <Td className="text-slate-500">{formatDate(d.date, true)}</Td>
              {SERIES.map((s) => (
                <Td key={s.key} align="right">
                  {d[s.key]}
                </Td>
              ))}
              <Td align="right" className="font-bold text-slate-900">
                {d.total}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
