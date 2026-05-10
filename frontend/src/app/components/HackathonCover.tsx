import { BannerPattern } from "./BannerPatterns";

// Fallback gradient palette used when the organizer didn't upload a banner
// or pick a pattern. Keeps cover art consistent across participant pages.
export const COVER_PALETTE = [
  { gradient: "bg-gradient-to-br from-green-800 via-teal-700 to-cyan-600", label: "HACK\n2025" },
  { gradient: "bg-gradient-to-br from-blue-800 via-indigo-700 to-purple-600", label: "TECH\nhackathon" },
  { gradient: "bg-gradient-to-br from-violet-800 via-purple-700 to-indigo-800", label: "INNO\nVATION" },
  { gradient: "bg-gradient-to-br from-amber-700 via-orange-600 to-red-700", label: "CODE\nFEST" },
  { gradient: "bg-gradient-to-br from-emerald-700 via-green-600 to-teal-700", label: "BUILD\n2025" },
  { gradient: "bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900", label: "DEV\nHACK" },
];

export interface BrandingPayload {
  bannerMode?: "upload" | "pattern" | null;
  bannerUploadDataUrl?: string | null;
  bannerPattern?: string | null;
  logoMode?: "upload" | "pattern" | null;
  logoUploadDataUrl?: string | null;
  logoPattern?: string | null;
  colorPalette?: string | null;
}

/** Normalizes branding data whether it arrives as JSON string, object, or null. */
export function parseBranding(raw: unknown): BrandingPayload | null {
  if (!raw) return null;
  try {
    if (typeof raw === "string" && raw.trim() !== "") {
      return JSON.parse(raw) as BrandingPayload;
    }
    if (typeof raw === "object") return raw as BrandingPayload;
  } catch {
    return null;
  }
  return null;
}

interface HackathonCoverProps {
  branding: BrandingPayload | null | undefined;
  /** Seed for the fallback palette so the same hackathon always shows the same cover. */
  id: number;
  /** When true, render the fallback palette label small (for thumbnails). */
  compact?: boolean;
}

/**
 * Renders the hackathon cover as an absolute layer inside its parent.
 * Priority: organizer-uploaded image → preset pattern → fallback palette.
 *
 * Usage:
 *   <div className="h-44 relative overflow-hidden flex items-end p-4">
 *     <HackathonCover branding={h.branding} id={h.id} />
 *     ...children with `relative z-10`...
 *   </div>
 */
export function HackathonCover({ branding, id, compact = false }: HackathonCoverProps) {
  // 1) Organizer-uploaded image
  if (branding?.bannerMode === "upload" && branding.bannerUploadDataUrl) {
    return (
      <img
        src={branding.bannerUploadDataUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }

  // 2) Organizer picked a preset pattern
  if (branding?.bannerMode === "pattern" && branding.bannerPattern) {
    return (
      <div className="absolute inset-0">
        <BannerPattern
          pattern={branding.bannerPattern}
          colorPalette={branding.colorPalette || "red"}
        />
      </div>
    );
  }

  // 3) Fallback palette (same id always yields the same cover)
  const cover = COVER_PALETTE[id % COVER_PALETTE.length];
  return (
    <div
      className={`absolute inset-0 ${cover.gradient} flex items-center justify-center text-white whitespace-pre text-center leading-tight`}
      style={{ fontWeight: 700, fontSize: compact ? "0.625rem" : "1.5rem" }}
      aria-hidden
    >
      {cover.label}
    </div>
  );
}
