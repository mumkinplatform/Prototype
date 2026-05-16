// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests · Sponsor · validatePackageId
//
// اختبارات Pure Function — تأخذ مدخلًا، ترجع مخرجًا، بدون أي تواصل خارجي.
// لا داتابيس، لا HTTP، لا mocks. كل سيناريو سطر واحد للمدخل وسطر للتحقق.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { validatePackageId } from '../../src/lib/sponsor-validation';

describe('validatePackageId · Pure Function', () => {
  // 1. يقبل رقمًا صحيحًا موجبًا
  it('accepts a positive integer', () => {
    const result = validatePackageId(5);
    expect(result).toEqual({ ok: true, value: 5 });
  });

  // 2. يرفض رقمًا سالبًا
  it('rejects a negative number', () => {
    const result = validatePackageId(-3);
    expect(result.ok).toBe(false);
  });

  // 3. يرفض الصفر
  it('rejects zero', () => {
    const result = validatePackageId(0);
    expect(result.ok).toBe(false);
  });

  // 4. يرفض نصًّا غير رقمي
  it('rejects a non-numeric string', () => {
    const result = validatePackageId('abc');
    expect(result.ok).toBe(false);
  });

  // 5. يرفض رقمًا عشريًّا (مو integer)
  it('rejects a decimal number', () => {
    const result = validatePackageId(3.5);
    expect(result.ok).toBe(false);
  });
});
