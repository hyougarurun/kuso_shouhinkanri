import { describe, it, expect } from 'vitest';
import { normalizeMethod } from '../../src/normalizer/method.js';

describe('normalizeMethod', () => {
  it('TC-POC-NRM-002: 加工方法の生データを正規化値に変換する', () => {
    expect(normalizeMethod('インク')).toBe('ink_print');
    expect(normalizeMethod('プリント')).toBe('ink_print');

    expect(normalizeMethod('刺繍')).toBe('embroidery');

    expect(normalizeMethod('ワッペン')).toBe('patch');

    expect(normalizeMethod('相良取付')).toBe('sagara_attach');
    expect(normalizeMethod('相良縫付')).toBe('sagara_attach');

    expect(normalizeMethod('')).toBe('unspecified');
    expect(normalizeMethod(undefined)).toBe('unspecified');
    expect(normalizeMethod('謎ワード')).toBe('unspecified');
  });
});
