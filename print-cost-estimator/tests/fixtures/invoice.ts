import type { InvoiceLineItem, ParsedInvoice } from '../../src/types.js';

export function makeInvoice(
  overrides: Partial<ParsedInvoice> = {},
  items: InvoiceLineItem[] = [],
): ParsedInvoice {
  return {
    sourceFile: 'test.pdf',
    totalAmount: 1_000_000,
    taxAmount: 90_909,
    subtotal: 909_091,
    lineItems: items,
    parsedAt: '2026-04-18T00:00:00.000Z',
    parserVersion: 'test',
    ...overrides,
  };
}

export function makeItem(overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  return {
    type: 'processing_numbered',
    raw: '',
    deliveryDate: '2026/01/14',
    deliveryNumber: '6435',
    unitPrice: 0,
    quantity: 1,
    subtotal: 0,
    location: 'unspecified',
    method: 'unspecified',
    ...overrides,
  };
}
