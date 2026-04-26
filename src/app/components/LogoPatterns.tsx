interface LogoPatternProps {
  pattern: string;
  colorPalette: string;
}

const colorPalettes = {
  blue: { primary: '#3b82f6', secondary: '#1d4ed8' },
  green: { primary: '#10b981', secondary: '#047857' },
  yellow: { primary: '#eab308', secondary: '#a16207' },
  purple: { primary: '#8b5cf6', secondary: '#6d28d9' },
  red: { primary: '#a41b42', secondary: '#8b1538' },
  orange: { primary: '#f97316', secondary: '#c2410c' },
};

export function LogoPattern({ pattern, colorPalette }: LogoPatternProps) {
  const colors = colorPalettes[colorPalette as keyof typeof colorPalettes] || colorPalettes.red;

  const patterns = {
    'logo-1': (
      <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Square Background */}
        <rect x="20" y="20" width="160" height="160" rx="25" fill="url(#logoGrad1)" />
        {/* Code Symbol */}
        <text x="100" y="135" fontSize="90" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{'<>'}</text>
      </svg>
    ),
    'logo-2': (
      <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Square Background */}
        <rect x="20" y="20" width="160" height="160" rx="25" fill="url(#logoGrad2)" />
        {/* Hexagon */}
        <polygon points="100,60 135,78 135,114 100,132 65,114 65,78" fill="white" />
        <circle cx="100" cy="96" r="15" fill={colors.primary} />
        <circle cx="100" cy="78" r="5" fill={colors.primary} />
        <circle cx="100" cy="114" r="5" fill={colors.primary} />
      </svg>
    ),
    'logo-3': (
      <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="logoGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Square Background */}
        <rect x="20" y="20" width="160" height="160" rx="25" fill="url(#logoGrad3)" />
        {/* Lightning Bolt */}
        <path d="M110,60 L85,100 L100,100 L88,140 L113,100 L98,100 Z" fill="white" />
      </svg>
    ),
    'logo-4': (
      <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="logoGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Square Background */}
        <rect x="20" y="20" width="160" height="160" rx="25" fill="url(#logoGrad4)" />
        {/* Rocket */}
        <path d="M100,60 L108,88 L100,84 L92,88 Z" fill="white" />
        <ellipse cx="100" cy="100" rx="18" ry="25" fill="white" />
        <circle cx="100" cy="100" r="8" fill={colors.primary} />
        <path d="M88,120 L80,135 L88,128 Z" fill="white" opacity="0.9" />
        <path d="M112,120 L120,135 L112,128 Z" fill="white" opacity="0.9" />
      </svg>
    ),
    'logo-5': (
      <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="logoGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Square Background */}
        <rect x="20" y="20" width="160" height="160" rx="25" fill="url(#logoGrad5)" />
        {/* Lightbulb */}
        <circle cx="100" cy="85" r="22" fill="white" />
        <rect x="88" y="107" width="24" height="18" rx="3" fill="white" />
        <rect x="92" y="125" width="16" height="7" rx="2" fill="white" opacity="0.8" />
      </svg>
    ),
    'logo-6': (
      <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="logoGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Square Background */}
        <rect x="20" y="20" width="160" height="160" rx="25" fill="url(#logoGrad6)" />
        {/* Trophy */}
        <path d="M75,80 L75,95 Q75,108 100,108 Q125,108 125,95 L125,80 Z" fill="white" />
        <rect x="96" y="108" width="8" height="18" fill="white" />
        <rect x="88" y="126" width="24" height="7" rx="2" fill="white" />
        <rect x="68" y="83" width="6" height="15" rx="2" fill="white" opacity="0.8" />
        <rect x="126" y="83" width="6" height="15" rx="2" fill="white" opacity="0.8" />
      </svg>
    ),
  };

  return patterns[pattern as keyof typeof patterns] || patterns['logo-1'];
}
