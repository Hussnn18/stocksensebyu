// Shared labels and colors. Status colors are the same on every screen:
// Draft = grey, Waiting = amber, Ready = blue, Done = green, Canceled = red.

export const OPERATION_TYPES = {
  receipt: { label: 'Receipt', plural: 'Receipts', path: '/operations/receipts' },
  delivery: { label: 'Delivery', plural: 'Delivery Orders', path: '/operations/deliveries' },
  internal: { label: 'Internal', plural: 'Internal Transfers', path: '/operations/transfers' },
  adjustment: { label: 'Adjustment', plural: 'Adjustments', path: '/operations/adjustments' },
};

export const STATUSES = ['draft', 'waiting', 'ready', 'done', 'canceled'];
export const OPEN_STATUSES = ['draft', 'waiting', 'ready'];

export const STATUS_META = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  waiting: { label: 'Waiting', className: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  ready: { label: 'Ready', className: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' },
  done: { label: 'Done', className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  canceled: { label: 'Canceled', className: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
};

export const STOCK_META = {
  ok: { label: 'In stock', className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  low: { label: 'Low stock', className: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  out: { label: 'Out of stock', className: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', bar: 'bg-rose-500' },
};

// Move history types. 'initial' = opening stock entered when a product was created.
export const MOVE_TYPES = {
  receipt: 'Receipt',
  delivery: 'Delivery',
  internal: 'Internal',
  adjustment: 'Adjustment',
  initial: 'Initial stock',
};

export const UNITS = ['units', 'pcs', 'kg', 'g', 'm', 'L', 'box', 'can', 'roll'];

export function roleLabel(role) {
  if (role === 'manager' || role === 'inventory_manager') return 'Inventory Manager';
  if (role === 'staff' || role === 'warehouse_staff') return 'Warehouse Staff';
  return 'Team member';
}
