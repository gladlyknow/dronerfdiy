import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  activeDomain?: 'radio' | 'drone' | 'all';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  activeDomain = 'all',
  className = '',
}) => {
  const sizeMap: Record<string, { box: number; text: string; sub: string }> = {
    sm: { box: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 36, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 48, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 64, text: 'text-2xl', sub: 'text-sm' },
  };

  const isNumeric = typeof size === 'number';
  const currentSize = isNumeric 
    ? { box: size, text: size >= 48 ? 'text-xl' : size >= 36 ? 'text-base' : 'text-sm', sub: 'text-[10px]' }
    : (sizeMap[size] || sizeMap['md']);

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Cyberpunk / Precision Engineering Vector Badge */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-2xl p-1 shadow-lg transition-transform hover:scale-105"
        style={{
          width: currentSize.box,
          height: currentSize.box,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
          border: '1px solid rgba(249, 115, 22, 0.4)',
          boxShadow: '0 0 15px rgba(249, 115, 22, 0.25), inset 0 0 10px rgba(99, 102, 241, 0.2)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="droneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>

            <linearGradient id="rfGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Concentric Radio Wave Propagation Circles */}
          <circle cx="50" cy="50" r="42" stroke="#EA580C" strokeWidth="1" strokeDasharray="3,3" opacity="0.35" />
          <circle cx="50" cy="50" r="32" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4,4" opacity="0.45" />

          {/* Cross Rotor Arms (X-Frame FPV Carbon Fiber Chassis) */}
          <line x1="20" y1="20" x2="80" y2="80" stroke="url(#droneGrad)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="80" y1="20" x2="20" y2="80" stroke="url(#droneGrad)" strokeWidth="4.5" strokeLinecap="round" />

          {/* 4 Motors with Spinning Propeller Arcs */}
          {/* Top Left Motor */}
          <circle cx="20" cy="20" r="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
          <path d="M 14 20 A 6 6 0 0 1 26 20" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          
          {/* Top Right Motor */}
          <circle cx="80" cy="20" r="8" fill="#0F172A" stroke="#818CF8" strokeWidth="2.5" />
          <path d="M 74 20 A 6 6 0 0 1 86 20" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />

          {/* Bottom Left Motor */}
          <circle cx="20" cy="80" r="8" fill="#0F172A" stroke="#818CF8" strokeWidth="2.5" />
          <path d="M 14 80 A 6 6 0 0 1 26 80" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />

          {/* Bottom Right Motor */}
          <circle cx="80" cy="80" r="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
          <path d="M 74 80 A 6 6 0 0 1 86 80" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

          {/* Central Avionics FC / Radio Dipole Mast Hub */}
          <rect x="38" y="38" width="24" height="24" rx="6" fill="#1E293B" stroke="url(#rfGrad)" strokeWidth="2.5" />
          
          {/* Radio Antenna Center Mast with RF Pulse */}
          <line x1="50" y1="26" x2="50" y2="74" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" filter="url(#neonGlow)" />
          <line x1="32" y1="50" x2="68" y2="50" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
          
          {/* Glowing Center Core */}
          <circle cx="50" cy="50" r="4.5" fill="#F97316" />
          <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Text Identity */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <div className={`font-black tracking-tight font-mono flex items-center gap-1 text-slate-900 dark:text-white ${currentSize.text}`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-sky-400">
              DRONE
            </span>
            <span className="text-orange-500 font-extrabold">&</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">
              RADIO
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 ml-0.5">
              DIY
            </span>
          </div>
          <div className={`text-slate-500 dark:text-slate-400 font-mono tracking-wider font-semibold uppercase mt-0.5 ${currentSize.sub}`}>
            无人机穿越机 • 业余无线电 • DIY选型全景平台
          </div>
        </div>
      )}
    </div>
  );
};
