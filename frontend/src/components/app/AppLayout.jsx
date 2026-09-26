import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getDashboardKpis, getLowStock } from '../../api/inventory';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';

const COLLAPSE_KEY = 'stocksense.sidebar-collapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Sidebar + top bar around every page after login. Sends logged-out visitors to the landing page's sign-in. */
export function AppLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: kpis } = useAsync(getDashboardKpis);
  const { data: alerts } = useAsync(getLowStock);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!user) return <Navigate to="/?auth=signin" replace />;

  const toggleSidebar = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      const next = !collapsed;
      setCollapsed(next);
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // Storage blocked: the choice just isn't remembered.
      }
    } else {
      setMobileOpen((value) => !value);
    }
  };

  const counts = { ...kpis, alerts: alerts?.length };

  return (
    <div className="flex min-h-screen bg-slate-50 text-left text-slate-900">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={toggleSidebar} alerts={alerts} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
