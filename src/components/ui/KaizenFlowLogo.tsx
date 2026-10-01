'use client';

import React from 'react';

interface KaizenFlowLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const KaizenFlowLogo: React.FC<KaizenFlowLogoProps> = ({
  size = 32,
  showText = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Logo Mark: The Infinite Ascent (Kaizen Continuous Growth + Fluid Flow) */}
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-zinc-800 shadow-md group-hover:border-emerald-500/50 transition-all duration-300 overflow-hidden"
      >
        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute inset-0 bg-radial from-emerald-500/20 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[72%] h-[72%] relative z-10"
        >
          <defs>
            <linearGradient id="kfGradPrimary" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="kfGradAccent" x1="16" y1="8" x2="26" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Left Vertical Spine (Kaizen foundation) */}
          <path
            d="M8 6C8 4.89543 8.89543 4 10 4H11.5C12.6046 4 13.5 4.89543 13.5 6V26C13.5 27.1046 12.6046 28 11.5 28H10C8.89543 28 8 27.1046 8 26V6Z"
            fill="url(#kfGradPrimary)"
          />

          {/* Upward Flow Wing (Continuous Improvement) */}
          <path
            d="M13.5 16.5L21.8 7.8C22.6 6.9 24.1 7.5 24.1 8.7V10.8C24.1 11.6 23.7 12.3 23.1 12.8L16.8 18L13.5 16.5Z"
            fill="url(#kfGradAccent)"
          />

          {/* Momentum Flow Wing (Deep Focus Propulsion) */}
          <path
            d="M15.5 16L22.9 23.6C23.6 24.3 24.1 25.1 24.1 26.1V26.2C24.1 27.4 22.7 28.1 21.8 27.2L13.5 18.5L15.5 16Z"
            fill="url(#kfGradPrimary)"
          />

          {/* Central Nexus Core Spark */}
          <circle cx="14.5" cy="17" r="1.5" fill="#ecfdf5" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline tracking-tight font-sans">
            <span className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
              Kaizen
            </span>
            <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent ml-0.5">
              Flow
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium mt-0.5">
            Focus Operating System
          </span>
        </div>
      )}
    </div>
  );
};
