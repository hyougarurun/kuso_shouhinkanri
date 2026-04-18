import { NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { aggregateProcessingCosts } from '@/src/aggregator/aggregateProcessingCosts';
import { buildBodyPriceRanges } from '@/src/bodyPrice/buildBodyPriceRanges';
import { estimate } from '@/src/estimator/estimate';
import type {
  NormalizedLocation,
  NormalizedMethod,
  ParsedInvoice,
} from '@/src/types';

const PARSED_DIR = resolve(process.cwd(), 'data', 'parsed');

function loadAllInvoices(dir: string): ParsedInvoice[] {
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
    return files.map(
      (f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')) as ParsedInvoice,
    );
  } catch {
    return [];
  }
}

type EstimateRequest = {
  bodyCode: string;
  color?: string;
  locations: {
    location: NormalizedLocation;
    method?: NormalizedMethod | '';
  }[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as EstimateRequest;

  if (!body.bodyCode || !Array.isArray(body.locations) || body.locations.length === 0) {
    return NextResponse.json(
      { error: 'bodyCode と locations (1件以上) を指定してください' },
      { status: 400 },
    );
  }

  const invoices = loadAllInvoices(PARSED_DIR);
  if (invoices.length === 0) {
    return NextResponse.json(
      {
        error:
          'data/parsed に学習データがありません。npm run parse:batch を実行してください',
      },
      { status: 400 },
    );
  }

  const processingCostStats = aggregateProcessingCosts(invoices);
  const bodyPriceRanges = buildBodyPriceRanges(invoices);

  const result = estimate(
    {
      bodyCode: body.bodyCode,
      color: body.color || undefined,
      locations: body.locations.map((l) => ({
        location: l.location,
        method: l.method ? (l.method as NormalizedMethod) : undefined,
      })),
    },
    { bodyPriceRanges, processingCostStats },
  );

  return NextResponse.json({
    result,
    meta: {
      invoices: invoices.length,
      lineItems: invoices.reduce((s, i) => s + i.lineItems.length, 0),
      products: processingCostStats.length,
      bodyCodes: bodyPriceRanges.length,
    },
  });
}
