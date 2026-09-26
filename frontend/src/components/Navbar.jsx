import React, { useState } from 'react';
import { 
  Boxes, 
  Layers, 
  ArrowRightLeft, 
  Truck, 
  SlidersHorizontal, 
  ShieldCheck, 
  LayoutDashboard, 
  LogIn, 
  UserCheck, 
  ChevronDown, 
  Sparkles,
  Menu,
  X,
  Warehouse,
  History
} from 'lucide-react';

export function Navbar({ 
  currentView, 
  setCurrentView, 
  openAuthModal, 
  currentUser, 
  setCurrentUser,
  onOpenFlowSimulator
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modulesDropdownOpen, setModulesDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      {/* Top Notification Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="bg-white/20 text-white font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" /> Modular Engine
            </span>
            <span className="font-medium truncate">
              Digitize Receipts, Deliveries, Rack Transfers & Stock Ledgers in Real Time
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-blue-100">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer transition-colors"
            >
              Open Next.js Dashboard Demo →
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Stock<span className="text-blue-600">Sense</span>
              </span>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider">
                IMS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Modular Warehouse Intelligence</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 font-medium text-sm text-slate-600">
          <button 
            onClick={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'landing' ? 'text-blue-600 font-semibold bg-blue-50/70' : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Home
          </button>

          {/* Modules Dropdown */}
          <div className="relative">
            <button
              onClick={() => setModulesDropdownOpen(!modulesDropdownOpen)}
              onMouseEnter={() => setModulesDropdownOpen(true)}
              className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Operations & Modules</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {modulesDropdownOpen && (
              <div 
                onMouseLeave={() => setModulesDropdownOpen(false)}
                className="absolute top-full left-0 mt-1 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 grid gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <a 
                  href="#operations-grid" 
                  onClick={() => setModulesDropdownOpen(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Receipts & Vendor Inbound</div>
                    <p className="text-[11px] text-slate-500">Receive goods & auto-increment book stock</p>
                  </div>
                </a>

                <a 
                  href="#operations-grid" 
                  onClick={() => setModulesDropdownOpen(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Delivery Orders (Outbound)</div>
                    <p className="text-[11px] text-slate-500">Pick, pack & auto-deduct customer shipments</p>
                  </div>
                </a>

                <a 
                  href="#operations-grid" 
                  onClick={() => setModulesDropdownOpen(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Internal Transfers</div>
                    <p className="text-[11px] text-slate-500">Relocate pallets: Main Store → Production Rack</p>
                  </div>
                </a>

                <a 
                  href="#operations-grid" 
                  onClick={() => setModulesDropdownOpen(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Physical Adjustments & Ledger</div>
                    <p className="text-[11px] text-slate-500">Fix counted mismatches with immutable audit logs</p>
                  </div>
                </a>
              </div>
            )}
          </div>

          <a 
            href="#flow-simulator" 
            className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            Live Flow Simulator
          </a>

          <a 
            href="#scoping-tool" 
            className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            Inventory Scoper
          </a>

          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'dashboard' 
                ? 'text-blue-600 font-bold bg-blue-50' 
                : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-600" />
            <span>Next.js Dashboard</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">LIVE</span>
          </button>
        </nav>

        {/* Right CTA / Role Switcher / Auth */}
        <div className="hidden sm:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pr-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-blue-600 font-semibold capitalize">{currentUser.role.replace('_', ' ')}</div>
              </div>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Dashboard
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => openAuthModal('signin')}
                className="text-slate-700 hover:text-blue-600 font-semibold text-sm px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Log in</span>
              </button>

              <button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded font-bold">14d Trial</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <div className="grid gap-2">
            <button
              onClick={() => {
                setCurrentView('landing');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-800 font-medium hover:bg-slate-50"
            >
              Home
            </button>
            <a
              href="#operations-grid"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-800 font-medium hover:bg-slate-50 block"
            >
              Operations & Modules
            </a>
            <a
              href="#flow-simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-800 font-medium hover:bg-slate-50 block"
            >
              Live Flow Simulator
            </a>
            <a
              href="#scoping-tool"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-800 font-medium hover:bg-slate-50 block"
            >
              Inventory Scoping Tool
            </a>
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-blue-600 font-bold bg-blue-50 flex items-center justify-between"
            >
              <span>Next.js Dashboard</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">LIVE</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                openAuthModal('signin');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm"
            >
              Log in
            </button>
            <button
              onClick={() => {
                openAuthModal('signup');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md"
            >
              Sign up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
