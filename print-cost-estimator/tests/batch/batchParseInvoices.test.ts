import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParsedInvoice } from '../../src/types.js';

vi.mock('../../src/parser/parseInvoicePdf.js', () => ({
  parseInvoicePdf: vi.fn(),
}));
vi.mock('../../src/batch/saveParsedInvoice.js', () => ({
  saveParsedInvoice: vi.fn(),
}));

import { parseInvoicePdf } from '../../src/parser/parseInvoicePdf.js';
import { saveParsedInvoice } from '../../src/batch/saveParsedInvoice.js';
import { batchParseInvoices } from '../../src/batch/batchParseInvoices.js';

const mockedParse = vi.mocked(parseInvoicePdf);
const mockedSave = vi.mocked(saveParsedInvoice);

function makeInvoice(sourceFile: string): ParsedInvoice {
  return {
    sourceFile,
    totalAmount: 100000,
    taxAmount: 9091,
    subtotal: 90909,
    lineItems: [],
    parsedAt: '2026-04-17T00:00:00.000Z',
    parserVersion: 'poc-p1-0.1.0',
  };
}

describe('batchParseInvoices', () => {
  beforeEach(() => {
    mockedParse.mockReset();
    mockedSave.mockReset();
  });

  it('TC-POC-P2-002: 直列実行、個別エラーで中断せず、successes/failures を集計する', async () => {
    mockedParse
      .mockResolvedValueOnce(makeInvoice('a.pdf'))
      .mockRejectedValueOnce(new Error('parse failed for b.pdf'))
      .mockResolvedValueOnce(makeInvoice('c.pdf'));

    mockedSave.mockImplementation(async (inv, dir) => `${dir}/${inv.sourceFile}.json`);

    const progressCalls: Array<[number, number, string]> = [];
    const result = await batchParseInvoices(['a.pdf', 'b.pdf', 'c.pdf'], '/tmp/out', {
      onProgress: (index, total, path) => {
        progressCalls.push([index, total, path]);
      },
    });

    expect(result.total).toBe(3);
    expect(result.successes).toHaveLength(2);
    expect(result.failures).toHaveLength(1);
    expect(result.successes.length + result.failures.length).toBe(3);

    expect(result.successes[0].path).toBe('a.pdf');
    expect(result.successes[1].path).toBe('c.pdf');
    expect(result.failures[0].path).toBe('b.pdf');
    if (result.failures[0].status === 'failure') {
      expect(result.failures[0].error).toContain('parse failed for b.pdf');
    }

    expect(mockedParse).toHaveBeenCalledTimes(3);
    expect(mockedSave).toHaveBeenCalledTimes(2); // 失敗したものは保存しない

    expect(progressCalls).toEqual([
      [0, 3, 'a.pdf'],
      [1, 3, 'b.pdf'],
      [2, 3, 'c.pdf'],
    ]);
  });
});
