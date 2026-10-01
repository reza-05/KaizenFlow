'use client';

import React from 'react';

interface ClashFlameProps {
  size?: number;
  className?: string;
}

export const ClashFlame: React.FC<ClashFlameProps> = ({ size = 14, className = '' }) => {
  return (
    <div
      className={`coc-flame-container ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 28"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible select-none pointer-events-none"
      >
        <defs>
          {/* Outer Roaring Flame: Deep Red to Blaze Orange */}
          <linearGradient id="cocOuterGrad" x1="12" y1="24" x2="12" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="35%" stopColor="#dc2626" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>

          {/* Mid Layer Flame: Fiery Orange to Golden Amber */}
          <linearGradient id="cocMidGrad" x1="12" y1="21" x2="12" y2="6" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Searing Inner Core: Gold to White-Hot Blaze */}
          <linearGradient id="cocCoreGrad" x1="12" y1="18" x2="12" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="55%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Floating Embers */}
          <radialGradient id="cocSparkGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </radialGradient>
        </defs>

        {/* 1. Outer Roaring Flame (Animated Wave & Lick) */}
        <path
          d="M 12 2.5 C 12 2.5 10.2 5.5 8.8 8 C 7.2 10.8 5 12.8 5 16 C 5 20.2 8.2 23 12 23 C 15.8 23 19 20.2 19 16 C 19 12.8 17.2 10.2 15.2 8.5 C 15.2 8.5 15.8 10.5 14.8 11.5 C 13.8 12.5 12.8 11.5 12.8 9.5 C 12.8 6.5 12 2.5 12 2.5 Z"
          fill="url(#cocOuterGrad)"
          className="coc-flame-outer"
        />

        {/* 2. Mid Dancing Flame Tongue */}
        <path
          d="M 12 7 C 12 7 10 9.8 9 12 C 8 14.2 8.2 16.5 9.8 18 C 11.2 19.5 12.8 19.5 14.2 18 C 15.8 16.5 16 14.2 15 12 C 14.2 10.2 13.2 8.8 12 7 Z"
          fill="url(#cocMidGrad)"
          className="coc-flame-mid"
        />

        {/* 3. Searing White-Hot Core */}
        <path
          d="M 12 11.5 C 12 11.5 10.5 13.5 10.5 15 C 10.5 16.8 11.2 17.5 12 17.5 C 12.8 17.5 13.5 16.8 13.5 15 C 13.5 13.5 12.8 12.5 12 11.5 Z"
          fill="url(#cocCoreGrad)"
          className="coc-flame-core"
        />

        {/* 4. Clash of Clans Floating Sparks / Embers */}
        <circle cx="11.5" cy="5" r="0.9" fill="url(#cocSparkGrad)" className="coc-spark-1" />
        <circle cx="14" cy="6.5" r="0.75" fill="url(#cocSparkGrad)" className="coc-spark-2" />
      </svg>
    </div>
  );
};
