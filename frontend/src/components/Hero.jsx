import React, { useState } from 'react';
import { 
  ArrowRight, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Boxes, 
  Truck, 
  ArrowRightLeft, 
  SlidersHorizontal, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Building2,
  AlertTriangle
} from 'lucide-react';

export function Hero({ onOpenDashboard, onOpenSimulator, onOpenAuth }) {
  const [activeRoleTab, setActiveRoleTab] = useState('manager'); // 'manager' | 'staff'

  return (
    <div className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 hero-glow border-b border-slate-200/80 bg-gradient-to-b from-blue-50/60 via-white to-slate-50/40">
      {/* Background Decorative Grid and Blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f01a_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f01a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 text-blue-700 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 shadow-sm hover:border-blue-300 transition-all cursor-pointer">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>Digitize & Streamline All Stock Operations</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-normal">Replace Excel & Paper Registers</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6">
            Master Every Pallet, Transfer & <br className="hidden sm:inline" />
            <span className="blue-gradient-text">Real-Time Stock Ledger</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-3xl mx-auto mb-10 leading-relaxed">
            A modular Inventory Management System built for high-velocity operations. 
            Automate incoming <strong>Receipts</strong>, fast-track <strong>Delivery pick & pack</strong>, 
            relocate across <strong>Internal Racks</strong>, and eliminate count discrepancies with 
            instant, immutable ledger tracking.
          </p>

          {/* CTA Button Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={onOpenDashboard}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Boxes className="w-5 h-5 text-blue-100" />
              <span>Launch Next.js IMS Dashboard</span>
              <span className="bg-blue-500/80 text-xs px-2 py-0.5 rounded-md text-white font-semibold">Live</span>
            </button>

            <a
              href="#flow-simulator"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base px-7 py-4 rounded-xl border border-slate-300 shadow-sm hover:border-slate-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span>Simulate Inventory Flow (4 Steps)</span>
            </a>
          </div>

          {/* Role Filter Tabs (Manager vs Staff) */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl border border-slate-300/80 mb-10">
            <button
              onClick={() => setActiveRoleTab('manager')}
              className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeRoleTab === 'manager'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👔 For Inventory Managers
            </button>
            <button
              onClick={() => setActiveRoleTab('staff')}
              className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeRoleTab === 'staff'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📦 For Warehouse Staff
            </button>
          </div>

          {/* Dynamic Role Highlights Banner */}
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl border border-blue-100 p-4 sm:p-5 shadow-sm text-left mb-12">
            {activeRoleTab === 'manager' ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    Inventory Manager Command Center
                  </div>
                  <p className="text-xs text-slate-500">
                    Manage incoming/outgoing stock, set automated reorder thresholds, approve adjustments & audit historical moves.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    ✓ Full PO & Valuation Control
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    Warehouse Staff Floor Terminal
                  </div>
                  <p className="text-xs text-slate-500">
                    Perform rapid pallet transfers, pick/pack delivery orders, receive vendor shipments, and submit counted adjustments.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    ✓ High-Speed Pick & Shelve Flow
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Hero Interactive Floating KPI Snapshot Card */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Mock Next.js Dashboard Browser Header Bar */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="text-xs font-mono text-slate-400 ml-3 hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700">
                <span className="text-emerald-400">https://</span>stocksense.app/dashboard/live-kpi
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Real-Time Sync Active
              </span>
              <button 
                onClick={onOpenDashboard}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer"
              >
                Expand View ↗
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar on Landing Page */}
          <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/50 p-4 sm:p-6 gap-y-4 md:gap-y-0">
            {/* KPI 1: Products in Stock */}
            <div className="p-2 sm:p-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Total In Stock</span>
                <Boxes className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">513 <span className="text-xs font-normal text-slate-500">items</span></div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
                <TrendingUp className="w-3 h-3" /> +14% this month
              </div>
            </div>

            {/* KPI 2: Low Stock */}
            <div className="p-2 sm:p-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Low / Out of Stock</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">2 <span className="text-xs font-normal text-slate-500">SKUs</span></div>
              <div className="text-[11px] text-amber-700 bg-amber-50 font-bold px-1.5 py-0.5 rounded inline-block mt-1">
                Reorder Triggered
              </div>
            </div>

            {/* KPI 3: Pending Receipts */}
            <div className="p-2 sm:p-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Pending Receipts</span>
                <Truck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">1 <span className="text-xs font-normal text-slate-500">PO (150 qty)</span></div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                Arriving Tomorrow
              </div>
            </div>

            {/* KPI 4: Pending Deliveries */}
            <div className="p-2 sm:p-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Pending Deliveries</span>
                <Layers className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">1 <span className="text-xs font-normal text-slate-500">SO (Ready)</span></div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                10 Units Picked & Packed
              </div>
            </div>

            {/* KPI 5: Internal Transfers */}
            <div className="p-2 sm:p-3 text-left col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Internal Transfers</span>
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">50 <span className="text-xs font-normal text-slate-500">kg steel</span></div>
              <div className="text-[11px] text-purple-600 font-semibold mt-1">
                Store → Production Rack
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Trust Row */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-600 text-xs sm:text-sm font-semibold max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 bg-white py-3 px-4 rounded-xl border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Zero Count Mismatches</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-white py-3 px-4 rounded-xl border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Real-Time Stock Ledger</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-white py-3 px-4 rounded-xl border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Multi-Warehouse Support</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-white py-3 px-4 rounded-xl border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>OTP Auth & Role Security</span>
          </div>
        </div>

      </div>
    </div>
  );
}
