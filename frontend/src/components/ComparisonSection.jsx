import React from 'react';
import { 
  Check, 
  X, 
  FileSpreadsheet, 
  Boxes, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  ShieldCheck,
  Zap
} from 'lucide-react';

export function ComparisonSection({ onOpenDashboard }) {
  const comparisonRows = [
    {
      feature: 'Real-time Stock Ledger & Move History',
      excel: 'Manual manual entries prone to overwrites & accidental deletions',
      excelPass: false,
      stocksense: 'Immutable real-time audit log with timestamp & user ID',
      stocksensePass: true
    },
    {
      feature: 'Vendor Inbound & Receipts Validation',
      excel: 'Paper delivery dockets typed in days late; phantom stock discrepancies',
      excelPass: false,
      stocksense: '1-click receipt validation auto-increments warehouse inventory instantly',
      stocksensePass: true
    },
    {
      feature: 'Outbound Delivery & Pick-Pack',
      excel: 'Paper pick slips get lost; risk of double-shipping & overselling',
      excelPass: false,
      stocksense: 'Guided pick/pack checklists by rack location with auto-deduct',
      stocksensePass: true
    },
    {
      feature: 'Rack-to-Rack & Multi-Warehouse Transfers',
      excel: 'Untracked verbal moves; pallets mysteriously go missing for weeks',
      excelPass: false,
      stocksense: 'Live spatial topology (Aisle, Rack, Bay) synced across all locations',
      stocksensePass: true
    },
    {
      feature: 'Low Stock Alerts & Reorder Rules',
      excel: 'Notice out-of-stock only after manufacturing line or customer halts',
      excelPass: false,
      stocksense: 'Automated safety threshold triggers & 1-click purchase orders',
      stocksensePass: true
    },
    {
      feature: 'Physical Count & Adjustment Discrepancies',
      excel: 'Massive month-end write-offs with zero explanation of lost units',
      excelPass: false,
      stocksense: 'Instant counted vs book variance math with manager approval flow',
      stocksensePass: true
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-3 py-1 rounded-md mb-3 border border-blue-200">
            <span>Why Replace Spreadsheets</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Stop losing stock to Excel sheets & manual paper registers
          </h2>
          <p className="text-base text-slate-600 mt-2">
            See how upgrading to StockSense eliminates phantom inventory and saves 14+ hours every week.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200 bg-slate-100/70 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="md:col-span-4 p-5 text-left font-bold text-slate-700 text-sm flex items-center gap-2">
              <span>Operational Capability</span>
            </div>
            <div className="md:col-span-4 p-5 text-left font-bold text-rose-700 text-sm flex items-center gap-2 bg-rose-50/50">
              <FileSpreadsheet className="w-4 h-4 text-rose-500" />
              <span>Manual Registers & Excel</span>
            </div>
            <div className="md:col-span-4 p-5 text-left font-bold text-blue-700 text-sm flex items-center gap-2 bg-blue-50/80">
              <Boxes className="w-4 h-4 text-blue-600" />
              <span>StockSense Modular IMS</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {comparisonRows.map((row, idx) => (
              <div 
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                {/* Feature Title */}
                <div className="md:col-span-4 p-4 sm:p-5 text-left font-bold text-slate-900 text-xs sm:text-sm flex items-center">
                  {row.feature}
                </div>

                {/* Excel Column */}
                <div className="md:col-span-4 p-4 sm:p-5 text-left text-xs text-slate-600 flex items-start gap-2.5 bg-rose-50/20">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span className="leading-relaxed">{row.excel}</span>
                </div>

                {/* StockSense Column */}
                <div className="md:col-span-4 p-4 sm:p-5 text-left text-xs text-slate-800 font-medium flex items-start gap-2.5 bg-blue-50/30">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="leading-relaxed">{row.stocksense}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Metrics Callout */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to automate your warehouse operations?
            </h3>
            <p className="text-blue-100 text-sm">
              Average warehouses see an immediate 99.98% inventory accuracy within the first 48 hours of onboarding.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenDashboard}
              className="w-full sm:w-auto bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Explore Live Dashboard</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
