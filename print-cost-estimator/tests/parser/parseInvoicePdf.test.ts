import { beforeAll, describe, expect, it } from 'vitest';
import { parseInvoicePdf } from '../../src/parser/parseInvoicePdf.js';
import type { ParsedInvoice } from '../../src/types.js';

const PDF_PATH = '/Users/mega/Downloads/KUSOMEGANE様1月納品分ご請求金額.pdf';
const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

describe('parseInvoicePdf', () => {
  let result: ParsedInvoice | undefined;

  beforeAll(async () => {
    if (!hasApiKey) return;
    result = await parseInvoicePdf(PDF_PATH);
  }, 240_000);

  it.skipIf(!hasApiKey)('TC-POC-P1-001: ParsedInvoice 必須フィールドを満たす', () => {
    expect(result).toBeDefined();
    expect(result!.sourceFile).toBe('KUSOMEGANE様1月納品分ご請求金額.pdf');
    expect(typeof result!.totalAmount).toBe('number');
    expect(Array.isArray(result!.lineItems)).toBe(true);
    expect(result!.lineItems.length).toBeGreaterThan(0);
    expect(result!.parsedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result!.parserVersion).toBeTruthy();
  });

  it.skipIf(!hasApiKey)(
    'TC-POC-P1-002: 2026/01 PDF パースで totalAmount=952954、メガメガ 14-1 front を含む',
    () => {
      expect(result!.totalAmount).toBe(952_954);

      const megamega141Front = result!.lineItems.find(
        (item) =>
          item.raw.includes('メガメガ') &&
          item.raw.includes('14-1') &&
          item.raw.includes('front'),
      );
      expect(megamega141Front).toBeDefined();
      expect(megamega141Front?.unitPrice).toBe(900);
      expect(megamega141Front?.quantity).toBe(34);
      expect(megamega141Front?.type).toBe('processing_numbered');
    },
  );
});
