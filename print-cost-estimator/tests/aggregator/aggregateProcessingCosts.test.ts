import { describe, it, expect } from 'vitest';
import { aggregateProcessingCosts } from '../../src/aggregator/aggregateProcessingCosts.js';
import { makeInvoice, makeItem } from '../fixtures/invoice.js';

describe('aggregateProcessingCosts', () => {
  it('TC-POC-P3-001: 単一サンプルで min=median=max=unitPrice、samples=1', () => {
    const invoice = makeInvoice({}, [
      makeItem({
        productNumber: '14-1',
        location: 'front',
        method: 'ink_print',
        unitPrice: 900,
      }),
    ]);

    const result = aggregateProcessingCosts([invoice]);

    expect(result).toHaveLength(1);
    expect(result[0].productNumber).toBe('14-1');
    expect(result[0].records).toHaveLength(1);

    const record = result[0].records[0];
    expect(record.location).toBe('front');
    expect(record.method).toBe('ink_print');
    expect(record.min).toBe(900);
    expect(record.median).toBe(900);
    expect(record.max).toBe(900);
    expect(record.samples).toBe(1);
    expect(record.lastSeen).toBe('2026/01/14');
  });

  it('TC-POC-P3-002: 複数サンプル [800, 900, 1000] で median=900、min=800、max=1000、samples=3', () => {
    const invoice = makeInvoice({}, [
      makeItem({
        productNumber: '14-1',
        location: 'front',
        method: 'ink_print',
        unitPrice: 800,
      }),
      makeItem({
        productNumber: '14-1',
        location: 'front',
        method: 'ink_print',
        unitPrice: 900,
      }),
      makeItem({
        productNumber: '14-1',
        location: 'front',
        method: 'ink_print',
        unitPrice: 1000,
      }),
    ]);

    const result = aggregateProcessingCosts([invoice]);
    const record = result[0].records[0];

    expect(record.min).toBe(800);
    expect(record.median).toBe(900);
    expect(record.max).toBe(1000);
    expect(record.samples).toBe(3);
  });

  it('TC-POC-P3-003: taxAmount=0 && lineItems.length<=3 の別業者を除外する', () => {
    const normalInvoice = makeInvoice({ sourceFile: 'normal.pdf', taxAmount: 90909 }, [
      makeItem({
        productNumber: '14-1',
        location: 'front',
        method: 'ink_print',
        unitPrice: 900,
      }),
    ]);

    const otherVendorInvoice = makeInvoice({ sourceFile: '202501.pdf', taxAmount: 0 }, [
      makeItem({
        productNumber: '14-1',
        location: 'front',
        method: 'ink_print',
        unitPrice: 9999,
      }),
      makeItem({
        productNumber: '14-1',
        location: 'front',
        method: 'ink_print',
        unitPrice: 9999,
      }),
    ]);

    const result = aggregateProcessingCosts([normalInvoice, otherVendorInvoice]);

    expect(result[0].records[0].samples).toBe(1);
    expect(result[0].records[0].median).toBe(900);
  });

  it('TC-POC-P3-004: processing_numbered 以外の type は集計から除外される', () => {
    const invoice = makeInvoice({}, [
      makeItem({
        type: 'processing_numbered',
        productNumber: '14-1',
        location: 'front',
        method: 'ink_print',
        unitPrice: 900,
      }),
      makeItem({
        type: 'body',
        raw: '5001-01 5.6オンス Tシャツ',
        bodyCode: '5001-01',
        unitPrice: 675,
      }),
      makeItem({
        type: 'processing_named',
        raw: 'メガメガ ローレンくん',
        unitPrice: 800,
      }),
      makeItem({
        type: 'material_shipping',
        raw: 'たたみOPP入れ',
        unitPrice: 80,
      }),
    ]);

    const result = aggregateProcessingCosts([invoice]);

    expect(result).toHaveLength(1);
    expect(result[0].records).toHaveLength(1);
    expect(result[0].records[0].median).toBe(900);
  });
});
