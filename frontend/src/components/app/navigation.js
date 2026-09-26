import {
  ArrowDownToLine,
  ArrowRightLeft,
  ClipboardCheck,
  History,
  LayoutDashboard,
  Package,
  SlidersHorizontal,
  Tags,
  Truck,
  Warehouse,
} from 'lucide-react';

// `countKey` is a field of the dashboard KPIs shown as a small badge next to the item.
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/products', label: 'Products', icon: Package, match: /^\/products(\/\d+)?$/ },
      { to: '/products/categories', label: 'Categories', icon: Tags },
      { to: '/products/reorder-rules', label: 'Reorder Rules', icon: SlidersHorizontal, countKey: 'alerts', tone: 'warn' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/operations/receipts', label: 'Receipts', icon: ArrowDownToLine, countKey: 'pending_receipts' },
      { to: '/operations/deliveries', label: 'Delivery Orders', icon: Truck, countKey: 'pending_deliveries' },
      { to: '/operations/transfers', label: 'Internal Transfers', icon: ArrowRightLeft, countKey: 'transfers_scheduled' },
      { to: '/operations/adjustments', label: 'Inventory Adjustment', icon: ClipboardCheck },
      { to: '/moves', label: 'Move History', icon: History },
    ],
  },
  {
    label: 'Settings',
    items: [{ to: '/settings/warehouses', label: 'Warehouses', icon: Warehouse }],
  },
];

export function isActive(item, pathname) {
  return item.match ? item.match.test(pathname) : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** Section and page name for the breadcrumb. */
export function findPage(pathname) {
  if (pathname === '/profile') return { section: 'Account', title: 'My Profile' };
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => isActive(i, pathname));
    if (item) {
      const detail = item.to === '/products' && pathname !== '/products';
      return { section: group.label, title: item.label, detail: detail ? 'Product details' : null, to: item.to };
    }
  }
  return { section: 'StockSense', title: 'Page not found' };
}
