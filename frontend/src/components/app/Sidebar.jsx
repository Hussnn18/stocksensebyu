import { useCallback, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Globe, LogOut, UserRound } from 'lucide-react';
import { NAV_GROUPS, isActive } from './navigation';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { useDismiss } from '../../hooks/useDismiss';
import { roleLabel } from '../../lib/constants';
import { cn, displayName, initials } from '../../lib/utils';

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, counts }) {
  const { pathname } = useLocation();

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-[transform,width] duration-200 motion-reduce:transition-none',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          'lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 lg:shadow-none',
          collapsed ? 'lg:w-[76px]' : 'lg:w-64',
        )}
        aria-label="Main navigation"
      >
        <Link
          to="/dashboard"
          className={cn('flex h-16 shrink-0 items-center border-b border-slate-100 px-5', collapsed && 'lg:justify-center lg:px-0')}
        >
          <Logo className={collapsed ? 'lg:[&>span]:hidden' : undefined} />
        </Link>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div
                className={cn(
                  'mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400',
                  collapsed && 'lg:mx-auto lg:h-px lg:w-8 lg:bg-slate-200 lg:p-0 lg:text-[0px]',
                )}
              >
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavItem item={item} active={isActive(item, pathname)} collapsed={collapsed} count={item.countKey ? counts?.[item.countKey] : undefined} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}

function NavItem({ item, active, collapsed, count }) {
  const Icon = item.icon;
  const showCount = count > 0;
  return (
    <Link
      to={item.to}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex h-9 items-center gap-3 rounded-full px-3 text-sm font-semibold transition-colors',
        active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        collapsed && 'lg:mx-auto lg:w-11 lg:justify-center lg:px-0',
      )}
    >
      <Icon className={cn('size-[18px] shrink-0', active ? 'text-blue-600' : 'text-slate-400')} />
      <span className={cn('truncate', collapsed && 'lg:sr-only')}>{item.label}</span>
      {showCount && (
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
            item.tone === 'warn' ? 'bg-amber-100 text-amber-700' : active ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600',
            collapsed && 'lg:absolute lg:-top-1 lg:-right-1 lg:ml-0 lg:px-1.5 lg:ring-2 lg:ring-white',
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function UserMenu({ collapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-slate-100 cursor-pointer',
          collapsed && 'lg:justify-center',
        )}
      >
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
          {initials(user?.name)}
          <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </span>
        <span className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
          <span className="block truncate text-sm font-extrabold text-slate-900">{displayName(user?.name)}</span>
          <span className="block truncate text-xs text-slate-500">{roleLabel(user?.role)}</span>
        </span>
        <ChevronsUpDown className={cn('size-4 shrink-0 text-slate-400', collapsed && 'lg:hidden')} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute bottom-full left-0 z-50 mb-2 w-60 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl',
            collapsed && 'lg:bottom-0 lg:left-full lg:mb-0 lg:ml-3',
          )}
        >
          <div className="border-b border-slate-100 px-3 pt-2 pb-3">
            <div className="truncate text-sm font-extrabold text-slate-900">{displayName(user?.name)}</div>
            <div className="truncate text-xs text-slate-500">{user?.email}</div>
          </div>
          <div className="py-1">
            <MenuLink to="/profile" icon={UserRound} onClick={close}>
              My Profile
            </MenuLink>
            <MenuLink to="/" icon={Globe} onClick={close}>
              Back to website
            </MenuLink>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon: Icon, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
    >
      <Icon className="size-4 text-slate-400" />
      {children}
    </Link>
  );
}
