import { describe, it, expect } from 'vitest';
import { normalizeLocation } from '../../src/normalizer/location.js';

describe('normalizeLocation', () => {
  it('TC-POC-NRM-001: 加工箇所の生データを正規化値に変換する', () => {
    expect(normalizeLocation('front')).toBe('front');
    expect(normalizeLocation('正面')).toBe('front');

    expect(normalizeLocation('back')).toBe('back');
    expect(normalizeLocation('bavk')).toBe('back');

    expect(normalizeLocation('袖')).toBe('sleeve');
    expect(normalizeLocation('そで')).toBe('sleeve');

    expect(normalizeLocation('両袖')).toBe('both_sleeves');
    expect(normalizeLocation('両腕')).toBe('both_sleeves');

    expect(normalizeLocation('三か所')).toBe('three_locations');
    expect(normalizeLocation('3か所')).toBe('three_locations');
    expect(normalizeLocation('プリント三か所')).toBe('three_locations');

    expect(normalizeLocation('袖ワッペン')).toBe('sleeve_patch');

    expect(normalizeLocation('')).toBe('unspecified');
    expect(normalizeLocation(undefined)).toBe('unspecified');
    expect(normalizeLocation('謎ワード')).toBe('unspecified');
  });
});
