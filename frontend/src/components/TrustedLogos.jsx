import React from 'react';

export function TrustedLogos() {
  const logos = [
    { name: 'airbnb', label: 'airbnb', color: '#FF5A5F' },
    { name: 'databricks', label: 'databricks', color: '#FF3621' },
    { name: 'cloudflare', label: 'cloudflare', color: '#F38020' },
    { name: 'scale', label: 'scale', color: '#000000' },
    { name: 'Microsoft', label: 'Microsoft', color: '#00A4EF' },
    { name: 'grammarly', label: 'grammarly', color: '#15C39A' },
    { name: 'bambooHR', label: 'bambooHR®', color: '#6BB73B' },
    { name: 'shutterstock', label: 'shutterstock', color: '#EE2B24' }
  ];

  return (
    <section className="py-8 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          TRUSTED BY OVER 800,000 LOGISTICS HUBS, FACTORIES & WAREHOUSES WORLDWIDE
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-6 items-center justify-items-center opacity-85">
          {logos.map((logo, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all duration-300 transform hover:scale-105 cursor-pointer py-2 text-slate-700 font-bold tracking-tight text-sm md:text-base"
            >
              {logo.name === 'airbnb' && (
                <span className="text-red-500 font-black text-lg">airbnb</span>
              )}
              {logo.name === 'databricks' && (
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rotate-45 bg-orange-600 inline-block"></span>
                  <span className="text-slate-800 font-extrabold">databricks</span>
                </div>
              )}
              {logo.name === 'cloudflare' && (
                <div className="flex items-center gap-1">
                  <span className="text-amber-500 font-black">☁</span>
                  <span className="text-slate-800 font-bold">cloudflare</span>
                </div>
              )}
              {logo.name === 'scale' && (
                <span className="text-slate-900 font-mono font-black tracking-widest text-lg">scale</span>
              )}
              {logo.name === 'Microsoft' && (
                <div className="flex items-center gap-1.5">
                  <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                    <div className="bg-red-500 w-1.5 h-1.5"></div>
                    <div className="bg-green-500 w-1.5 h-1.5"></div>
                    <div className="bg-blue-500 w-1.5 h-1.5"></div>
                    <div className="bg-yellow-500 w-1.5 h-1.5"></div>
                  </div>
                  <span className="text-slate-800 font-semibold">Microsoft</span>
                </div>
              )}
              {logo.name === 'grammarly' && (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">G</div>
                  <span className="text-slate-800 font-bold">grammarly</span>
                </div>
              )}
              {logo.name === 'bambooHR' && (
                <span className="text-green-600 font-bold font-serif italic text-base">bambooHR®</span>
              )}
              {logo.name === 'shutterstock' && (
                <span className="text-slate-900 font-black tracking-tighter text-sm">shutterstock</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
