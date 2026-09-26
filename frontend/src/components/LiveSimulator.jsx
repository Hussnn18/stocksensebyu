import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  Truck, 
  ArrowRightLeft, 
  Layers, 
  SlidersHorizontal, 
  CheckCircle2, 
  History, 
  Boxes, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function LiveSimulator({ onOpenDashboard }) {
  // Initial starting scenario state
  const initialScenario = {
    step: 0,
    totalStock: 350, // Starting with 350 kg Steel
    mainStoreQty: 250,
    productionRackQty: 100,
    history: [
      {
        id: 'init-1',
        time: '08:00 AM',
        action: 'System Initialized',
        detail: 'Base stock registered: 350 kg Industrial Steel Rods (10mm)',
        delta: '350 kg',
        type: 'init'
      }
    ]
  };

  const [simState, setSimState] = useState(initialScenario);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  // Steps definition matching exact user requirements
  const steps = [
    {
      stepNumber: 1,
      title: 'Receive Goods from Vendor',
      icon: Truck,
      color: 'emerald',
      actionTitle: 'Execute Receipt (+100 kg)',
      detail: 'Receive 100 kg Steel Rods from Apex Metals at Main Store Bay 01',
      mathText: 'Stock: +100 kg (350 kg → 450 kg)',
      badge: 'Receipt Validation',
      run: (prev) => {
        return {
          step: 1,
          totalStock: prev.totalStock + 100,
          mainStoreQty: prev.mainStoreQty + 100,
          productionRackQty: prev.productionRackQty,
          history: [
            {
              id: 'step-1',
              time: '09:15 AM',
              action: 'Vendor Receipt #REC-2026-0042',
              detail: 'Received 100 kg Steel Rods from Apex Metals at Main Store Bay 01',
              delta: '+100 kg',
              type: 'receipt'
            },
            ...prev.history
          ]
        };
      }
    },
    {
      stepNumber: 2,
      title: 'Move to Production Rack',
      icon: ArrowRightLeft,
      color: 'cyan',
      actionTitle: 'Execute Internal Transfer (50 kg)',
      detail: 'Internal transfer: Main Store Bay 01 → Production Floor Rack',
      mathText: 'Total Stock: 450 kg (Unchanged) • Main Store: 300 kg | Prod Rack: 150 kg',
      badge: 'Internal Relocation',
      run: (prev) => {
        return {
          step: 2,
          totalStock: prev.totalStock,
          mainStoreQty: prev.mainStoreQty - 50,
          productionRackQty: prev.productionRackQty + 50,
          history: [
            {
              id: 'step-2',
              time: '10:30 AM',
              action: 'Internal Move #INT-2026-0015',
              detail: 'Relocated 50 kg Steel from Main Store to Production Floor Rack for CNC milling',
              delta: '-50 kg (Store) / +50 kg (Prod)',
              type: 'transfer'
            },
            ...prev.history
          ]
        };
      }
    },
    {
      stepNumber: 3,
      title: 'Deliver Finished Goods',
      icon: Layers,
      color: 'indigo',
      actionTitle: 'Execute Delivery (-20 kg)',
      detail: 'Client Order Dispatch: Deliver 20 kg steel frames to Metro Tech Enterprises',
      mathText: 'Stock for frames: –20 kg (450 kg → 430 kg)',
      badge: 'Delivery Validation',
      run: (prev) => {
        return {
          step: 3,
          totalStock: prev.totalStock - 20,
          mainStoreQty: prev.mainStoreQty,
          productionRackQty: prev.productionRackQty - 20,
          history: [
            {
              id: 'step-3',
              time: '02:00 PM',
              action: 'Customer Delivery #DEL-2026-0089',
              detail: 'Dispatched 20 kg finished steel frames to Metro Tech Enterprises',
              delta: '-20 kg',
              type: 'delivery'
            },
            ...prev.history
          ]
        };
      }
    },
    {
      stepNumber: 4,
      title: 'Adjust Damaged Items',
      icon: SlidersHorizontal,
      color: 'amber',
      actionTitle: 'Execute Adjustment (-3 kg)',
      detail: 'Physical count audit found 3 kg damaged steel rods scraped during handling',
      mathText: '3 kg steel damaged → Stock: –3 kg (430 kg → 427 kg)',
      badge: 'Physical Audit Diff',
      run: (prev) => {
        return {
          step: 4,
          totalStock: prev.totalStock - 3,
          mainStoreQty: prev.mainStoreQty - 3,
          productionRackQty: prev.productionRackQty,
          history: [
            {
              id: 'step-4',
              time: '04:45 PM',
              action: 'Stock Adjustment #ADJ-2026-0008',
              detail: 'Physical count variance: 3 kg damaged raw material written off to Scrap',
              delta: '-3 kg (Loss)',
              type: 'adjustment'
            },
            ...prev.history
          ]
        };
      }
    }
  ];

  const handleExecuteNext = () => {
    if (simState.step < 4) {
      const nextStepDef = steps[simState.step];
      const newState = nextStepDef.run(simState);
      setSimState(newState);

      if (newState.step === 4) {
        try {
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    }
  };

  const handleReset = () => {
    setSimState(initialScenario);
    setIsPlayingAll(false);
  };

  const handlePlayAll = async () => {
    setIsPlayingAll(true);
    let current = initialScenario;
    setSimState(current);

    for (let i = 0; i < 4; i++) {
      await new Promise(r => setTimeout(r, 900));
      current = steps[i].run(current);
      setSimState({ ...current });
    }

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}
    setIsPlayingAll(false);
  };

  return (
    <section id="flow-simulator" className="py-16 md:py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 text-blue-300 px-3.5 py-1 rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Interactive Operational Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            See the Complete 4-Step Inventory Flow in Action
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Watch how incoming vendor goods, internal rack transfers, customer deliveries, and damaged count adjustments flow through the immutable stock ledger in real time.
          </p>

          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={handleExecuteNext}
              disabled={simState.step >= 4 || isPlayingAll}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                simState.step >= 4
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{simState.step === 0 ? 'Start Step 1 (Receive Goods)' : `Execute Step ${simState.step + 1}`}</span>
            </button>

            <button
              onClick={handlePlayAll}
              disabled={isPlayingAll}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Auto-Play Full Flow</span>
            </button>

            <button
              onClick={handleReset}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive Step Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCompleted = simState.step >= st.stepNumber;
            const isCurrent = simState.step === st.stepNumber - 1;

            return (
              <div
                key={st.stepNumber}
                className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-900/30 ring-2 ring-blue-500/20'
                    : isCurrent
                    ? 'bg-slate-800/90 border-blue-400 animate-pulse-glow shadow-md'
                    : 'bg-slate-800/40 border-slate-700/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                      isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {isCompleted ? '✓' : st.stepNumber}
                    </span>

                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {st.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span>{st.title}</span>
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {st.detail}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-700/80 font-mono text-[11px] text-blue-300 font-medium">
                  {st.mathText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Simulator Visualization Dashboard (Stock Breakdown + Real-Time Ledger) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Location Allocation & Live Gauge */}
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700 rounded-3xl p-6 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-5">
                <div>
                  <div className="text-xs font-mono uppercase text-slate-400">SKU: STL-ROD-10MM</div>
                  <div className="text-lg font-bold text-white">Industrial Steel Rods</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Company Stock</div>
                  <div className="text-3xl font-black text-blue-400 font-mono">
                    {simState.totalStock} <span className="text-sm text-slate-300 font-normal">kg</span>
                  </div>
                </div>
              </div>

              {/* Warehouse Location Balances */}
              <div className="space-y-4">
                {/* Location 1: Main Store Bay 01 */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-200">Main Store — Bay 01 (Central WH)</span>
                    <span className="font-mono text-emerald-400 font-bold">{simState.mainStoreQty} kg</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (simState.mainStoreQty / 450) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Location 2: Production Floor Rack */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-200">Production Floor Rack (Annex)</span>
                    <span className="font-mono text-cyan-400 font-bold">{simState.productionRackQty} kg</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (simState.productionRackQty / 450) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Completion Message */}
            <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {simState.step === 4 ? '🎉 Full Cycle Completed & Verified' : `Progress: Step ${simState.step} / 4`}
              </span>
              <button
                onClick={onOpenDashboard}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View in Main Dashboard →</span>
              </button>
            </div>
          </div>

          {/* Right: Real-Time Stock Ledger Log Stream */}
          <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700 rounded-3xl p-6 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    Stock Ledger & Move History
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Live Stream (Immutable)
                </span>
              </div>

              {/* Ledger Items List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {simState.history.map((log) => (
                  <div 
                    key={log.id}
                    className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 flex items-start justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
                        <span className="font-bold text-slate-100">{log.action}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{log.detail}</p>
                    </div>

                    <div className={`font-mono font-bold px-2 py-1 rounded text-xs shrink-0 ${
                      log.delta.startsWith('+')
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        : log.delta.startsWith('-')
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                        : 'bg-blue-950 text-blue-400 border border-blue-800/40'
                    }`}>
                      {log.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Every movement generates a permanent cryptographic ledger hash for zero-audit discrepancy.</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
