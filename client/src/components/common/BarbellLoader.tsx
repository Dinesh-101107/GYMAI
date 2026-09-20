import React from 'react';

interface BarbellLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BarbellLoader: React.FC<BarbellLoaderProps> = ({ text = 'Loading...', size = 'md' }) => {
  const barWidth = size === 'sm' ? 'w-28' : size === 'lg' ? 'w-64' : 'w-44';
  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3 select-none">
      {/* Visual Barbell Rack */}
      <div className="flex items-center space-x-1.5">
        {/* Left Olympic Plate Ring */}
        <div className="flex space-x-0.5 items-center">
          <div className="w-1.5 h-6 bg-gym-red rounded-sm shadow-glow-red animate-pulse" />
          <div className="w-2 h-8 bg-gym-blue rounded-sm" />
          <div className="w-2.5 h-10 bg-gym-yellow rounded-sm" />
        </div>

        {/* Steel Bar with moving racking weight */}
        <div className={`relative ${barWidth} ${barHeight} bg-gym-border rounded-full overflow-hidden border border-white/10`}>
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-gym-red via-orange-500 to-gym-red rounded-full animate-barbell-load" />
        </div>

        {/* Right Olympic Plate Ring */}
        <div className="flex space-x-0.5 items-center">
          <div className="w-2.5 h-10 bg-gym-yellow rounded-sm" />
          <div className="w-2 h-8 bg-gym-blue rounded-sm" />
          <div className="w-1.5 h-6 bg-gym-red rounded-sm shadow-glow-red animate-pulse" />
        </div>
      </div>

      {text && (
        <span className="text-xs uppercase tracking-widest text-gym-muted font-medium animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

export default BarbellLoader;
