import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveParsedInvoice } from '../../src/batch/saveParsedInvoice.js';
import type { ParsedInvoice } from '../../src/types.js';

function makeInvoice(overrides: Partial<ParsedInvoice> = {}): ParsedInvoice {
  return {
    sourceFile: 'sample.pdf',
    totalAmount: 100000,
    taxAmount: 9091,
    subtotal: 90909,
    lineItems: [
      {
        type: 'processing_numbered',
        raw: 'メガメガ 14-1 front',
        deliveryDate: '2026/01/14',
        deliveryNumber: '6435',
        unitPrice: 900,
        quantity: 34,
        subtotal: 30600,
        productNumber: '14-1',
        location: 'front',
        method: 'unspecified',
      },
    ],
    parsedAt: '2026-04-17T20:39:16.000Z',
    parserVersion: 'poc-p1-0.1.0',
    ...overrides,
  };
}

describe('saveParsedInvoice', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'poc-p2-save-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('TC-POC-P2-001: ParsedInvoice を {outputDir}/{sourceFile}.json に書き出し、保存パスを返す', async () => {
    const invoice = makeInvoice({ sourceFile: 'sample-invoice.pdf' });

    const savedPath = await saveParsedInvoice(invoice, tmpDir);

    expect(savedPath).toBe(join(tmpDir, 'sample-invoice.pdf.json'));

    const content = await readFile(savedPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.sourceFile).toBe('sample-invoice.pdf');
    expect(parsed.totalAmount).toBe(100000);
    expect(parsed.lineItems).toHaveLength(1);
    expect(parsed.lineItems[0].productNumber).toBe('14-1');

    // インデント付き整形を確認（2 スペース）
    expect(content).toContain('\n  "sourceFile"');
  });
});
