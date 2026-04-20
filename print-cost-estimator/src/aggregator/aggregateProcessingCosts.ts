import type {
  NormalizedLocation,
  NormalizedMethod,
  ParsedInvoice,
  ProcessingCostStats,
} from '../types.js';

/**
 * 別業者フィルタ: taxAmount が 0 で明細が極端に少ない請求書は別業者として除外する。
 * PoC-P2 の発見（2025-01-a, 2025-02-a は明細 2 件・tax 0 → 別業者）に基づく。
 */
function isOtherVendor(invoice: ParsedInvoice): boolean {
  return invoice.taxAmount === 0 && invoice.lineItems.length <= 3;
}

function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * processing_numbered 明細を productNumber × location × method でグループ化し、
 * 単価統計（min / median / max / samples / lastSeen）を返す。
 */
export function aggregateProcessingCosts(
  invoices: ParsedInvoice[],
): ProcessingCostStats[] {
  const filtered = invoices.filter((inv) => !isOtherVendor(inv));

  type Bucket = {
    productNumber: string;
    location: NormalizedLocation;
    method: NormalizedMethod;
    prices: number[];
    dates: string[];
  };
  const buckets = new Map<string, Bucket>();

  for (const invoice of filtered) {
    for (const item of invoice.lineItems) {
      if (item.type !== 'processing_numbered') continue;
      if (!item.productNumber) continue;
      if (item.unitPrice <= 0) continue;

      const location = item.location ?? 'unspecified';
      const method = item.method ?? 'unspecified';
      const key = `${item.productNumber}|${location}|${method}`;

      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          productNumber: item.productNumber,
          location,
          method,
          prices: [],
          dates: [],
        };
        buckets.set(key, bucket);
      }
      bucket.prices.push(item.unitPrice);
      if (item.deliveryDate) bucket.dates.push(item.deliveryDate);
    }
  }

  const byProduct = new Map<string, ProcessingCostStats>();
  for (const bucket of buckets.values()) {
    if (bucket.prices.length === 0) continue;

    const sorted = [...bucket.prices].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = computeMedian(sorted);
    const samples = sorted.length;
    const lastSeen = [...bucket.dates].sort().pop() ?? '';

    if (!byProduct.has(bucket.productNumber)) {
      byProduct.set(bucket.productNumber, {
        productNumber: bucket.productNumber,
        records: [],
      });
    }
    byProduct.get(bucket.productNumber)!.records.push({
      location: bucket.location,
      method: bucket.method,
      min,
      median,
      max,
      samples,
      lastSeen,
    });
  }

  return Array.from(byProduct.values());
}
