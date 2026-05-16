// ─────────────────────────────────────────────────────────────────────────────
// Sponsor · Pure validation helpers
//
// Pure functions: input → output. No DB, no HTTP, no side effects.
// Extracted from sponsor.controller.ts so each rule can be unit-tested
// in isolation.
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Validates a raw value as a sponsor `packageId`.
 * Accepts only positive integers.
 *
 * Examples:
 *   validatePackageId(5)      → { ok: true, value: 5 }
 *   validatePackageId(-5)     → { ok: false, error: '...' }
 *   validatePackageId(0)      → { ok: false, error: '...' }
 *   validatePackageId('abc')  → { ok: false, error: '...' }
 *   validatePackageId(3.5)    → { ok: false, error: '...' }
 */
export function validatePackageId(raw: unknown): ValidationResult<number> {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: 'رقم الباقة غير صالح' };
  }
  return { ok: true, value: n };
}
