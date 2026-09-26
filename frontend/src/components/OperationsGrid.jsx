import React, { useState } from 'react';
import { 
  Boxes, 
  Truck, 
  Layers, 
  ArrowRightLeft, 
  SlidersHorizontal, 
  History, 
  Warehouse, 
  BellRing,
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  Zap,
  Sparkles,
  QrCode,
  FileSpreadsheet
} from 'lucide-react';

export function OperationsGrid({ onSelectModule, onOpenDashboard }) {
  const [activeCardId, setActiveCardId] = useState('receipts');
  const [drawerData, setDrawerData] = useState(null);

  const modules = [
    {
      id: 'products',
      title: 'Product Catalog & SKUs',
      subtitle: 'Create products with Name, SKU, Category, UoM & initial stock',
      icon: Boxes,
      iconColor: 'text-blue-600',
      badge: 'Core Master Data',
      accentColor: 'blue',
      description: 'Centralized product repository with unique barcodes/SKUs, unit of measures (kg, units, pcs, meters, boxes), and multi-warehouse stock allocations.',
      stats: '513 Active SKUs',
      example: 'Industrial Steel Rods (10mm) • SKU: STL-ROD-10MM • UoM: kg',
      features: [
        'Automated SKU generation & barcode label printing',
        'Custom unit of measure conversions (kg, pcs, boxes, meters)',
        'Per-location stock availability tracking across 3 warehouses',
        'Min-stock threshold triggers & automated reorder quantities'
      ]
    },
    {
      id: 'receipts',
      title: 'Receipts (Incoming Goods)',
      subtitle: 'Receive items from vendors → Validate → Stock increases automatically',
      icon: Truck,
      iconColor: 'text-emerald-600',
      badge: 'Inbound Flow',
      accentColor: 'emerald',
      description: 'Used when items arrive from vendors. Select supplier, enter received quantities, inspect packaging, and validate. Book stock increases automatically upon validation.',
      stats: 'Stock +50 to +500',
      example: 'Receive 100 kg Steel Rods from Apex Metals → Stock increases by +100 kg instantly',
      features: [
        'Match incoming deliveries against Purchase Orders',
        'One-click stock validation with automatic ledger record',
        'Partial receipt support with backorder tracking',
        'Direct staging to receiving bays or direct rack shelving'
      ]
    },
    {
      id: 'delivery',
      title: 'Delivery Orders (Outbound)',
      subtitle: 'Pick items → Pack items → Validate → Stock decreases automatically',
      icon: Layers,
      iconColor: 'text-indigo-600',
      badge: 'Outbound Flow',
      accentColor: 'indigo',
      description: 'Used when stock leaves warehouse for customer shipment. Pick items from specific racks, verify carton counts, pack securely, and validate. Stock automatically decreases.',
      stats: 'Stock -10 to -80',
      example: 'Sales order for 10 Ergonomic Chairs → Delivery order reduces book stock by -10',
      features: [
        'Optimized pick lists with exact rack and bin locations',
        'Two-step verification (Pick checklist → Pack verification)',
        'Automatic reservation prevents overselling and duplicate picking',
        'Generates dispatch notes and shipping carrier tracking labels'
      ]
    },
    {
      id: 'transfers',
      title: 'Internal Transfers',
      subtitle: 'Move stock: Main Store → Production Floor or Rack A → Rack B',
      icon: ArrowRightLeft,
      iconColor: 'text-cyan-600',
      badge: 'Relocation & Staging',
      accentColor: 'cyan',
      description: 'Relocate stock inside company premises. Total company stock remains unchanged while rack/zone balances update in real time with an immutable ledger entry.',
      stats: 'Main Store → Prod Floor',
      example: 'Move 50 kg Steel from Main Store Bay 01 → Production Rack (Total stock unchanged)',
      features: [
        'Seamless rack-to-rack, floor-to-floor and warehouse-to-warehouse moves',
        'Live location ledger tracks who moved what and at what exact second',
        'Prevents misplaced pallets and lost warehouse inventory',
        'Instant barcode scan verification at source & target racks'
      ]
    },
    {
      id: 'adjustments',
      title: 'Stock Adjustments',
      subtitle: 'Fix mismatches between recorded stock and physical count',
      icon: SlidersHorizontal,
      iconColor: 'text-amber-600',
      badge: 'Audit & Count',
      accentColor: 'amber',
      description: 'Correct discrepancies between physical warehouse counts and system records. Enter actual counted quantity; the system auto-calculates difference, updates stock, and logs audit notes.',
      stats: 'Instant Ledger Correction',
      example: 'Counted 12 bolts vs 20 in system → System logs -8 pcs adjustment due to transit scrap',
      features: [
        'Cycle counting & periodic full warehouse stocktakes',
        'Mandatory reason codes (Damage, Scrap, Theft, Found Stock)',
        'Manager approval workflows for adjustments above value thresholds',
        'Preserves historical records for strict financial audit compliance'
      ]
    },
    {
      id: 'ledger',
      title: 'Move History & Stock Ledger',
      subtitle: 'Immutable timeline of every receipt, delivery, transfer, & adjustment',
      icon: History,
      iconColor: 'text-blue-700',
      badge: 'Audit Trail',
      accentColor: 'blue',
      description: 'Complete traceability and audit compliance. Every unit entering, moving, or leaving the premises is recorded with timestamp, operator name, delta, and reference document.',
      stats: '100% Traceability',
      example: 'Doc #INT-2026-0015 • Moved 50 kg Steel • Operator: David Kim • Timestamp: 09:30 AM',
      features: [
        'Cryptographically immutable transaction stream',
        'Filter by SKU, date range, operator, warehouse, or document number',
        'One-click CSV/Excel export for financial reconciliations',
        'Full roll-back simulation & historical point-in-time stock valuation'
      ]
    },
    {
      id: 'warehouses',
      title: 'Multi-Warehouse & Zones',
      subtitle: 'Manage central warehouses, regional annexes, racks, and bays',
      icon: Warehouse,
      iconColor: 'text-emerald-700',
      badge: 'Spatial Topology',
      accentColor: 'emerald',
      description: 'Multi-location hierarchy from building level down to aisle, rack, shelf, and floor bins. View stock availability per individual location in real time.',
      stats: '3 Warehouses • 6 Zones',
      example: 'Central Warehouse (WH-CENTRAL) • Rack A Pallet 12 • Assembly Line 3',
      features: [
        'Multi-facility topology with customizable zoning',
        'Virtual receiving bays and customer dispatch staging zones',
        'Inter-warehouse transfer transit tracking',
        'Capacity utilization and high-density rack heatmaps'
      ]
    },
    {
      id: 'reordering',
      title: 'Low Stock Alerts & Reorder Rules',
      subtitle: 'Automated warnings when quantities drop below minimum safety levels',
      icon: BellRing,
      iconColor: 'text-red-500',
      badge: 'Automated Safety',
      accentColor: 'red',
      description: 'Avoid stockouts and delayed production runs. Set minimum stock triggers per SKU; system automatically alerts managers and suggests optimal reorder batches.',
      stats: '2 SKUs Need Reorder',
      example: 'M8 Hex Bolts dropped to 12 pcs (Min: 150 pcs) → Auto-trigger PO for 500 pcs',
      features: [
        'Custom safety stock buffers tailored to supplier lead times',
        'Real-time dashboard badges & email/SMS alert notifications',
        'One-click conversion of low-stock alert into incoming vendor receipt',
        'Predictive consumption burn rate analysis'
      ]
    }
  ];

  const selectedModule = modules.find(m => m.id === activeCardId) || modules[1];

  return (
    <section id="operations-grid" className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left mb-10 md:mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-md mb-3 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modular Operations Grid</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Explore modules for every type of stock operation
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2 max-w-3xl">
            Click on any module below to inspect its workflow, automated ledger formulas, and operational rules.
          </p>
        </div>

        {/* 8-Card Grid Layout (Inspired directly by Upwork Category Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
          {modules.map((item) => {
            const Icon = item.icon;
            const isActive = activeCardId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveCardId(item.id);
                  if (onSelectModule) onSelectModule(item);
                }}
                className={`group relative p-6 rounded-2xl bg-white border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
                  isActive
                    ? 'border-2 border-blue-600 shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/10 -translate-y-1'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div>
                  {/* Icon & Active Indicator */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1.5 leading-snug">
                    {item.title}
                  </h3>

                  {/* Subtitle / Description */}
                  <p className="text-xs text-slate-500 font-normal leading-relaxed mb-4">
                    {item.subtitle}
                  </p>
                </div>

                {/* Bottom Meta */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.stats}</span>
                  <span className={`flex items-center gap-1 font-bold ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded Detailed Module Preview Drawer / Card */}
        {selectedModule && (
          <div className="bg-gradient-to-br from-blue-50/70 via-white to-slate-50 border border-blue-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  {React.createElement(selectedModule.icon, { className: "w-7 h-7" })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-900">{selectedModule.title}</h3>
                    <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Active Deep-Dive
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">{selectedModule.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={onOpenDashboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Open in Live Dashboard</span>
                </button>
              </div>
            </div>

            {/* Workflow Specifications and Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Left: Operational Example Box */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Practical Warehouse Scenario</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed">
                  {selectedModule.example}
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Automatic ledger entry generated with zero manual data-entry</span>
                </div>
              </div>

              {/* Right: Key System Capabilities */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>System Capabilities & Rules</span>
                </div>
                <ul className="space-y-2">
                  {selectedModule.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
