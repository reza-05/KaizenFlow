'use client';

import React from 'react';

interface BadgeEmblemProps {
  badgeId: string;
  isUnlocked?: boolean;
  size?: number;
  className?: string;
}

export const BadgeEmblem: React.FC<BadgeEmblemProps> = ({
  badgeId,
  isUnlocked = true,
  size = 56,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label={`Badge emblem ${badgeId}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Clean, subtle, professional drop shadow (No neon glows) */}
          <filter id="clean-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.18" />
          </filter>

          {/* Professional Metallic & Mineral Gradients */}
          {/* Bronze (Tier 1) */}
          <linearGradient id="emblem-bronze" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="emblem-bronze-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Silver / Steel (Tier 2) */}
          <linearGradient id="emblem-silver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="emblem-silver-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Gold (Tier 3) */}
          <linearGradient id="emblem-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#facc15" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id="emblem-gold-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Sapphire / Platinum (Tier 4) */}
          <linearGradient id="emblem-sapphire" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="40%" stopColor="#3b82f6" />
            <stop offset="80%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="emblem-platinum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Amethyst / Royal Purple (Tier 5) */}
          <linearGradient id="emblem-amethyst" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="40%" stopColor="#a855f7" />
            <stop offset="80%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <linearGradient id="emblem-amethyst-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b0764" />
            <stop offset="100%" stopColor="#1e0538" />
          </linearGradient>

          {/* Emerald (Tier 6) */}
          <linearGradient id="emblem-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="35%" stopColor="#34d399" />
            <stop offset="75%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="emblem-emerald-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          {/* Crimson / Ruby */}
          <linearGradient id="emblem-ruby" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          {/* Amber Fire */}
          <linearGradient id="emblem-amber-flame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c2410c" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>

        {/* Outer Medal Container */}
        <g filter={isUnlocked ? 'url(#clean-soft-shadow)' : undefined}>
          {renderProfessionalArtwork(badgeId)}
        </g>

        {/* Locked Overlay: Dignified, frosted slate with centered padlock */}
        {!isUnlocked && (
          <g>
            <circle cx="50" cy="50" r="46" fill="#0f172a" opacity="0.75" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            {/* Minimalist Padlock */}
            <circle cx="50" cy="50" r="14" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            {/* Shackle */}
            <path
              d="M 45 47 L 45 43 C 45 40.2 47.2 38 50 38 C 52.8 38 55 40.2 55 43 L 55 47"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Lock Body */}
            <rect x="42" y="47" width="16" height="12" rx="2" fill="#475569" />
            {/* Keyhole */}
            <circle cx="50" cy="52" r="1.5" fill="#f8fafc" />
            <path d="M 49.3 52.5 L 50.7 52.5 L 51.2 55.5 L 48.8 55.5 Z" fill="#f8fafc" />
          </g>
        )}
      </svg>
    </div>
  );
};

// Render clean, professional, dignified academic achievement emblems
function renderProfessionalArtwork(badgeId: string) {
  switch (badgeId) {
    // ----------------------------------------------------
    // WATCHTIME BADGES (wt_10h to wt_500h)
    // ----------------------------------------------------

    // 10 Hours: Focus Foundation (Bronze Academic Medallion with Drafting Compass)
    case 'wt_10h':
      return (
        <g>
          {/* Bronze Rim & Core */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-bronze)" />
          <circle cx="50" cy="50" r="40" fill="#451a03" />
          <circle cx="50" cy="50" r="37" fill="#78350f" />
          {/* Inner Accent Ring */}
          <circle cx="50" cy="50" r="32" fill="none" stroke="#fef3c7" strokeWidth="1.5" opacity="0.6" />
          {/* Classical Drafting Compass / 4-Point Rose (Clean, No Ninja Star) */}
          <polygon points="50,22 53,47 50,50 47,47" fill="#ffffff" />
          <polygon points="50,78 53,53 50,50 47,53" fill="#f59e0b" />
          <polygon points="78,50 53,53 50,50 53,47" fill="#fde68a" />
          <polygon points="22,50 47,53 50,50 47,47" fill="#d97706" />
          {/* Center Brass Hub */}
          <circle cx="50" cy="50" r="5" fill="url(#emblem-bronze-light)" stroke="#451a03" strokeWidth="1" />
          <circle cx="50" cy="50" r="2" fill="#78350f" />
        </g>
      );

    // 25 Hours: Deep Dive Scholar (Silver Shield with Geometric Knowledge Slabs)
    case 'wt_25h':
      return (
        <g>
          {/* Silver Academic Shield */}
          <path
            d="M 50 8 C 76 8 86 16 86 42 C 86 70 64 88 50 94 C 36 88 14 70 14 42 C 14 16 24 8 50 8 Z"
            fill="url(#emblem-silver)"
          />
          <path
            d="M 50 12 C 72 12 82 19 82 42 C 82 66 62 83 50 88 C 38 83 18 66 18 42 C 18 19 28 12 50 12 Z"
            fill="url(#emblem-silver-dark)"
          />

          {/* Three Stacked Isometric Geometric Knowledge Slabs */}
          <g transform="translate(0, 14)">
            {/* Slab 1 (Base) */}
            <polygon points="50,48 74,36 50,24 26,36" fill="#3b82f6" />
            <polygon points="26,36 50,48 50,54 26,42" fill="#1d4ed8" />
            <polygon points="74,36 50,48 50,54 74,42" fill="#1e3a8a" />
          </g>
          <g transform="translate(0, 2)">
            {/* Slab 2 (Mid) */}
            <polygon points="50,46 74,34 50,22 26,34" fill="#60a5fa" />
            <polygon points="26,34 50,46 50,52 26,40" fill="#2563eb" />
            <polygon points="74,34 50,46 50,52 74,40" fill="#1d4ed8" />
          </g>
          <g transform="translate(0, -10)">
            {/* Slab 3 (Top with Specular Surface) */}
            <polygon points="50,44 74,32 50,20 26,32" fill="#93c5fd" />
            <polygon points="26,32 50,44 50,50 26,38" fill="#3b82f6" />
            <polygon points="74,32 50,44 50,50 74,38" fill="#1d4ed8" />
            <polygon points="50,44 64,37 50,30 36,37" fill="#ffffff" opacity="0.75" />
          </g>
        </g>
      );

    // 50 Hours: Endurance Virtuoso (Gold Medallion with Laurel & Energy Glyph)
    case 'wt_50h':
      return (
        <g>
          {/* Gold Medallion Base */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-gold)" />
          <circle cx="50" cy="50" r="40" fill="url(#emblem-gold-dark)" />
          <circle cx="50" cy="50" r="37" fill="#713f12" />

          {/* Laurel Branch Accents */}
          <g fill="#facc15" opacity="0.85">
            <path d="M 28 34 Q 22 42 28 50 Q 32 42 28 34 Z" />
            <path d="M 27 48 Q 21 56 29 62 Q 33 55 27 48 Z" />
            <path d="M 72 34 Q 78 42 72 50 Q 68 42 72 34 Z" />
            <path d="M 73 48 Q 79 56 71 62 Q 67 55 73 48 Z" />
          </g>

          {/* Clean Solid Geometric Lightning Glyph */}
          <polygon points="55,18 34,48 48,48 43,82 66,44 51,44" fill="url(#emblem-gold)" stroke="#ca8a04" strokeWidth="1" />
          <polygon points="55,18 47,44 43,82 45,50" fill="#ffffff" opacity="0.6" />
        </g>
      );

    // 100 Hours: 100-Hour Focus Milestone (Platinum & Sapphire Shield)
    case 'wt_100h':
      return (
        <g>
          {/* Classical Academic Shield */}
          <path
            d="M 50 6 C 76 6 88 16 88 44 C 88 74 66 90 50 96 C 34 90 12 74 12 44 C 12 16 24 6 50 6 Z"
            fill="url(#emblem-platinum)"
          />
          <path
            d="M 50 10 C 72 10 83 19 83 44 C 83 70 63 85 50 90 C 37 85 17 70 17 44 C 17 19 28 10 50 10 Z"
            fill="#0f172a"
          />
          <path
            d="M 50 14 C 68 14 78 22 78 44 C 78 66 60 80 50 85 C 40 80 22 66 22 44 C 22 22 32 14 50 14 Z"
            fill="url(#emblem-sapphire)"
          />

          {/* Central Heraldic Insignia */}
          <circle cx="50" cy="46" r="16" fill="#ffffff" stroke="#93c5fd" strokeWidth="2" />
          <text
            x="50"
            y="52"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="14"
            fill="#1e3a8a"
            textAnchor="middle"
          >
            100
          </text>
          <text
            x="50"
            y="72"
            fontFamily="sans-serif"
            fontWeight="800"
            fontSize="10"
            letterSpacing="2"
            fill="#ffffff"
            textAnchor="middle"
          >
            HOURS
          </text>
        </g>
      );

    // 250 Hours: 250-Hour Milestone (Regal Amethyst & Gold Medallion)
    case 'wt_250h':
      return (
        <g>
          {/* Amethyst Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-gold)" />
          <circle cx="50" cy="50" r="41" fill="url(#emblem-amethyst-dark)" />
          <circle cx="50" cy="50" r="38" fill="url(#emblem-amethyst)" />

          {/* Dignified Academic Coronet */}
          <g transform="translate(0, 4)">
            {/* Coronet Base Band */}
            <rect x="26" y="58" width="48" height="8" rx="2" fill="url(#emblem-gold)" stroke="#854d0e" strokeWidth="1" />
            <circle cx="34" cy="62" r="2" fill="#ffffff" />
            <circle cx="50" cy="62" r="2.5" fill="#fef08a" />
            <circle cx="66" cy="62" r="2" fill="#ffffff" />

            {/* 3 Classical Crown Peaks */}
            <path
              d="M 28 58 L 30 42 L 40 50 L 50 32 L 60 50 L 70 42 L 72 58 Z"
              fill="url(#emblem-gold)"
              stroke="#ca8a04"
              strokeWidth="1"
            />
            <circle cx="30" cy="40" r="2.5" fill="#ffffff" />
            <circle cx="50" cy="30" r="3.5" fill="#ffffff" />
            <circle cx="70" cy="40" r="2.5" fill="#ffffff" />
          </g>

          <text
            x="50"
            y="82"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="9"
            letterSpacing="1"
            fill="#fef08a"
            textAnchor="middle"
          >
            250 HOURS
          </text>
        </g>
      );

    // 500 Hours: 500-Hour Master Scholar (Dignified Emerald Medallion with Laurel, No Ninja Star)
    case 'wt_500h':
      return (
        <g>
          {/* Dignified Double-Rimmed Emerald Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-emerald)" />
          <circle cx="50" cy="50" r="41" fill="url(#emblem-emerald-dark)" />
          <circle cx="50" cy="50" r="38" fill="#064e3b" />

          {/* Classical Laurel Wreath Ring */}
          <g fill="#a7f3d0" opacity="0.9">
            <path d="M 26 34 C 18 46 18 64 28 74 C 20 64 20 48 26 36 Z" />
            <path d="M 74 34 C 82 46 82 64 72 74 C 80 64 80 48 74 36 Z" />
          </g>

          {/* Center Clean Academic Medal Hub */}
          <circle cx="50" cy="46" r="16" fill="url(#emblem-emerald)" stroke="#ffffff" strokeWidth="2" />
          <text
            x="50"
            y="52"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="14"
            fill="#022c22"
            textAnchor="middle"
          >
            500
          </text>
          <text
            x="50"
            y="72"
            fontFamily="sans-serif"
            fontWeight="800"
            fontSize="10"
            letterSpacing="2"
            fill="#a7f3d0"
            textAnchor="middle"
          >
            HOURS
          </text>
        </g>
      );

    // ----------------------------------------------------
    // STREAK BADGES (st_3d to st_100d)
    // ----------------------------------------------------

    // 3 Days: Ignition Spark (Clean Minimalist Flat Flame)
    case 'st_3d':
      return (
        <g>
          {/* Warm Amber Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-bronze)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="38" fill="#7c2d12" />

          {/* Clean Stylized Flame Tongue */}
          <path
            d="M 50 18 C 50 18 41 30 35 42 C 29 54 26 62 26 72 C 26 84 36 88 50 88 C 64 88 74 84 74 72 C 74 60 67 51 63 44 C 63 44 65 52 61 55 C 57 58 53 54 53 46 C 53 34 50 18 50 18 Z"
            fill="url(#emblem-amber-flame)"
          />
          {/* Inner Flame Core */}
          <path
            d="M 50 42 C 50 42 43 52 41 58 C 39 64 41 72 50 78 C 59 72 61 64 59 58 C 57 52 50 42 50 42 Z"
            fill="#fef08a"
          />
        </g>
      );

    // 7 Days: 7-Day Consistency (Steel Shield with Checkmark & 7 Stars)
    case 'st_7d':
      return (
        <g>
          {/* Steel Academic Shield */}
          <path
            d="M 50 8 C 76 8 86 16 86 42 C 86 70 64 88 50 94 C 36 88 14 70 14 42 C 14 16 24 8 50 8 Z"
            fill="url(#emblem-silver)"
          />
          <path
            d="M 50 12 C 72 12 82 19 82 42 C 82 66 62 83 50 88 C 38 83 18 66 18 42 C 18 19 28 12 50 12 Z"
            fill="#0f172a"
          />

          {/* Center Checkmark in Gold Circle */}
          <circle cx="50" cy="46" r="16" fill="url(#emblem-silver)" stroke="#ffffff" strokeWidth="2" />
          <path d="M 42 46 L 47 51 L 58 40" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          <text
            x="50"
            y="74"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="10"
            letterSpacing="2"
            fill="#ffffff"
            textAnchor="middle"
          >
            7 DAYS
          </text>
        </g>
      );

    // 14 Days: Fortitude Crest (Minimalist Elegant Hourglass)
    case 'st_14d':
      return (
        <g>
          {/* Gold Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-gold)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="38" fill="#713f12" />

          {/* Clean Hourglass Geometry */}
          <g transform="translate(0, 2)">
            {/* Top & Bottom Plates */}
            <rect x="32" y="24" width="36" height="5" rx="1.5" fill="#facc15" />
            <rect x="32" y="69" width="36" height="5" rx="1.5" fill="#facc15" />

            {/* Glass Bulb */}
            <path
              d="M 36 29 C 36 43 47 47 48 49 C 47 51 36 55 36 69 L 64 69 C 64 55 53 51 52 49 C 53 47 64 43 64 29 Z"
              fill="rgba(255, 255, 255, 0.2)"
              stroke="#fef08a"
              strokeWidth="2"
            />
            {/* Sand Pyramids */}
            <polygon points="38,33 62,33 50,46" fill="#fde047" />
            <polygon points="40,68 60,68 50,58" fill="#eab308" />
            <line x1="50" y1="46" x2="50" y2="58" stroke="#ffffff" strokeWidth="1.5" />
          </g>

          <text
            x="50"
            y="85"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="8"
            letterSpacing="1"
            fill="#fef08a"
            textAnchor="middle"
          >
            14 DAYS
          </text>
        </g>
      );

    // 30 Days: 30-Day Unbroken Streak (Sapphire Milestone Medal with Ribbon)
    case 'st_30d':
      return (
        <g>
          {/* Sapphire Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-sapphire)" />
          <circle cx="50" cy="50" r="41" fill="#0f172a" />
          <circle cx="50" cy="50" r="38" fill="url(#emblem-sapphire)" />

          {/* Calendar Check Icon */}
          <rect x="30" y="28" width="40" height="36" rx="4" fill="#ffffff" />
          <rect x="30" y="28" width="40" height="10" rx="4" fill="#1e3a8a" />
          <circle cx="38" cy="24" r="2.5" fill="#93c5fd" />
          <circle cx="62" cy="24" r="2.5" fill="#93c5fd" />
          <path d="M 40 48 L 47 54 L 60 41" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          <text
            x="50"
            y="78"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="10"
            letterSpacing="1"
            fill="#ffffff"
            textAnchor="middle"
          >
            30 DAYS
          </text>
        </g>
      );

    // 60 Days: Diamond Habit (Clean Geometric Faceted Gem)
    case 'st_60d':
      return (
        <g>
          {/* Amethyst Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-amethyst)" />
          <circle cx="50" cy="50" r="41" fill="#1e0538" />
          <circle cx="50" cy="50" r="38" fill="#3b0764" />

          {/* Clean Faceted Diamond */}
          <polygon points="32,36 68,36 80,48 20,48" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
          <polygon points="20,48 80,48 50,76" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
          <polygon points="40,36 60,36 66,48 50,76 34,48" fill="#e0f2fe" />
          <polygon points="45,36 55,36 57,48 50,68 43,48" fill="#ffffff" />

          <text
            x="50"
            y="87"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="8"
            letterSpacing="1"
            fill="#e9d5ff"
            textAnchor="middle"
          >
            60 DAYS
          </text>
        </g>
      );

    // 100 Days: 100-Day Study Streak (Gold Medal with Laurel & '100')
    case 'st_100d':
      return (
        <g>
          {/* Gold Academic Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-gold)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="38" fill="url(#emblem-gold)" />

          {/* Inner Ring with Laurel Accents */}
          <circle cx="50" cy="50" r="28" fill="#713f12" stroke="#fef08a" strokeWidth="2" />
          <text
            x="50"
            y="54"
            fontFamily="serif"
            fontWeight="900"
            fontSize="18"
            fill="#fef08a"
            textAnchor="middle"
          >
            100
          </text>
          <text
            x="50"
            y="65"
            fontFamily="sans-serif"
            fontWeight="800"
            fontSize="8"
            letterSpacing="1"
            fill="#ffffff"
            textAnchor="middle"
          >
            DAYS
          </text>
        </g>
      );

    // ----------------------------------------------------
    // COURSE MASTERY (cm_1c to cm_10c)
    // ----------------------------------------------------

    // 1 Course: First Syllabus Completed (Diploma Scroll with Wax Seal)
    case 'cm_1c':
      return (
        <g>
          {/* Bronze Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-bronze)" />
          <circle cx="50" cy="50" r="41" fill="#291305" />
          <circle cx="50" cy="50" r="38" fill="#78350f" />

          {/* Clean Academic Diploma Scroll */}
          <g transform="translate(0, 2)">
            <rect x="26" y="26" width="48" height="42" rx="2" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
            <line x1="32" y1="35" x2="68" y2="35" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="42" x2="68" y2="42" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="49" x2="52" y2="49" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />

            {/* Red Wax Seal */}
            <circle cx="60" cy="56" r="7" fill="url(#emblem-ruby)" stroke="#450a0a" strokeWidth="1" />
            <text x="60" y="59" fontFamily="sans-serif" fontWeight="900" fontSize="7" fill="#ffffff" textAnchor="middle">✓</text>
          </g>
        </g>
      );

    // 3 Courses: 3-Course Scholar (Stack of 3 Clean Textbooks)
    case 'cm_3c':
      return (
        <g>
          {/* Gold Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-gold)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="38" fill="#713f12" />

          {/* 3 Clean Stacked Textbooks */}
          <g transform="translate(0, 4)">
            {/* Book 1 (Bottom - Blue) */}
            <rect x="22" y="58" width="56" height="11" rx="2" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1" />
            <rect x="26" y="60" width="50" height="7" fill="#fef3c7" />

            {/* Book 2 (Middle - Emerald) */}
            <rect x="25" y="45" width="50" height="11" rx="2" fill="#047857" stroke="#064e3b" strokeWidth="1" />
            <rect x="29" y="47" width="44" height="7" fill="#fef3c7" />

            {/* Book 3 (Top - Crimson) */}
            <rect x="28" y="32" width="44" height="11" rx="2" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1" />
            <rect x="32" y="34" width="38" height="7" fill="#fef3c7" />
          </g>
        </g>
      );

    // 5 Courses: 5-Course Master (Classical Academic Trophy Cup)
    case 'cm_5c':
      return (
        <g>
          {/* Sapphire / Platinum Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-sapphire)" />
          <circle cx="50" cy="50" r="41" fill="#0f172a" />
          <circle cx="50" cy="50" r="38" fill="#1e3a8a" />

          {/* Clean Classical Trophy Cup */}
          <g transform="translate(0, 2)">
            {/* Trophy Pedestal */}
            <rect x="36" y="72" width="28" height="6" rx="1.5" fill="url(#emblem-gold)" stroke="#854d0e" strokeWidth="1" />
            <rect x="44" y="64" width="12" height="9" fill="url(#emblem-gold)" />

            {/* Handles */}
            <path d="M 32 32 C 20 32 20 50 32 50 L 32 45 C 24 45 24 37 32 37 Z" fill="url(#emblem-gold)" />
            <path d="M 68 32 C 80 32 80 50 68 50 L 68 45 C 76 45 76 37 68 37 Z" fill="url(#emblem-gold)" />

            {/* Cup Bowl */}
            <path
              d="M 30 26 L 70 26 L 66 48 C 66 58 58 64 50 64 C 42 64 34 58 34 48 Z"
              fill="url(#emblem-gold)"
              stroke="#ca8a04"
              strokeWidth="1"
            />
            <ellipse cx="50" cy="26" rx="20" ry="3.5" fill="#fef08a" />
            <text x="50" y="47" fontFamily="sans-serif" fontWeight="900" fontSize="11" fill="#713f12" textAnchor="middle">
              5
            </text>
          </g>
        </g>
      );

    // 10 Courses: 10-Course Decathlon (Emerald Medallion with Roman Numeral 'X')
    case 'cm_10c':
      return (
        <g>
          {/* Emerald Medallion */}
          <circle cx="50" cy="50" r="46" fill="url(#emblem-emerald)" />
          <circle cx="50" cy="50" r="41" fill="#022c22" />
          <circle cx="50" cy="50" r="38" fill="url(#emblem-emerald)" />

          {/* Laurel Wreath */}
          <circle cx="50" cy="50" r="26" fill="#064e3b" stroke="#a7f3d0" strokeWidth="2" />
          <text
            x="50"
            y="58"
            fontFamily="serif"
            fontWeight="900"
            fontSize="26"
            fill="#ffffff"
            textAnchor="middle"
          >
            X
          </text>
        </g>
      );

    // ----------------------------------------------------
    // FOCUS DISCIPLINE (dc_10s, dc_50s)
    // ----------------------------------------------------

    // 10 Lessons: Focus Practitioner (Clean Minimalist Focus Shield)
    case 'dc_10s':
      return (
        <g>
          <path
            d="M 50 8 C 76 8 86 16 86 42 C 86 70 64 88 50 94 C 36 88 14 70 14 42 C 14 16 24 8 50 8 Z"
            fill="url(#emblem-silver)"
          />
          <path
            d="M 50 12 C 72 12 82 19 82 42 C 82 66 62 83 50 88 C 38 83 18 66 18 42 C 18 19 28 12 50 12 Z"
            fill="#0f172a"
          />
          {/* Target Focus Ring */}
          <circle cx="50" cy="46" r="16" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="50" cy="46" r="9" fill="none" stroke="#93c5fd" strokeWidth="2" />
          <circle cx="50" cy="46" r="3.5" fill="#ffffff" />
        </g>
      );

    // 50 Lessons: Advanced Focus Discipline (Stone Fortress Crest)
    case 'dc_50s':
      return (
        <g>
          <circle cx="50" cy="50" r="46" fill="url(#emblem-amethyst)" />
          <circle cx="50" cy="50" r="41" fill="#1e0538" />
          <circle cx="50" cy="50" r="38" fill="#3b0764" />

          {/* Minimalist Castle Tower */}
          <g transform="translate(0, 4)">
            <polygon points="34,74 66,74 63,40 37,40" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            <rect x="34" y="32" width="7" height="9" fill="#cbd5e1" />
            <rect x="46" y="32" width="8" height="9" fill="#cbd5e1" />
            <rect x="59" y="32" width="7" height="9" fill="#cbd5e1" />
            <path d="M 45 74 L 45 62 C 45 59 47 57 50 57 C 53 57 55 59 55 62 L 55 74 Z" fill="#0f172a" />
          </g>
        </g>
      );

    // ----------------------------------------------------
    // STUDY NOTES (sc_25n, sc_100n)
    // ----------------------------------------------------

    // 25 Notes: Active Note Taker (Clean Pen & Document)
    case 'sc_25n':
      return (
        <g>
          <circle cx="50" cy="50" r="46" fill="url(#emblem-bronze)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="38" fill="#78350f" />

          {/* Document & Pen */}
          <rect x="28" y="26" width="34" height="46" rx="3" fill="#ffffff" stroke="#92400e" strokeWidth="1" />
          <line x1="34" y1="36" x2="54" y2="36" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="44" x2="54" y2="44" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="52" x2="48" y2="52" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />

          {/* Pen (Diagonal) */}
          <g transform="rotate(-35 60 48)">
            <rect x="56" y="22" width="6" height="38" rx="2" fill="url(#emblem-gold)" stroke="#854d0e" strokeWidth="1" />
            <polygon points="56,60 62,60 59,68" fill="#451a03" />
          </g>
        </g>
      );

    // 100 Notes: Research Note Archivist (Open Bound Ledger Codex)
    case 'sc_100n':
      return (
        <g>
          <circle cx="50" cy="50" r="46" fill="url(#emblem-gold)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="38" fill="#713f12" />

          {/* Open Bound Book */}
          <g transform="translate(0, 6)">
            {/* Pages Left & Right */}
            <path d="M 50 64 Q 26 62 18 52 L 18 28 Q 26 38 50 40 Z" fill="#ffffff" stroke="#ca8a04" strokeWidth="1" />
            <path d="M 50 64 Q 74 62 82 52 L 82 28 Q 74 38 50 40 Z" fill="#fef3c7" stroke="#ca8a04" strokeWidth="1" />

            {/* Spine */}
            <line x1="50" y1="38" x2="50" y2="65" stroke="#854d0e" strokeWidth="2" />
            {/* Lines */}
            <line x1="24" y1="36" x2="44" y2="37" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="42" x2="44" y2="43" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="48" x2="38" y2="49" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />

            <line x1="56" y1="37" x2="76" y2="36" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="56" y1="43" x2="76" y2="42" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="62" y1="49" x2="76" y2="48" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      );

    // Fallback Medal
    default:
      return (
        <g>
          <circle cx="50" cy="50" r="46" fill="url(#emblem-gold)" />
          <circle cx="50" cy="50" r="40" fill="#0f172a" />
          <circle cx="50" cy="50" r="37" fill="#713f12" />
          <circle cx="50" cy="50" r="16" fill="url(#emblem-gold)" />
          <text x="50" y="55" fontFamily="sans-serif" fontWeight="900" fontSize="12" fill="#451a03" textAnchor="middle">★</text>
        </g>
      );
  }
}
