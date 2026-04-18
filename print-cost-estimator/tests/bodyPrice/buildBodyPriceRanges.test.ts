import { describe, it, expect } from 'vitest';
import { buildBodyPriceRanges } from '../../src/bodyPrice/buildBodyPriceRanges.js';
import { makeInvoice, makeItem } from '../fixtures/invoice.js';

describe('buildBodyPriceRanges', () => {
  it('TC-POC-P4-001: bodyCode×color で minPrice/maxPrice と sizeExamples を返す', () => {
    const invoice = makeInvoice({}, [
      makeItem({
        type: 'body',
        bodyCode: '5001-01',
        color: 'ホワイト',
        sizeRange: 'S~XL',
        unitPrice: 633,
        deliveryDate: '2026/01/08',
      }),
      makeItem({
        type: 'body',
        bodyCode: '5001-01',
        color: 'ホワイト',
        sizeRange: 'XXL',
        unitPrice: 858,
        deliveryDate: '2026/01/15',
      }),
      makeItem({
        type: 'body',
        bodyCode: '5001-01',
        color: 'ホワイト',
        sizeRange: 'XXXL',
        unitPrice: 955,
        deliveryDate: '2026/01/15',
      }),
      makeItem({
        type: 'body',
        bodyCode: '5001-01',
        color: 'カラー',
        sizeRange: 'S~XL',
        unitPrice: 675,
        deliveryDate: '2026/01/20',
      }),
      makeItem({
        type: 'processing_numbered',
        productNumber: '14-1',
        unitPrice: 900,
      }),
    ]);

    const result = buildBodyPriceRanges([invoice]);

    expect(result).toHaveLength(2); // ホワイト と カラー で 2 グループ

    const white = result.find((r) => r.color === 'ホワイト')!;
    expect(white.bodyCode).toBe('5001-01');
    expect(white.minPrice).toBe(633);
    expect(white.maxPrice).toBe(955);
    expect(white.sizeExamples).toEqual(
      expect.arrayContaining(['S~XL', 'XXL', 'XXXL']),
    );
    expect(white.lastSeen).toBe('2026/01/15');

    const colored = result.find((r) => r.color === 'カラー')!;
    expect(colored.minPrice).toBe(675);
    expect(colored.maxPrice).toBe(675);
  });
});
