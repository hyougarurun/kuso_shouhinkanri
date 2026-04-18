import type {
  BodyPriceRange,
  EstimationResult,
  NormalizedLocation,
  NormalizedMethod,
  ProcessingCostStats,
} from '../types.js';

export type EstimationLocationInput = {
  location: NormalizedLocation;
  method?: NormalizedMethod;
};

export type EstimationRequest = {
  bodyCode: string;
  color?: string;
  locations: EstimationLocationInput[];
};

export type EstimationContext = {
  bodyPriceRanges: BodyPriceRange[];
  processingCostStats: ProcessingCostStats[];
};

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function pickConfidence(basedOn: number): 'high' | 'medium' | 'low' {
  if (basedOn >= 10) return 'high';
  if (basedOn >= 3) return 'medium';
  return 'low';
}

/**
 * ルールベース推論エンジン（PoC-P6）。
 * 画像解析前の暫定版。商品番号を特定せず、全商品横断の統計を使用する。
 * P7 で類似画像検索による絞り込みを加え、精度を上げる想定。
 */
export function estimate(
  req: EstimationRequest,
  ctx: EstimationContext,
): EstimationResult {
  // 1. ボディ単価レンジ
  const bpr = ctx.bodyPriceRanges.find(
    (r) => r.bodyCode === req.bodyCode && (!req.color || r.color === req.color),
  );
  const bodyPrice = bpr
    ? {
        range: `${bpr.minPrice}〜${bpr.maxPrice}`,
        bodyCode: bpr.bodyCode,
        color: bpr.color,
      }
    : {
        range: '不明',
        bodyCode: req.bodyCode,
      };

  // 2. 全商品横断の processing records
  const allRecords = ctx.processingCostStats.flatMap((s) => s.records);

  const processing = req.locations.map((loc) => {
    const matches = allRecords.filter(
      (r) =>
        r.location === loc.location &&
        (!loc.method || r.method === loc.method),
    );

    if (matches.length === 0) {
      return {
        location: loc.location,
        method: loc.method ?? 'unspecified',
        estimatedPrice: 0,
        confidence: 'low' as const,
        basedOn: 0,
      };
    }

    const basedOn = matches.reduce((sum, r) => sum + r.samples, 0);
    const medians = matches.map((r) => r.median).sort((a, b) => a - b);
    const estimatedPrice = median(medians);

    // method 未指定なら samples 最多の method を採用
    let method: NormalizedMethod = loc.method ?? 'unspecified';
    if (!loc.method) {
      const byMethod = new Map<NormalizedMethod, number>();
      for (const m of matches) {
        byMethod.set(m.method, (byMethod.get(m.method) ?? 0) + m.samples);
      }
      let bestMethod: NormalizedMethod = 'unspecified';
      let bestSamples = 0;
      for (const [m, s] of byMethod) {
        if (s > bestSamples) {
          bestMethod = m;
          bestSamples = s;
        }
      }
      method = bestMethod;
    }

    return {
      location: loc.location,
      method,
      estimatedPrice,
      confidence: pickConfidence(basedOn),
      basedOn,
    };
  });

  const subtotalProcessing = processing.reduce(
    (sum, p) => sum + p.estimatedPrice,
    0,
  );

  const notes: string[] = ['副資材（OPP・タグ）と送料は別途'];
  if (!bpr) notes.push(`ボディ型番 ${req.bodyCode} の単価データなし`);

  return {
    bodyPrice,
    processing,
    subtotalProcessing,
    notes,
  };
}
