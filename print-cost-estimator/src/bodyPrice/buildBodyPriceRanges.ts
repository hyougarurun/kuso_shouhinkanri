import type { BodyPriceRange, ParsedInvoice } from '../types.js';

function isOtherVendor(invoice: ParsedInvoice): boolean {
  return invoice.taxAmount === 0 && invoice.lineItems.length <= 3;
}

/**
 * type=body の明細から bodyCode × color ごとの単価レンジ辞書を作る。
 * サイズで単価が変動するため、最小〜最大をレンジとして保持する。
 */
export function buildBodyPriceRanges(invoices: ParsedInvoice[]): BodyPriceRange[] {
  const filtered = invoices.filter((inv) => !isOtherVendor(inv));

  type Bucket = {
    bodyCode: string;
    color: string;
    prices: number[];
    sizes: Set<string>;
    dates: string[];
  };
  const buckets = new Map<string, Bucket>();

  for (const invoice of filtered) {
    for (const item of invoice.lineItems) {
      if (item.type !== 'body') continue;
      if (!item.bodyCode) continue;
      if (item.unitPrice <= 0) continue;

      const color = item.color ?? '';
      const key = `${item.bodyCode}|${color}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          bodyCode: item.bodyCode,
          color,
          prices: [],
          sizes: new Set(),
          dates: [],
        };
        buckets.set(key, bucket);
      }
      bucket.prices.push(item.unitPrice);
      if (item.sizeRange) bucket.sizes.add(item.sizeRange);
      if (item.deliveryDate) bucket.dates.push(item.deliveryDate);
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    bodyCode: b.bodyCode,
    color: b.color,
    minPrice: Math.min(...b.prices),
    maxPrice: Math.max(...b.prices),
    sizeExamples: Array.from(b.sizes),
    lastSeen: [...b.dates].sort().pop() ?? '',
  }));
}
