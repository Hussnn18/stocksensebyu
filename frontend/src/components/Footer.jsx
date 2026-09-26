import React from 'react';
import { Boxes, ShieldCheck, Globe, Sparkles, Heart } from 'lucide-react';


export function Footer({ onOpenDashboard, onOpenAuth }) {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-left text-xs">
      {/* Top CTA Banner in Footer */}
      <div className="border-b border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white text-xl font-bold">
              <Boxes className="w-6 h-6 text-blue-500" />
              <span>StockSense Modular Inventory System</span>
            </div>
            <p className="text-slate-400 text-xs mt-1 max-w-lg">
              Replacing manual registers & spreadsheets with automated vendor receipts, delivery pick-pack, rack transfers, and real-time ledger accounting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDashboard}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Open Next.js Dashboard Demo
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </div>

      {/* Main Link Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        
        {/* Col 1: Tech Stack */}
        <div className="col-span-2 space-y-3">
          <div className="text-white font-bold text-sm flex items-center gap-2">
            <span>Modular Tech Architecture</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            Engineered with React.js + Tailwind CSS on the frontend, powered by an Express.js + Node.js backend with ACID-compliant MySQL relational stock tables.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <span className="bg-slate-800 text-blue-400 px-2 py-1 rounded text-[11px] font-mono border border-slate-700">React.js</span>
            <span className="bg-slate-800 text-cyan-400 px-2 py-1 rounded text-[11px] font-mono border border-slate-700">Tailwind CSS</span>
            <span className="bg-slate-800 text-emerald-400 px-2 py-1 rounded text-[11px] font-mono border border-slate-700">Node/Express</span>
            <span className="bg-slate-800 text-amber-400 px-2 py-1 rounded text-[11px] font-mono border border-slate-700">MySQL</span>
          </div>
        </div>

        {/* Col 2: Core Operations */}
        <div className="space-y-2">
          <div className="text-white font-bold text-xs uppercase tracking-wider">Operations</div>
          <ul className="space-y-1.5 text-slate-400">
            <li><a href="#operations-grid" className="hover:text-white transition-colors">Receipts (Inbound)</a></li>
            <li><a href="#operations-grid" className="hover:text-white transition-colors">Delivery Orders</a></li>
            <li><a href="#operations-grid" className="hover:text-white transition-colors">Internal Transfers</a></li>
            <li><a href="#operations-grid" className="hover:text-white transition-colors">Physical Adjustments</a></li>
            <li><a href="#operations-grid" className="hover:text-white transition-colors">Move History Ledger</a></li>
          </ul>
        </div>

        {/* Col 3: Target Roles */}
        <div className="space-y-2">
          <div className="text-white font-bold text-xs uppercase tracking-wider">Target Roles</div>
          <ul className="space-y-1.5 text-slate-400">
            <li><a href="#scoping-tool" className="hover:text-white transition-colors">Inventory Managers</a></li>
            <li><a href="#scoping-tool" className="hover:text-white transition-colors">Warehouse Floor Staff</a></li>
            <li><a href="#scoping-tool" className="hover:text-white transition-colors">Supply Chain Leads</a></li>
            <li><a href="#scoping-tool" className="hover:text-white transition-colors">Plant & Facility Admins</a></li>
            <li><a href="#scoping-tool" className="hover:text-white transition-colors">Operations Auditors</a></li>
          </ul>
        </div>

        {/* Col 4: System Status */}
        <div className="space-y-2">
          <div className="text-white font-bold text-xs uppercase tracking-wider">System Status</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">All Systems Operational</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Uptime: 99.99% • Ledger Latency: &lt; 4ms
            </div>
            <div className="text-[11px] text-slate-500">
              Encrypted with TLS 1.3 & AES-256
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 StockSense IMS. All rights reserved. Built for modern warehouse and stock operations.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Security Whitepaper</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
