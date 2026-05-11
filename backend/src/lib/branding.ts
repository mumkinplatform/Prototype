// Shared helper for parsing the JSON blob stored in hackathon.H_Branding.
// Used by every "browse hackathons" endpoint that needs to render the organizer's
// chosen cover/logo/palette (participant, sponsor, public). Keep the shape in
// sync with the frontend BrandingPayload type (HackathonCover.tsx).
//
// Returns null if the column is empty or malformed JSON — callers should treat
// null as "use platform defaults".

export interface BrandingPayload {
  bannerMode: 'upload' | 'pattern' | null;
  bannerUploadDataUrl: string | null;
  bannerPattern: string | null;
  logoMode: 'upload' | 'pattern' | null;
  logoUploadDataUrl: string | null;
  logoPattern: string | null;
  colorPalette: string | null;
}

export function extractBranding(raw: string | null): BrandingPayload | null {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object') return null;
    const b = obj as Record<string, unknown>;
    const bMode = b.bannerMode === 'upload' || b.bannerMode === 'pattern' ? b.bannerMode : null;
    const lMode = b.logoMode === 'upload' || b.logoMode === 'pattern' ? b.logoMode : null;
    return {
      bannerMode: bMode,
      bannerUploadDataUrl:
        bMode === 'upload' && typeof b.bannerUploadDataUrl === 'string' ? b.bannerUploadDataUrl : null,
      bannerPattern: bMode === 'pattern' && typeof b.bannerPattern === 'string' ? b.bannerPattern : null,
      logoMode: lMode,
      logoUploadDataUrl:
        lMode === 'upload' && typeof b.logoUploadDataUrl === 'string' ? b.logoUploadDataUrl : null,
      logoPattern: lMode === 'pattern' && typeof b.logoPattern === 'string' ? b.logoPattern : null,
      colorPalette: typeof b.colorPalette === 'string' ? b.colorPalette : null,
    };
  } catch {
    return null;
  }
}
