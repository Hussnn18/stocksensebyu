import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
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
  const { data: kpis, error: serverError, reload } = useAsync(getDashboardKpis);
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
          {serverError && (
            <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <p className="flex-1">
                {serverError.message} Data on this page can’t load until it’s back. (Start the backend and MySQL, or run the frontend with
                VITE_DATA_SOURCE=mock.)
              </p>
              <button type="button" onClick={reload} className="font-bold text-rose-700 hover:text-rose-900 cursor-pointer">
                Retry
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
