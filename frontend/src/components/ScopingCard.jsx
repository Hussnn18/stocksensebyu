import React, { useState } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Warehouse, 
  SlidersHorizontal, 
  Truck, 
  FileSpreadsheet, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw,
  Boxes,
  Zap,
  User,
  Building,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function ScopingCard({ onApplyToDashboard }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPriority, setSelectedPriority] = useState('Save time');
  const [selectedRole, setSelectedRole] = useState('Inventory Manager');
  const [selectedScale, setSelectedScale] = useState('Multi-Facility');
  const [modeTab, setModeTab] = useState('managers'); // 'managers' | 'staff'

  const priorityOptions = [
    { id: 'Save time', label: 'Save time', icon: Clock, desc: 'Cut picking & packing hours by 4.8x' },
    { id: 'Eliminate stockouts', label: 'Eliminate stockouts', icon: TrendingUp, desc: 'Auto-reorder before safety stock depletes' },
    { id: 'Multi-warehouse sync', label: 'Multi-warehouse sync', icon: Warehouse, desc: 'Real-time rack-to-rack ledger across sites' },
    { id: 'Fix count mismatches', label: 'Fix count mismatches', icon: SlidersHorizontal, desc: 'Audit physical count vs recorded stock' },
    { id: 'Speed up receipts', label: 'Speed up receipts', icon: Truck, desc: 'One-click vendor inbound stock verification' },
    { id: 'Replace Excel & paper', label: 'Replace Excel & paper', icon: FileSpreadsheet, desc: 'Centralized single source of inventory truth' },
  ];

  const roleOptions = [
    { id: 'Inventory Manager', label: 'Inventory Manager', icon: User, desc: 'Reorder rules, vendor POs, valuation & approvals' },
    { id: 'Warehouse Staff', label: 'Warehouse Staff', icon: Boxes, desc: 'Barcode scanning, rack shelving & pick-pack' },
    { id: 'Operations Director', label: 'Operations Director', icon: Building, desc: 'Multi-facility oversight & executive KPI reports' },
    { id: 'Business Owner', label: 'Business Owner', icon: Zap, desc: 'End-to-end stock control & margin optimization' },
  ];

  const scaleOptions = [
    { id: 'Single Warehouse', label: '1 Facility (< 5,000 SKUs)', desc: 'Standard central store & floor staging' },
    { id: 'Multi-Facility', label: 'Multi-Facility (2-10 Warehouses)', desc: 'Hub & spoke regional distribution' },
    { id: 'Enterprise Network', label: 'Enterprise Network (10+ Facilities)', desc: 'High-throughput automated multi-tier logistics' },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(4);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
  };

  return (
    <section id="scoping-tool" className="py-16 md:py-24 bg-gradient-to-b from-white to-blue-50/50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 2-Column Scoping Widget (Inspired by Image 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Explanatory Content */}
          <div className="lg:col-span-5 text-left space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-100/70 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Free Inventory Flow Scoping</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Not sure where your warehouse is losing stock?
            </h2>

            <p className="text-base text-slate-600 leading-relaxed">
              Answer three quick questions. Get matched to the ideal modular configuration, automated reorder thresholds, and instant interactive dashboard parameters.
            </p>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <span>Zero guesswork — tailored to your exact SKU volume</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <span>Customized workflow preview with live math calculations</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <span>1-click load into the Next.js interactive sandbox</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Scoping Card (Directly Styled like Image 2) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl p-6 sm:p-8 text-left transition-all">
              
              {/* Card Header & Step Progress Bar */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {currentStep <= 3 ? `Question ${currentStep} of 3` : 'Scoping Analysis Complete'}
                </span>

                {/* 3-segment progress indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-10 rounded-full transition-all duration-300 ${
                    currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-200'
                  }`}></div>
                  <div className={`h-2 w-10 rounded-full transition-all duration-300 ${
                    currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'
                  }`}></div>
                  <div className={`h-2 w-10 rounded-full transition-all duration-300 ${
                    currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'
                  }`}></div>
                </div>
              </div>

              {/* Step 1: Top Business Priority */}
              {currentStep === 1 && (
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-5">
                    What's your top inventory priority?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {priorityOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = selectedPriority === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedPriority(opt.id)}
                          className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Role Selection */}
              {currentStep === 2 && (
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-5">
                    What is your primary operational role?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {roleOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = selectedRole === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedRole(opt.id)}
                          className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-slate-500 hover:text-slate-900 text-xs font-bold px-3 py-2 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Facility Scale</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Facility Scale */}
              {currentStep === 3 && (
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-5">
                    What scale of inventory do you manage?
                  </h3>

                  <div className="space-y-3 mb-6">
                    {scaleOptions.map((opt) => {
                      const isSelected = selectedScale === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedScale(opt.id)}
                          className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-slate-500 hover:text-slate-900 text-xs font-bold px-3 py-2 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Generate Custom Architecture</span>
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Results & Custom Solution */}
              {currentStep === 4 && (
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Personalized Inventory Roadmap Generated</span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                    Optimized for {selectedRole} ({selectedScale})
                  </h3>

                  <p className="text-xs text-slate-500 mb-5">
                    Based on your priority of <strong>"{selectedPriority}"</strong>, here are your configured system parameters:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5">
                      <div className="text-xs text-blue-600 font-semibold">Projected Time Saved</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">14.5 hrs/wk</div>
                      <div className="text-[11px] text-slate-500">In pick, pack & count audits</div>
                    </div>

                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5">
                      <div className="text-xs text-emerald-600 font-semibold">Stock Accuracy</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">99.98%</div>
                      <div className="text-[11px] text-slate-500">Zero unlogged discrepancies</div>
                    </div>

                    <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5">
                      <div className="text-xs text-indigo-600 font-semibold">Active Modules</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">6 Core</div>
                      <div className="text-[11px] text-slate-500">Receipts, Deliveries & Transfers</div>
                    </div>
                  </div>

                  {/* Preloaded Rule preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-xs text-slate-700 font-mono">
                    <div className="text-slate-400 font-sans font-bold uppercase text-[10px] mb-1">Pre-configured Reorder Rule</div>
                    <div>IF Stock(M8 Bolts) &lt; 150 pcs ➔ Auto-Draft Receipt (+500 pcs)</div>
                    <div className="text-slate-500 mt-0.5">Transfer Route: Main Store (Bay 01) ➔ Production Floor (Rack 01)</div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={onApplyToDashboard}
                      className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Launch Next.js Dashboard with this Config</span>
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full sm:w-auto text-slate-600 hover:text-slate-900 font-semibold text-xs py-3.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Scoping</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Bottom Tab Pill: "How it works: For Inventory Managers / For Warehouse Staff" (Inspired by Image 2 bottom toggle) */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-slate-200">
          <div className="text-xl font-black text-slate-900">
            How it works
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200">
            <button
              onClick={() => setModeTab('managers')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                modeTab === 'managers'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              For Inventory Managers
            </button>
            <button
              onClick={() => setModeTab('staff')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                modeTab === 'staff'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              For Warehouse Floor Staff
            </button>
          </div>
        </div>

        {/* 3-Step "How it works" Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 text-left">
          {modeTab === 'managers' ? (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                  01
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Create & Categorize SKUs</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Define product units of measure, set safety stock minimums, and assign storage zones across your warehouse network.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                  02
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Automate Inbound & Outbound POs</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Draft receipts from suppliers and delivery orders for client shipments with automatic stock ledger validation.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                  03
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Review Real-Time Audit Ledger</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Monitor live move history, approve stock count adjustments, and track total inventory valuation per facility.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4">
                  01
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Receive & Inspect Pallets</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Check vendor quantities at the receiving bay and click validate to immediately update warehouse book stock.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4">
                  02
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Rack-to-Rack Relocation</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Move goods from Main Store Bay to Production Rack or staging with zero paperwork — instant rack balance sync.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4">
                  03
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Pick, Pack & Dispatch</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Follow step-by-step picking checklists by aisle/bin, box items securely, and validate outgoing client deliveries.
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
}
