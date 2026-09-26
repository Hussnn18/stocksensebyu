import { formatQty } from '../../lib/utils';

/** Signed stock effect of a ledger row: +100 kg, −20 kg, or "100 kg moved" for internal transfers. */
export function MoveQuantity({ move }) {
  const { stock_effect: effect, quantity, uom } = move;
  if (effect > 0) return <span className="font-extrabold text-emerald-700 tabular-nums">+{formatQty(effect)} {uom}</span>;
  if (effect < 0) return <span className="font-extrabold text-rose-600 tabular-nums">−{formatQty(-effect)} {uom}</span>;
  return (
    <span className="font-semibold text-slate-600 tabular-nums">
      {formatQty(quantity)} {uom} <span className="font-normal text-slate-400">moved</span>
    </span>
  );
}
