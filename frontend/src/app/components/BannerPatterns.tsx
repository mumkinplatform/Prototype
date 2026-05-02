interface BannerPatternProps {
  pattern: string;
  colorPalette: string;
}

const colorPalettes = {
  blue: { primary: '#3b82f6', secondary: '#1d4ed8', light: '#60a5fa' },
  green: { primary: '#10b981', secondary: '#047857', light: '#34d399' },
  yellow: { primary: '#eab308', secondary: '#a16207', light: '#fde047' },
  purple: { primary: '#8b5cf6', secondary: '#6d28d9', light: '#a78bfa' },
  red: { primary: '#a41b42', secondary: '#8a1537', light: '#c42255' },
  orange: { primary: '#f97316', secondary: '#c2410c', light: '#fb923c' },
};

export function BannerPattern({ pattern, colorPalette }: BannerPatternProps) {
  const colors = colorPalettes[colorPalette as keyof typeof colorPalettes] || colorPalettes.red;

  const patterns = {
    'pattern-1': (
      <svg viewBox="0 0 1920 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="1920" height="400" fill="url(#grad1)" />
        <path
          d="M0,200 Q480,100 960,200 T1920,200 L1920,400 L0,400 Z"
          fill={colors.light}
          opacity="0.3"
        />
        <path
          d="M0,250 Q480,150 960,250 T1920,250 L1920,400 L0,400 Z"
          fill={colors.secondary}
          opacity="0.2"
        />
      </svg>
    ),
    'pattern-2': (
      <svg viewBox="0 0 1920 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="1920" height="400" fill="url(#grad2)" />
        <circle cx="1600" cy="100" r="200" fill={colors.light} opacity="0.2" />
        <circle cx="300" cy="300" r="150" fill={colors.light} opacity="0.15" />
        <circle cx="1200" cy="350" r="120" fill={colors.secondary} opacity="0.25" />
      </svg>
    ),
    'pattern-3': (
      <svg viewBox="0 0 1920 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grad3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="1920" height="400" fill="url(#grad3)" />
        <polygon
          points="0,400 400,0 800,400"
          fill={colors.light}
          opacity="0.15"
        />
        <polygon
          points="1200,400 1500,100 1920,400"
          fill={colors.secondary}
          opacity="0.2"
        />
      </svg>
    ),
    'pattern-4': (
      <svg viewBox="0 0 1920 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grad4" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="1920" height="400" fill="url(#grad4)" />
        <rect x="0" y="0" width="600" height="400" fill={colors.light} opacity="0.2" />
        <rect x="800" y="0" width="400" height="400" fill={colors.secondary} opacity="0.15" />
        <rect x="1400" y="0" width="520" height="400" fill={colors.light} opacity="0.1" />
      </svg>
    ),
    'pattern-5': (
      <svg viewBox="0 0 1920 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grad5" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="1920" height="400" fill="url(#grad5)" />
        <path
          d="M0,0 L500,400 L1000,0 L1500,400 L1920,0 L1920,400 L0,400 Z"
          fill={colors.light}
          opacity="0.2"
        />
      </svg>
    ),
    'pattern-6': (
      <svg viewBox="0 0 1920 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grad6" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
          <pattern id="dots" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="20" fill={colors.light} opacity="0.3" />
          </pattern>
        </defs>
        <rect width="1920" height="400" fill="url(#grad6)" />
        <rect width="1920" height="400" fill="url(#dots)" />
        <circle cx="200" cy="100" r="80" fill={colors.secondary} opacity="0.15" />
        <circle cx="1700" cy="300" r="100" fill={colors.light} opacity="0.2" />
      </svg>
    ),
  };

  return patterns[pattern as keyof typeof patterns] || patterns['pattern-1'];
}
