import React from 'react';
import { Dumbbell } from 'lucide-react';

interface WeightPlateStreakProps {
  currentVisits: number;
  monthlyTarget?: number;
}

export const WeightPlateStreak: React.FC<WeightPlateStreakProps> = ({
  currentVisits,
  monthlyTarget = 16,
}) => {
  // Define Olympic plate visual types
  const plateTypes = [
    { label: '45 LB', color: 'bg-[#E63946] border-red-700 text-white', height: 'h-16', width: 'w-4' },
    { label: '35 LB', color: 'bg-[#2B59C3] border-blue-800 text-white', height: 'h-14', width: 'w-3.5' },
    { label: '25 LB', color: 'bg-[#F4A261] border-yellow-700 text-black', height: 'h-12', width: 'w-3' },
    { label: '10 LB', color: 'bg-[#2E8B57] border-green-800 text-white', height: 'h-10', width: 'w-2.5' },
    { label: '5 LB', color: 'bg-[#E5E5E5] border-gray-400 text-black', height: 'h-8', width: 'w-2' },
  ];

  // Map each visit to an Olympic plate
  const plates = Array.from({ length: Math.min(currentVisits, 25) }).map((_, idx) => {
    return plateTypes[idx % plateTypes.length];
  });

  const percent = Math.min(100, Math.round((currentVisits / monthlyTarget) * 100));

  return (
    <div className="bg-gym-card rounded-xl border border-gym-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-gym-red/10 text-gym-red border border-gym-red/20">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide uppercase">
              Olympic Barbell Streak
            </h4>
            <p className="text-xs text-gym-muted">
              Each session racks another calibrated bumper plate
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-display text-2xl text-gym-red leading-none">
            {currentVisits} <span className="text-sm text-gym-muted">/ {monthlyTarget} VISITS</span>
          </div>
          <span className="text-[11px] font-mono text-gym-greenBright font-semibold">
            {percent}% TARGET LOADED
          </span>
        </div>
      </div>

      {/* Visual Barbell Sleeve Bar */}
      <div className="relative pt-4 pb-2 px-2 overflow-x-auto">
        <div className="min-w-[420px] flex items-center justify-start">
          {/* Barbell Left Shaft & Inner Collar */}
          <div className="w-10 h-3 bg-zinc-600 rounded-l border-y border-l border-zinc-400" />
          <div className="w-3.5 h-12 bg-zinc-500 rounded-sm border border-zinc-300 shadow-sm" />

          {/* Barbell Sleeve where plates load */}
          <div className="relative flex items-center h-20 bg-zinc-800/80 px-2 rounded-r border-t border-b border-r border-zinc-700 flex-grow shadow-inner">
            {/* Center steel axis */}
            <div className="absolute inset-x-0 h-3 bg-zinc-700/80 -z-0" />

            {/* Stacked Loaded Plates */}
            <div className="flex items-center space-x-1 z-10">
              {plates.map((p, i) => (
                <div
                  key={i}
                  title={`Session #${i + 1} (${p.label})`}
                  className={`${p.width} ${p.height} ${p.color} rounded-sm border flex items-center justify-center shadow-md transform hover:-translate-y-1 transition-transform cursor-pointer`}
                >
                  <div className="w-0.5 h-full bg-black/20" />
                </div>
              ))}

              {/* Barbell Bar Clamp/Collar if sessions present */}
              {plates.length > 0 && (
                <div
                  title="Iron Collar Locked"
                  className="w-2.5 h-9 bg-gym-yellow border border-yellow-400 rounded-sm shadow-sm animate-pulse"
                />
              )}

              {/* Ghost plate slots to represent remaining target */}
              {Array.from({ length: Math.max(0, monthlyTarget - currentVisits) }).slice(0, 12).map((_, i) => (
                <div
                  key={`ghost-${i}`}
                  className="w-2.5 h-10 border border-dashed border-zinc-700/70 rounded-sm opacity-40"
                  title="Upcoming target session"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gym-muted pt-1 border-t border-gym-border/40 font-mono">
        <span>Red: 45lb · Blue: 35lb · Yellow: 25lb · Green: 10lb</span>
        <span>{currentVisits * 45} lbs of Consistency Built</span>
      </div>
    </div>
  );
};

export default WeightPlateStreak;
