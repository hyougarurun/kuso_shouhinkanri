import { describe, it, expect } from 'vitest';
import { estimate } from '../../src/estimator/estimate.js';
import type { BodyPriceRange, ProcessingCostStats } from '../../src/types.js';

const bodyPriceRanges: BodyPriceRange[] = [
  {
    bodyCode: '5001-01',
    color: 'ホワイト',
    minPrice: 633,
    maxPrice: 955,
    sizeExamples: ['S~XL', 'XXL', 'XXXL'],
    lastSeen: '2026/01/20',
  },
];

const processingCostStats: ProcessingCostStats[] = [
  {
    productNumber: '14-1',
    records: [
      {
        location: 'front',
        method: 'ink_print',
        min: 800,
        median: 900,
        max: 1000,
        samples: 12,
        lastSeen: '2026/01/14',
      },
      {
        location: 'back',
        method: 'ink_print',
        min: 1000,
        median: 1100,
        max: 1200,
        samples: 10,
        lastSeen: '2026/01/14',
      },
    ],
  },
  {
    productNumber: '40',
    records: [
      {
        location: 'front',
        method: 'ink_print',
        min: 500,
        median: 500,
        max: 500,
        samples: 3,
        lastSeen: '2026/01/14',
      },
    ],
  },
];

describe('estimate', () => {
  it('TC-POC-P6-001: 既知 bodyCode + location から bodyPrice.range と processing 内訳、subtotal を返す', () => {
    const result = estimate(
      {
        bodyCode: '5001-01',
        color: 'ホワイト',
        locations: [
          { location: 'front', method: 'ink_print' },
          { location: 'back', method: 'ink_print' },
        ],
      },
      { bodyPriceRanges, processingCostStats },
    );

    expect(result.bodyPrice.bodyCode).toBe('5001-01');
    expect(result.bodyPrice.color).toBe('ホワイト');
    expect(result.bodyPrice.range).toBe('633〜955');
    expect(result.bodyPrice.minPrice).toBe(633);
    expect(result.bodyPrice.maxPrice).toBe(955);

    expect(result.processing).toHaveLength(2);

    const front = result.processing[0];
    expect(front.location).toBe('front');
    expect(front.method).toBe('ink_print');
    // 14-1 (median=900) と 40 (median=500) の median → 700
    expect(front.estimatedPrice).toBe(700);
    expect(front.basedOn).toBe(12 + 3);
    expect(front.confidence).toBe('high');

    const back = result.processing[1];
    expect(back.location).toBe('back');
    expect(back.estimatedPrice).toBe(1100);
    expect(back.basedOn).toBe(10);
    expect(back.confidence).toBe('high');

    expect(result.subtotalProcessing).toBe(700 + 1100);
    // ボディ単価 + 加工費小計のレンジ
    expect(result.totalMin).toBe(633 + 1800);
    expect(result.totalMax).toBe(955 + 1800);
  });

  it('TC-POC-P6-002: 未知 bodyCode は range=不明、未知 location は estimatedPrice=0 confidence=low basedOn=0、例外にならない', () => {
    const result = estimate(
      {
        bodyCode: '9999-99',
        locations: [{ location: 'sleeve', method: 'patch' }],
      },
      { bodyPriceRanges, processingCostStats },
    );

    expect(result.bodyPrice.range).toBe('不明');
    expect(result.bodyPrice.bodyCode).toBe('9999-99');
    expect(result.bodyPrice.minPrice).toBeUndefined();
    expect(result.bodyPrice.maxPrice).toBeUndefined();

    expect(result.processing).toHaveLength(1);
    expect(result.processing[0].estimatedPrice).toBe(0);
    expect(result.processing[0].confidence).toBe('low');
    expect(result.processing[0].basedOn).toBe(0);

    expect(result.subtotalProcessing).toBe(0);
    expect(result.totalMin).toBeUndefined();
    expect(result.totalMax).toBeUndefined();
    expect(result.notes.length).toBeGreaterThan(0);
  });
});
