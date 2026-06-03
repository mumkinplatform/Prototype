// Unit tests for validatePackageId — pure function, no DB or HTTP.

import { describe, it, expect } from 'vitest';
import { validatePackageId } from '../../src/lib/sponsor-validation';

describe('validatePackageId · Pure Function', () => {
  it('accepts a positive integer', () => {
    const result = validatePackageId(5);
    expect(result).toEqual({ ok: true, value: 5 });
  });

  it('rejects a negative number', () => {
    const result = validatePackageId(-3);
    expect(result.ok).toBe(false);
  });

  it('rejects zero', () => {
    const result = validatePackageId(0);
    expect(result.ok).toBe(false);
  });

  it('rejects a non-numeric string', () => {
    const result = validatePackageId('abc');
    expect(result.ok).toBe(false);
  });

  it('rejects a decimal number', () => {
    const result = validatePackageId(3.5);
    expect(result.ok).toBe(false);
  });
});
