import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, toDateKey } from '../../lib/utils';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// 6 weeks starting on the Monday on/before the 1st, so every month has the same height.
function monthGrid(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/**
 * Month calendar. Dots mark days with operations: blue = scheduled, green = validated (done).
 * Clicking a day selects it; clicking it again clears the selection.
 * activity: Map of "YYYY-MM-DD" → { scheduled, done }.
 */
export function ActivityCalendar({ month, onMonthChange, selected, onSelect, activity }) {
  const today = toDateKey(new Date());
  const days = monthGrid(month);
  const [focusKey, setFocusKey] = useState(selected || today);
  const gridRef = useRef(null);
  const moveFocus = useRef(false);

  // Keep keyboard focus on the same day after the month changes.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector(`[data-day="${focusKey}"]`)?.focus();
  }, [focusKey, month]);

  const shiftMonth = (delta) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  const onKeyDown = (event) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = addDays(new Date(`${focusKey}T00:00:00`), step);
    moveFocus.current = true;
    setFocusKey(toDateKey(next));
    if (next.getMonth() !== month.getMonth()) onMonthChange(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const inMonth = (d) => d.getMonth() === month.getMonth();
  const tabbableKey = days.some((d) => toDateKey(d) === focusKey && inMonth(d)) ? focusKey : toDateKey(new Date(month.getFullYear(), month.getMonth(), 1));

  return (
    <div>
      <div className="mb-3 flex items-center gap-1">
        <h3 className="flex-1 text-sm font-extrabold text-slate-900" aria-live="polite">
          {month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          type="button"
          onClick={() => {
            onMonthChange(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
            setFocusKey(today);
          }}
          className="mr-1 rounded-full px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 cursor-pointer"
        >
          Today
        </button>
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div ref={gridRef} className="grid grid-cols-7 gap-y-1" onKeyDown={onKeyDown}>
        {days.map((d) => {
          const key = toDateKey(d);
          const info = activity?.get(key);
          const isSelected = key === selected;
          const isToday = key === today;
          const label = `${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}${
            info ? `: ${info.scheduled} scheduled, ${info.done} validated` : ': no operations'
          }`;
          return (
            <button
              key={key}
              type="button"
              data-day={key}
              tabIndex={key === tabbableKey ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={label}
              onClick={() => {
                setFocusKey(key);
                onSelect(isSelected ? '' : key);
                if (!inMonth(d)) onMonthChange(new Date(d.getFullYear(), d.getMonth(), 1));
              }}
              className={cn(
                'mx-auto flex size-9 flex-col items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25',
                isSelected
                  ? 'bg-slate-950 text-white'
                  : isToday
                    ? 'text-blue-700 ring-1 ring-blue-500 ring-inset hover:bg-blue-50'
                    : inMonth(d)
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-50',
              )}
            >
              <span className="leading-none">{d.getDate()}</span>
              <span className="mt-1 flex h-1 gap-0.5" aria-hidden="true">
                {info?.scheduled > 0 && <span className={cn('size-1 rounded-full', isSelected ? 'bg-blue-300' : 'bg-blue-600')} />}
                {info?.done > 0 && <span className={cn('size-1 rounded-full', isSelected ? 'bg-emerald-300' : 'bg-emerald-500')} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-blue-600" />
          Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Validated
        </span>
      </div>
    </div>
  );
}
