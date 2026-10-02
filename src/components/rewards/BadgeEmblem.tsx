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
      className={`relative inline-flex items-center justify-center select-none transition-transform duration-300 hover:scale-105 ${className}`}
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
          {/* Universal Shadow Filter */}
          <filter id="emblem-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.35" />
          </filter>
          <filter id="emblem-glow-gold" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.5" />
          </filter>
          <filter id="emblem-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.5" />
          </filter>
          <filter id="emblem-glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.5" />
          </filter>
          <filter id="emblem-glow-fire" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f97316" floodOpacity="0.5" />
          </filter>

          {/* Gradients */}
          {/* Bronze Gradients */}
          <linearGradient id="grad-bronze-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <radialGradient id="grad-bronze-core" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>

          {/* Silver / Steel Gradients */}
          <linearGradient id="grad-silver-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <radialGradient id="grad-silver-core" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>

          {/* Gold Gradients */}
          <linearGradient id="grad-gold-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#facc15" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <radialGradient id="grad-gold-core" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="30%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>

          {/* Platinum / Astral Cyan */}
          <linearGradient id="grad-plat-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <radialGradient id="grad-plat-core" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#cffafe" />
            <stop offset="45%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Obsidian / Royal Amethyst */}
          <linearGradient id="grad-obsidian-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="40%" stopColor="#a855f7" />
            <stop offset="75%" stopColor="#6b21a8" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>
          <radialGradient id="grad-obsidian-core" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="40%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#180828" />
          </radialGradient>

          {/* Emerald / Mythic Jade */}
          <linearGradient id="grad-emerald-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="35%" stopColor="#34d399" />
            <stop offset="70%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <radialGradient id="grad-emerald-core" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="35%" stopColor="#10b981" />
            <stop offset="80%" stopColor="#047857" />
            <stop offset="100%" stopColor="#022c22" />
          </radialGradient>

          {/* Fire / Inferno */}
          <linearGradient id="grad-fire" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="30%" stopColor="#ea580c" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>
          <radialGradient id="grad-fire-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fde047" />
            <stop offset="80%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>

          {/* Ruby / Crimson */}
          <radialGradient id="grad-ruby" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="45%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#4c0519" />
          </radialGradient>
        </defs>

        {/* Outer Shield / Disc Frame container */}
        <g filter={isUnlocked ? 'url(#emblem-shadow)' : undefined}>
          {renderEmblemArtwork(badgeId)}
        </g>

        {/* Locked Veil Overlay (Tasteful desaturated glass + subtle lock emblem) */}
        {!isUnlocked && (
          <g>
            <circle cx="50" cy="50" r="46" fill="#0f172a" opacity="0.65" />
            {/* Small Elegant Center Lock Pip */}
            <circle cx="50" cy="50" r="14" fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            {/* Lock shackle */}
            <path
              d="M 45 48 L 45 44 C 45 41.2 47.2 39 50 39 C 52.8 39 55 41.2 55 44 L 55 48"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Lock body */}
            <rect x="42" y="47" width="16" height="12" rx="2.5" fill="#334155" stroke="#64748b" strokeWidth="1" />
            {/* Keyhole */}
            <circle cx="50" cy="52" r="1.5" fill="#f8fafc" />
            <path d="M 49.3 52.5 L 50.7 52.5 L 51.2 55.5 L 48.8 55.5 Z" fill="#f8fafc" />
          </g>
        )}
      </svg>
    </div>
  );
};

// Helper renderer for each badge ID with custom, handcrafted vector geometry
function renderEmblemArtwork(badgeId: string) {
  switch (badgeId) {
    // ----------------------------------------------------
    // WATCHTIME BADGES (wt_10h to wt_500h)
    // ----------------------------------------------------

    // 10 Hours: Focus Foundation (Nautical Bronze Compass)
    case 'wt_10h':
      return (
        <g>
          {/* Beveled Outer Gear/Bronze Rim */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-bronze-metal)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="39" fill="url(#grad-bronze-core)" />
          {/* Compass Rose Ring */}
          <circle cx="50" cy="50" r="32" fill="none" stroke="#fed7aa" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* 8-Point Compass Star */}
          {/* North Point (Light Facet) */}
          <polygon points="50,16 50,50 43,45" fill="#ffffff" />
          <polygon points="50,16 50,50 57,45" fill="#d97706" />
          {/* South Point */}
          <polygon points="50,84 50,50 57,55" fill="#78350f" />
          <polygon points="50,84 50,50 43,55" fill="#b45309" />
          {/* East Point */}
          <polygon points="84,50 50,50 55,43" fill="#f59e0b" />
          <polygon points="84,50 50,50 55,57" fill="#78350f" />
          {/* West Point */}
          <polygon points="16,50 50,50 45,57" fill="#d97706" />
          <polygon points="16,50 50,50 45,43" fill="#fed7aa" />
          {/* Brass Center Pivot */}
          <circle cx="50" cy="50" r="6" fill="#fef08a" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="2.5" fill="#ea580c" />
        </g>
      );

    // 25 Hours: Deep Dive Scholar (Prismatic Sapphire & Cyan Crystal Layers)
    case 'wt_25h':
      return (
        <g>
          {/* Hexagonal Silver Shield Frame */}
          <polygon points="50,4 90,26 90,74 50,96 10,74 10,26" fill="url(#grad-silver-metal)" />
          <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" fill="#0f172a" />
          <polygon points="50,12 82,31 82,69 50,88 18,69 18,31" fill="url(#grad-plat-core)" />

          {/* 3 Isometric Floating Crystal Slabs (Layers of Mastery) */}
          {/* Bottom Slab */}
          <g transform="translate(0, 16)">
            <polygon points="50,48 76,35 50,22 24,35" fill="#0284c7" />
            <polygon points="24,35 50,48 50,54 24,41" fill="#0369a1" />
            <polygon points="76,35 50,48 50,54 76,41" fill="#075985" />
          </g>
          {/* Middle Slab */}
          <g transform="translate(0, 4)">
            <polygon points="50,46 76,33 50,20 24,33" fill="#06b6d4" />
            <polygon points="24,33 50,46 50,52 24,39" fill="#0891b2" />
            <polygon points="76,33 50,46 50,52 76,39" fill="#0e7490" />
          </g>
          {/* Top Floating Diamond Slab with Specular Light */}
          <g transform="translate(0, -8)">
            <polygon points="50,44 76,31 50,18 24,31" fill="#38bdf8" />
            <polygon points="24,31 50,44 50,50 24,37" fill="#0284c7" />
            <polygon points="76,31 50,44 50,50 76,37" fill="#0369a1" />
            <polygon points="50,44 64,37 50,30 36,37" fill="#e0f2fe" opacity="0.85" />
          </g>
          {/* Specular Star Flare */}
          <circle cx="50" cy="22" r="2.5" fill="#ffffff" filter="url(#emblem-glow-cyan)" />
        </g>
      );

    // 50 Hours: Endurance Virtuoso (Golden Sunburst Chrono Lightning)
    case 'wt_50h':
      return (
        <g>
          {/* Circular Sunburst Frame */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-gold-metal)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-gold-core)" />

          {/* Chronometer Sun Rays */}
          <g stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.7">
            <line x1="50" y1="16" x2="50" y2="21" />
            <line x1="50" y1="79" x2="50" y2="84" />
            <line x1="16" y1="50" x2="21" y2="50" />
            <line x1="79" y1="50" x2="84" y2="50" />
            <line x1="26" y1="26" x2="30" y2="30" />
            <line x1="74" y1="26" x2="70" y2="30" />
            <line x1="26" y1="74" x2="30" y2="70" />
            <line x1="74" y1="74" x2="70" y2="70" />
          </g>

          {/* Inner Golden Ring */}
          <circle cx="50" cy="50" r="27" fill="none" stroke="#fef08a" strokeWidth="2.5" />

          {/* 3D Beveled Golden Lightning Bolt */}
          <g filter="url(#emblem-glow-gold)">
            {/* Shadow Bolt */}
            <polygon points="56,16 32,50 49,50 41,84 68,44 51,44" fill="#854d0e" />
            {/* Front Highlights */}
            <polygon points="55,17 34,49 48,49 42,81 65,45 50,45" fill="url(#grad-gold-metal)" />
            <polygon points="55,17 48,45 42,81 44,52" fill="#ffffff" opacity="0.6" />
          </g>
        </g>
      );

    // 100 Hours: Centurion of Focus (Platinum & Amethyst Spartan Aegis)
    case 'wt_100h':
      return (
        <g>
          {/* Classical Roman Shield Crest */}
          <path
            d="M 50 6 C 76 6 88 16 88 44 C 88 74 66 90 50 96 C 34 90 12 74 12 44 C 12 16 24 6 50 6 Z"
            fill="url(#grad-plat-metal)"
          />
          <path
            d="M 50 10 C 72 10 83 19 83 44 C 83 70 63 85 50 90 C 37 85 17 70 17 44 C 17 19 28 10 50 10 Z"
            fill="#0f172a"
          />
          <path
            d="M 50 14 C 68 14 78 22 78 44 C 78 66 60 80 50 85 C 40 80 22 66 22 44 C 22 22 32 14 50 14 Z"
            fill="url(#grad-obsidian-core)"
          />

          {/* Golden Laurel Wreath Embellishments */}
          <g fill="#facc15" opacity="0.9">
            <path d="M 32 36 Q 26 44 32 52 Q 35 44 32 36 Z" />
            <path d="M 33 50 Q 28 58 35 64 Q 38 57 33 50 Z" />
            <path d="M 68 36 Q 74 44 68 52 Q 65 44 68 36 Z" />
            <path d="M 67 50 Q 72 58 65 64 Q 62 57 67 50 Z" />
          </g>

          {/* Center 100 Centurion Star & Aegis Boss */}
          <circle cx="50" cy="46" r="16" fill="url(#grad-plat-metal)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="50" cy="46" r="13" fill="#3b82f6" />
          <polygon
            points="50,35 53,42 61,43 55,48 57,56 50,51 43,56 45,48 39,43 47,42"
            fill="#ffffff"
            filter="url(#emblem-glow-cyan)"
          />
          {/* Centurion Roman Numerals 'C' (100) */}
          <text
            x="50"
            y="76"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="10"
            letterSpacing="2"
            fill="#e0e7ff"
            textAnchor="middle"
          >
            100H
          </text>
        </g>
      );

    // 250 Hours: Polymath Sovereign (Imperial Crown of Alexandria)
    case 'wt_250h':
      return (
        <g>
          {/* Octagonal Imperial Seal */}
          <polygon points="50,4 82,14 96,46 86,78 50,96 14,78 4,46 18,14" fill="url(#grad-obsidian-metal)" />
          <polygon points="50,8 79,17 92,46 82,75 50,91 18,75 8,46 21,17" fill="#1e1035" />
          <polygon points="50,12 76,20 88,46 79,72 50,87 21,72 12,46 24,20" fill="url(#grad-obsidian-core)" />

          {/* Royal Imperial Golden Crown */}
          <g transform="translate(0, 4)">
            {/* Crown Base Band */}
            <path d="M 22 62 Q 50 67 78 62 L 77 69 Q 50 74 23 69 Z" fill="url(#grad-gold-metal)" />
            {/* Crown Jewels on Band */}
            <circle cx="34" cy="65" r="2.5" fill="url(#grad-ruby)" />
            <circle cx="50" cy="67" r="3.2" fill="url(#grad-emerald-metal)" />
            <circle cx="66" cy="65" r="2.5" fill="url(#grad-ruby)" />

            {/* 5 Crown Peaks with Velvet Backing */}
            <path
              d="M 23 62 L 24 45 L 36 53 L 50 33 L 64 53 L 76 45 L 77 62 Q 50 67 23 62 Z"
              fill="url(#grad-gold-metal)"
              stroke="#ca8a04"
              strokeWidth="1"
            />
            {/* Peak Pearls */}
            <circle cx="24" cy="44" r="3" fill="#ffffff" />
            <circle cx="36" cy="52" r="2.5" fill="#fef08a" />
            <circle cx="50" cy="31" r="4.5" fill="#ffffff" filter="url(#emblem-glow-gold)" />
            <circle cx="64" cy="52" r="2.5" fill="#fef08a" />
            <circle cx="76" cy="44" r="3" fill="#ffffff" />

            {/* Radiant Starburst above crown */}
            <circle cx="50" cy="22" r="2" fill="#ffffff" />
          </g>
        </g>
      );

    // 500 Hours: Kaizen Legend (Mythic Emerald Supernova)
    case 'wt_500h':
      return (
        <g>
          {/* Dual 8-Point Cosmic Star Base */}
          <polygon
            points="50,2 62,26 88,14 76,40 100,50 76,60 88,86 62,74 50,98 38,74 12,86 24,60 0,50 24,40 12,14 38,26"
            fill="url(#grad-emerald-metal)"
          />
          <circle cx="50" cy="50" r="38" fill="#022c22" />
          <circle cx="50" cy="50" r="35" fill="url(#grad-emerald-core)" />

          {/* Celestial Orbital Rings */}
          <ellipse
            cx="50"
            cy="50"
            rx="30"
            ry="11"
            fill="none"
            stroke="#a7f3d0"
            strokeWidth="1.8"
            transform="rotate(-28 50 50)"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="30"
            ry="11"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="1.5"
            transform="rotate(35 50 50)"
          />

          {/* Central Prismatic Grandmaster Diamond */}
          <polygon
            points="50,26 67,50 50,74 33,50"
            fill="#ecfdf5"
            stroke="#34d399"
            strokeWidth="2"
            filter="url(#emblem-glow-emerald)"
          />
          {/* Inner Facets */}
          <polygon points="50,26 50,74 33,50" fill="#a7f3d0" opacity="0.7" />
          <polygon points="50,38 58,50 50,62 42,50" fill="#ffffff" />
        </g>
      );

    // ----------------------------------------------------
    // STREAK BADGES (st_3d to st_100d)
    // ----------------------------------------------------

    // 3 Days: Ignition Spark (Clash-Style Fiery Tongue & Ember Core)
    case 'st_3d':
      return (
        <g>
          {/* Circular Ember Bezel */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-fire)" />
          <circle cx="50" cy="50" r="41" fill="#450a0a" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-bronze-core)" />

          {/* Triple Roaring Fire Tongues */}
          <g filter="url(#emblem-glow-fire)">
            {/* Outer Flame (Crimson to Blaze Orange) */}
            <path
              d="M 50 14 C 50 14 42 27 36 38 C 30 50 24 58 24 70 C 24 85 36 90 50 90 C 64 90 76 85 76 70 C 76 58 70 48 64 40 C 64 40 66 48 62 52 C 58 56 54 52 54 44 C 54 31 50 14 50 14 Z"
              fill="url(#grad-fire)"
            />
            {/* Mid Flame (Amber Gold) */}
            <path
              d="M 50 30 C 50 30 43 42 39 51 C 35 60 36 68 42 75 C 47 80 53 80 58 75 C 64 69 64 60 61 51 C 58 44 54 37 50 30 Z"
              fill="url(#grad-gold-metal)"
            />
            {/* Searing Core Flame (White Hot) */}
            <path
              d="M 50 48 C 50 48 45 56 45 62 C 45 69 47 72 50 72 C 53 72 55 69 55 62 C 55 56 50 48 50 48 Z"
              fill="#ffffff"
            />
            {/* Floating Sparks */}
            <circle cx="48" cy="22" r="3" fill="#fef08a" />
            <circle cx="58" cy="28" r="2.2" fill="#fed7aa" />
          </g>
        </g>
      );

    // 7 Days: Iron Discipline (Crossed Damascus Swords & Steel Buckler)
    case 'st_7d':
      return (
        <g>
          {/* Iron Buckler Frame */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-silver-metal)" />
          <circle cx="50" cy="50" r="41" fill="#0f172a" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-silver-core)" />

          {/* Crossed Dual Swords */}
          <g stroke="#ffffff" strokeWidth="1.5">
            {/* Blade 1 (NW to SE) */}
            <line x1="20" y1="20" x2="80" y2="80" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
            <line x1="24" y1="24" x2="76" y2="76" stroke="#ffffff" strokeWidth="1.5" />
            {/* Blade 1 Hilt */}
            <line x1="16" y1="28" x2="28" y2="16" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
            <circle cx="16" cy="16" r="3.5" fill="#facc15" />

            {/* Blade 2 (NE to SW) */}
            <line x1="80" y1="20" x2="20" y2="80" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            <line x1="76" y1="24" x2="24" y2="76" stroke="#f8fafc" strokeWidth="1.5" />
            {/* Blade 2 Hilt */}
            <line x1="72" y1="16" x2="84" y2="28" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
            <circle cx="84" cy="16" r="3.5" fill="#facc15" />
          </g>

          {/* Center Steel Boss with 7 Rivets */}
          <circle cx="50" cy="50" r="18" fill="url(#grad-silver-metal)" stroke="#475569" strokeWidth="2" />
          <circle cx="50" cy="50" r="13" fill="#1e293b" />
          <text
            x="50"
            y="54"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="12"
            fill="#ffffff"
            textAnchor="middle"
          >
            7D
          </text>
        </g>
      );

    // 14 Days: Fortitude Crest (Golden Hourglass of Persistence)
    case 'st_14d':
      return (
        <g>
          {/* Diamond Gold Frame */}
          <polygon points="50,4 96,50 50,96 4,50" fill="url(#grad-gold-metal)" />
          <polygon points="50,9 91,50 50,91 9,50" fill="#451a03" />
          <polygon points="50,13 87,50 50,87 13,50" fill="url(#grad-gold-core)" />

          {/* Ornate Brass & Glass Hourglass */}
          <g transform="translate(0, 2)">
            {/* Top & Bottom Brass Pedestals */}
            <rect x="32" y="24" width="36" height="5" rx="2" fill="url(#grad-gold-metal)" stroke="#78350f" strokeWidth="1" />
            <rect x="32" y="69" width="36" height="5" rx="2" fill="url(#grad-gold-metal)" stroke="#78350f" strokeWidth="1" />

            {/* Glass Bulb Outline */}
            <path
              d="M 36 29 C 36 43 47 47 48 49 C 47 51 36 55 36 69 L 64 69 C 64 55 53 51 52 49 C 53 47 64 43 64 29 Z"
              fill="rgba(255, 255, 255, 0.25)"
              stroke="#fef08a"
              strokeWidth="2"
            />

            {/* Upper Sand Chamber */}
            <polygon points="38,32 62,32 50,46" fill="#facc15" />
            {/* Falling Sand Stream */}
            <line x1="50" y1="46" x2="50" y2="61" stroke="#fef08a" strokeWidth="1.8" strokeDasharray="2 2" />
            {/* Lower Accumulated Sand Pyramid */}
            <polygon points="40,68 60,68 50,58" fill="#eab308" />
            {/* Glowing Golden Sands Aura */}
            <circle cx="50" cy="49" r="3" fill="#ffffff" filter="url(#emblem-glow-gold)" />
          </g>
        </g>
      );

    // 30 Days: Unstoppable Momentum (Astral Meteor & Sonic Rings)
    case 'st_30d':
      return (
        <g>
          {/* Circular Platinum Bezel */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-plat-metal)" />
          <circle cx="50" cy="50" r="41" fill="#0f172a" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-plat-core)" />

          {/* Triple Speed Orbit Rings */}
          <ellipse cx="50" cy="50" rx="34" ry="12" fill="none" stroke="#38bdf8" strokeWidth="2" transform="rotate(-30 50 50)" opacity="0.6" />
          <ellipse cx="50" cy="50" rx="34" ry="12" fill="none" stroke="#818cf8" strokeWidth="2" transform="rotate(30 50 50)" opacity="0.6" />

          {/* Blazing Blue/Violet Meteor Core */}
          <g filter="url(#emblem-glow-cyan)">
            {/* Tail */}
            <polygon points="20,80 38,62 62,38 78,22 55,48 35,68" fill="url(#grad-plat-metal)" />
            {/* Head */}
            <circle cx="68" cy="32" r="14" fill="#38bdf8" />
            <circle cx="68" cy="32" r="9" fill="#ffffff" />
          </g>

          <text
            x="50"
            y="76"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="11"
            fill="#ffffff"
            textAnchor="middle"
          >
            30 DAYS
          </text>
        </g>
      );

    // 60 Days: Diamond Habit (Brilliant-Cut Faceted Crystal)
    case 'st_60d':
      return (
        <g>
          {/* Hexagonal Amethyst Rim */}
          <polygon points="50,4 90,26 90,74 50,96 10,74 10,26" fill="url(#grad-obsidian-metal)" />
          <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" fill="#1e1035" />
          <polygon points="50,12 82,31 82,69 50,88 18,69 18,31" fill="url(#grad-obsidian-core)" />

          {/* Large Brilliant Faceted Diamond */}
          <g filter="url(#emblem-glow-cyan)">
            {/* Crown (Top trapezoid) */}
            <polygon points="30,36 70,36 82,49 18,49" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
            {/* Pavilion (Bottom triangle pointing down) */}
            <polygon points="18,49 82,49 50,78" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            {/* Center Diamond Facet */}
            <polygon points="40,36 60,36 68,49 50,78 32,49" fill="#e0f2fe" />
            {/* Inner Glint */}
            <polygon points="45,36 55,36 58,49 50,68 42,49" fill="#ffffff" />
            {/* Star Sparkle on Upper Left Tip */}
            <circle cx="28" cy="36" r="3" fill="#ffffff" />
          </g>
        </g>
      );

    // 100 Days: Kaizen Centurion (Golden Roman Helmet & Red Crest)
    case 'st_100d':
      return (
        <g>
          {/* Laurel Medal Border */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-gold-metal)" />
          <circle cx="50" cy="50" r="41" fill="#450a0a" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-gold-core)" />

          {/* Roman Centurion Helmet */}
          <g transform="translate(0, -2)">
            {/* Red Horsehair Crest Plumage */}
            <path
              d="M 22 36 C 22 20 40 12 50 12 C 60 12 78 20 78 36 C 74 33 62 30 50 30 C 38 30 26 33 22 36 Z"
              fill="url(#grad-fire)"
              stroke="#b91c1c"
              strokeWidth="1.5"
            />
            {/* Crest Plume Feathers texture */}
            <path d="M 32 23 L 34 31 M 42 18 L 43 30 M 50 16 L 50 30 M 58 18 L 57 30 M 66 23 L 64 31" stroke="#fef08a" strokeWidth="1.5" />

            {/* Golden Helmet Dome */}
            <path
              d="M 27 38 C 27 28 38 27 50 27 C 62 27 73 28 73 38 L 73 54 C 73 60 66 64 50 64 C 34 64 27 60 27 54 Z"
              fill="url(#grad-gold-metal)"
              stroke="#78350f"
              strokeWidth="1.5"
            />

            {/* Cheek Guards */}
            <path d="M 30 50 L 33 68 L 40 64 L 38 50 Z" fill="url(#grad-gold-metal)" stroke="#78350f" strokeWidth="1" />
            <path d="M 70 50 L 67 68 L 60 64 L 62 50 Z" fill="url(#grad-gold-metal)" stroke="#78350f" strokeWidth="1" />

            {/* Eye T-Visor slit */}
            <rect x="36" y="46" width="28" height="6" rx="2" fill="#1c1917" />
            <rect x="47" y="46" width="6" height="15" fill="#1c1917" />

            {/* Centurion 100 Medal Label */}
            <circle cx="50" cy="78" r="9" fill="url(#grad-gold-metal)" stroke="#78350f" strokeWidth="1.5" />
            <text x="50" y="81.5" fontFamily="sans-serif" fontWeight="900" fontSize="8" fill="#451a03" textAnchor="middle">
              100
            </text>
          </g>
        </g>
      );

    // ----------------------------------------------------
    // COURSE MASTERY (cm_1c to cm_10c)
    // ----------------------------------------------------

    // 1 Course: First Syllabus Conquered (Ancient Scroll & Red Wax Seal)
    case 'cm_1c':
      return (
        <g>
          {/* Bronze Academic Seal */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-bronze-metal)" />
          <circle cx="50" cy="50" r="41" fill="#291305" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-bronze-core)" />

          {/* Parchment Scroll */}
          <g transform="translate(0, 2)">
            {/* Scroll Rollers (Wooden dowels) */}
            <rect x="22" y="24" width="56" height="6" rx="2" fill="#78350f" />
            <rect x="22" y="66" width="56" height="6" rx="2" fill="#78350f" />
            <circle cx="22" cy="27" r="4" fill="#d97706" />
            <circle cx="78" cy="27" r="4" fill="#d97706" />
            <circle cx="22" cy="69" r="4" fill="#d97706" />
            <circle cx="78" cy="69" r="4" fill="#d97706" />

            {/* Parchment Paper */}
            <rect x="26" y="28" width="48" height="40" rx="2" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
            {/* Written Lines */}
            <line x1="32" y1="36" x2="68" y2="36" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="43" x2="68" y2="43" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="50" x2="54" y2="50" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />

            {/* Crimson Wax Seal with Ribbon */}
            <path d="M 58 56 L 53 72 L 60 67 L 67 72 L 62 56 Z" fill="#991b1b" />
            <circle cx="60" cy="57" r="8" fill="url(#grad-ruby)" stroke="#450a0a" strokeWidth="1" />
            <circle cx="60" cy="57" r="5" fill="#e11d48" />
            <text x="60" y="60" fontFamily="sans-serif" fontWeight="900" fontSize="7" fill="#ffffff" textAnchor="middle">✓</text>
          </g>
        </g>
      );

    // 3 Courses: Multi-Domain Scholar (Stack of 3 Tome Grimoires)
    case 'cm_3c':
      return (
        <g>
          {/* Gold Wreath Base */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-gold-metal)" />
          <circle cx="50" cy="50" r="41" fill="#1e1b4b" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-gold-core)" />

          {/* 3 Stacked Illustrated Hardcover Books */}
          <g transform="translate(0, 4)">
            {/* Book 1: Emerald (Bottom) */}
            <rect x="20" y="58" width="60" height="13" rx="2.5" fill="#047857" stroke="#064e3b" strokeWidth="1.5" />
            <rect x="24" y="61" width="52" height="7" fill="#fef3c7" />
            <rect x="18" y="58" width="6" height="13" rx="2" fill="#065f46" />

            {/* Book 2: Sapphire (Middle) */}
            <rect x="24" y="44" width="52" height="13" rx="2.5" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1.5" />
            <rect x="28" y="47" width="44" height="7" fill="#fef3c7" />
            <rect x="22" y="44" width="6" height="13" rx="2" fill="#1e40af" />
            <line x1="38" y1="50" x2="48" y2="50" stroke="#facc15" strokeWidth="1.5" />

            {/* Book 3: Ruby (Top) */}
            <rect x="28" y="30" width="44" height="13" rx="2.5" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
            <rect x="32" y="33" width="36" height="7" fill="#fef3c7" />
            <rect x="26" y="30" width="6" height="13" rx="2" fill="#991b1b" />
            {/* Golden Bookmark Ribbon Hanging Down */}
            <path d="M 64 30 L 64 52 L 67 48 L 70 52 L 70 30 Z" fill="#facc15" />
          </g>
        </g>
      );

    // 5 Courses: Master of Curriculums (Grand Classical Trophy Cup)
    case 'cm_5c':
      return (
        <g>
          {/* Platinum Octagonal Base */}
          <polygon points="50,4 82,14 96,46 86,78 50,96 14,78 4,46 18,14" fill="url(#grad-plat-metal)" />
          <polygon points="50,8 79,17 92,46 82,75 50,91 18,75 8,46 21,17" fill="#0f172a" />
          <polygon points="50,12 76,20 88,46 79,72 50,87 21,72 12,46 24,20" fill="url(#grad-plat-core)" />

          {/* Grand Golden Trophy Chalice */}
          <g filter="url(#emblem-glow-gold)" transform="translate(0, 1)">
            {/* Trophy Pedestal Base */}
            <rect x="34" y="74" width="32" height="8" rx="2" fill="url(#grad-gold-metal)" stroke="#78350f" strokeWidth="1" />
            <rect x="42" y="65" width="16" height="10" fill="url(#grad-gold-metal)" />

            {/* Trophy Handles (Left and Right) */}
            <path
              d="M 32 32 C 16 32 16 54 32 54 L 32 48 C 22 48 22 38 32 38 Z"
              fill="url(#grad-gold-metal)"
            />
            <path
              d="M 68 32 C 84 32 84 54 68 54 L 68 48 C 78 48 78 38 68 38 Z"
              fill="url(#grad-gold-metal)"
            />

            {/* Cup Bowl */}
            <path
              d="M 30 24 L 70 24 L 66 48 C 66 60 58 66 50 66 C 42 66 34 60 34 48 Z"
              fill="url(#grad-gold-metal)"
              stroke="#ca8a04"
              strokeWidth="1"
            />
            <ellipse cx="50" cy="24" rx="20" ry="4" fill="#fef08a" />

            {/* 5 Engraved Stars on Cup */}
            <g fill="#78350f">
              <circle cx="42" cy="40" r="1.8" />
              <circle cx="46" cy="44" r="1.8" />
              <circle cx="50" cy="40" r="2.2" />
              <circle cx="54" cy="44" r="1.8" />
              <circle cx="58" cy="40" r="1.8" />
            </g>
          </g>
        </g>
      );

    // 10 Courses: Decathlon Polymath (Olympian Starburst Laurel Crown)
    case 'cm_10c':
      return (
        <g>
          {/* Emerald & Gold Radial Starburst */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-emerald-metal)" />
          <circle cx="50" cy="50" r="41" fill="#022c22" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-emerald-core)" />

          {/* Dual Golden Laurel Wreath */}
          <g fill="url(#grad-gold-metal)">
            <path d="M 32 26 C 24 38 24 64 36 74 C 28 64 28 40 36 28 Z" />
            <path d="M 68 26 C 76 38 76 64 64 74 C 72 64 72 40 64 28 Z" />
          </g>

          {/* Roman Numeral 'X' (10 Curriculums) in Mythic Gold */}
          <g filter="url(#emblem-glow-gold)">
            <text
              x="50"
              y="60"
              fontFamily="sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="url(#grad-gold-metal)"
              stroke="#713f12"
              strokeWidth="1.5"
              textAnchor="middle"
            >
              X
            </text>
          </g>

          {/* 10 Gems Arranged around perimeter */}
          <g fill="#34d399">
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => (
              <circle
                key={i}
                cx={50 + 35 * Math.cos((deg * Math.PI) / 180)}
                cy={50 + 35 * Math.sin((deg * Math.PI) / 180)}
                r="2.5"
                fill="#fef08a"
              />
            ))}
          </g>
        </g>
      );

    // ----------------------------------------------------
    // FOCUS DISCIPLINE (dc_10s to dc_50s)
    // ----------------------------------------------------

    // 10 Lessons: Zero Distraction Warden (High-Tech Forcefield Aegis)
    case 'dc_10s':
      return (
        <g>
          {/* Cyber Shield Frame */}
          <polygon points="50,6 88,22 88,58 50,94 12,58 12,22" fill="url(#grad-plat-metal)" />
          <polygon points="50,10 84,24 84,56 50,90 16,56 16,24" fill="#030712" />
          <polygon points="50,14 80,26 80,54 50,86 20,54 20,26" fill="url(#grad-plat-core)" />

          {/* Hexagonal Deflection Grid */}
          <g stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.6">
            <polygon points="50,30 62,37 62,51 50,58 38,51 38,37" />
            <line x1="50" y1="14" x2="50" y2="30" />
            <line x1="80" y1="26" x2="62" y2="37" />
            <line x1="80" y1="54" x2="62" y2="51" />
            <line x1="50" y1="86" x2="50" y2="58" />
            <line x1="20" y1="54" x2="38" y2="51" />
            <line x1="20" y1="26" x2="38" y2="37" />
          </g>

          {/* Center Glowing Focus Eye / Core */}
          <circle cx="50" cy="44" r="8" fill="#06b6d4" filter="url(#emblem-glow-cyan)" />
          <circle cx="50" cy="44" r="4" fill="#ffffff" />
          <path d="M 44 68 L 50 62 L 56 68" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        </g>
      );

    // 50 Lessons: Iron Fortress (Impregnable Medieval Citadel Tower)
    case 'dc_50s':
      return (
        <g>
          {/* Heavy Stone Octagon */}
          <polygon points="50,4 82,14 96,46 86,78 50,96 14,78 4,46 18,14" fill="url(#grad-obsidian-metal)" />
          <polygon points="50,8 79,17 92,46 82,75 50,91 18,75 8,46 21,17" fill="#180828" />
          <polygon points="50,12 76,20 88,46 79,72 50,87 21,72 12,46 24,20" fill="url(#grad-obsidian-core)" />

          {/* Stone Fortress Citadel */}
          <g transform="translate(0, 3)">
            {/* Tower Base */}
            <polygon points="30,76 70,76 66,38 34,38" fill="url(#grad-silver-metal)" stroke="#1e293b" strokeWidth="1.5" />
            {/* Tower Masonry lines */}
            <line x1="33" y1="50" x2="67" y2="50" stroke="#475569" strokeWidth="1" />
            <line x1="31" y1="62" x2="69" y2="62" stroke="#475569" strokeWidth="1" />

            {/* Crenellations (Battlements on Top) */}
            <rect x="30" y="28" width="8" height="10" fill="url(#grad-silver-metal)" stroke="#1e293b" strokeWidth="1" />
            <rect x="42" y="28" width="16" height="10" fill="url(#grad-silver-metal)" stroke="#1e293b" strokeWidth="1" />
            <rect x="62" y="28" width="8" height="10" fill="url(#grad-silver-metal)" stroke="#1e293b" strokeWidth="1" />

            {/* Iron Portcullis / Gate */}
            <path d="M 44 76 L 44 60 C 44 56 46 54 50 54 C 54 54 56 56 56 60 L 56 76 Z" fill="#0f172a" />
            <line x1="47" y1="56" x2="47" y2="76" stroke="#ca8a04" strokeWidth="1" />
            <line x1="53" y1="56" x2="53" y2="76" stroke="#ca8a04" strokeWidth="1" />

            {/* Glowing Beacon Hearth on Tower Roof */}
            <circle cx="50" cy="22" r="5" fill="#a855f7" filter="url(#emblem-glow-gold)" />
            <circle cx="50" cy="22" r="2.5" fill="#ffffff" />
          </g>
        </g>
      );

    // ----------------------------------------------------
    // SCHOLARSHIP & STUDY NOTES (sc_25n to sc_100n)
    // ----------------------------------------------------

    // 25 Notes: Master Scribe (Golden Quill & Crystalline Inkwell)
    case 'sc_25n':
      return (
        <g>
          {/* Bronze Rim */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-bronze-metal)" />
          <circle cx="50" cy="50" r="41" fill="#451a03" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-bronze-core)" />

          {/* Crystalline Inkwell (Bottom) */}
          <polygon points="34,74 66,74 62,60 38,60" fill="#1e293b" stroke="#ca8a04" strokeWidth="1.5" />
          <rect x="42" y="56" width="16" height="5" rx="1.5" fill="#ca8a04" />
          {/* Liquid Ink Glow */}
          <ellipse cx="50" cy="62" rx="10" ry="3" fill="#3b82f6" />

          {/* Golden Swan Feather Quill Pen (Diagonal NW to SE) */}
          <g filter="url(#emblem-glow-gold)">
            {/* Feather Vane (Left and Right plumes) */}
            <path
              d="M 68 14 C 56 22 46 36 44 54 L 48 57 C 52 42 62 26 74 18 Z"
              fill="url(#grad-gold-metal)"
              stroke="#78350f"
              strokeWidth="0.8"
            />
            <path
              d="M 74 18 C 78 28 72 44 50 64 L 46 59 C 64 42 70 28 68 14 Z"
              fill="#fef08a"
              stroke="#ca8a04"
              strokeWidth="0.8"
            />
            {/* Feather Shaft (Spine) */}
            <line x1="72" y1="14" x2="44" y2="68" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            {/* Nib Tip */}
            <polygon points="44,68 41,74 47,72" fill="#ca8a04" />
            {/* Droplet of Luminescent Ink */}
            <circle cx="39" cy="77" r="2.2" fill="#38bdf8" />
          </g>
        </g>
      );

    // 100 Notes: Academic Archivist (Great Alexandria Vault Codex)
    case 'sc_100n':
      return (
        <g>
          {/* Imperial Gold & Ruby Ring */}
          <circle cx="50" cy="50" r="46" fill="url(#grad-gold-metal)" />
          <circle cx="50" cy="50" r="41" fill="#450a0a" />
          <circle cx="50" cy="50" r="38" fill="url(#grad-gold-core)" />

          {/* Open Ancient Illuminated Codex Tome */}
          <g transform="translate(0, 3)" filter="url(#emblem-glow-gold)">
            {/* Leather Book Cover Wings */}
            <path d="M 50 66 Q 24 64 16 54 L 16 28 Q 24 38 50 40 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            <path d="M 50 66 Q 76 64 84 54 L 84 28 Q 76 38 50 40 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />

            {/* Glowing Parchment Pages (Left & Right) */}
            <path d="M 50 63 Q 26 61 20 52 L 20 29 Q 26 37 50 38 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
            <path d="M 50 63 Q 74 61 80 52 L 80 29 Q 74 37 50 38 Z" fill="#fffbeb" stroke="#b45309" strokeWidth="1" />

            {/* Page Text & Runes */}
            <line x1="26" y1="36" x2="44" y2="37" stroke="#92400e" strokeWidth="1.5" />
            <line x1="26" y1="42" x2="44" y2="43" stroke="#92400e" strokeWidth="1.5" />
            <line x1="26" y1="48" x2="38" y2="49" stroke="#92400e" strokeWidth="1.5" />

            <line x1="56" y1="37" x2="74" y2="36" stroke="#92400e" strokeWidth="1.5" />
            <line x1="56" y1="43" x2="74" y2="42" stroke="#92400e" strokeWidth="1.5" />
            <line x1="62" y1="49" x2="74" y2="48" stroke="#92400e" strokeWidth="1.5" />

            {/* Floating Constellation Orb above Book */}
            <ellipse cx="50" cy="20" rx="14" ry="5" fill="none" stroke="#facc15" strokeWidth="1.2" />
            <circle cx="50" cy="20" r="5" fill="#38bdf8" />
            <circle cx="50" cy="20" r="2.5" fill="#ffffff" />
          </g>
        </g>
      );

    // Fallback Generic Radiant Medal
    default:
      return (
        <g>
          <circle cx="50" cy="50" r="46" fill="url(#grad-gold-metal)" />
          <circle cx="50" cy="50" r="40" fill="#0f172a" />
          <circle cx="50" cy="50" r="37" fill="url(#grad-gold-core)" />
          <polygon
            points="50,22 58,38 76,40 62,54 66,72 50,62 34,72 38,54 24,40 42,38"
            fill="#ffffff"
            filter="url(#emblem-glow-gold)"
          />
        </g>
      );
  }
}
