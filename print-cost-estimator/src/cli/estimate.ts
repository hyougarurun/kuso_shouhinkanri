/**
 * 加工費推定 CLI（PoC-A: 画像なし、ルールベース）。
 *
 * 実行例:
 *   npm run estimate -- --bodyCode 5001-01 --color ホワイト --locations front,back
 *   npm run estimate -- --bodyCode 5001-01 --locations front,back,袖 --methods ink_print,ink_print,patch
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { aggregateProcessingCosts } from '../aggregator/aggregateProcessingCosts.js';
import { buildBodyPriceRanges } from '../bodyPrice/buildBodyPriceRanges.js';
import { estimate } from '../estimator/estimate.js';
import { loadEnv } from '../config/loadEnv.js';
import type {
  NormalizedLocation,
  NormalizedMethod,
  ParsedInvoice,
} from '../types.js';

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARSED_DIR = resolve(__dirname, '..', '..', 'data', 'parsed');

function loadAllInvoices(dir: string): ParsedInvoice[] {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files.map(
    (f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')) as ParsedInvoice,
  );
}

function printUsage(): void {
  console.error(
    [
      'Usage:',
      '  npm run estimate -- --bodyCode <型番> --locations <front,back,...>',
      '                      [--color <色>] [--methods <ink_print,patch,...>]',
      '',
      '例:',
      '  npm run estimate -- --bodyCode 5001-01 --color ホワイト --locations front,back',
      '  npm run estimate -- --bodyCode 5044-01 --locations front,back,袖 --methods ink_print,ink_print,patch',
      '',
      '利用可能な location: front / back / sleeve / both_sleeves / three_locations / sleeve_patch',
      '※ 日本語 "袖" "両袖" "三か所" も受け付けて内部で正規化します',
      '利用可能な method: ink_print / embroidery / patch / sagara_attach',
    ].join('\n'),
  );
}

const LOCATION_ALIASES: Record<string, NormalizedLocation> = {
  front: 'front',
  正面: 'front',
  back: 'back',
  袖: 'sleeve',
  sleeve: 'sleeve',
  両袖: 'both_sleeves',
  both_sleeves: 'both_sleeves',
  三か所: 'three_locations',
  three_locations: 'three_locations',
  袖ワッペン: 'sleeve_patch',
  sleeve_patch: 'sleeve_patch',
};

const METHOD_ALIASES: Record<string, NormalizedMethod> = {
  インク: 'ink_print',
  ink_print: 'ink_print',
  刺繍: 'embroidery',
  embroidery: 'embroidery',
  ワッペン: 'patch',
  patch: 'patch',
  相良取付: 'sagara_attach',
  sagara_attach: 'sagara_attach',
};

function resolveLocations(input: string): NormalizedLocation[] {
  return input.split(',').map((raw) => {
    const key = raw.trim();
    const normalized = LOCATION_ALIASES[key];
    if (!normalized) {
      throw new Error(`不明な location: ${key}`);
    }
    return normalized;
  });
}

function resolveMethods(
  input: string | undefined,
  count: number,
): (NormalizedMethod | undefined)[] {
  if (!input) return new Array(count).fill(undefined);
  const parts = input.split(',').map((raw) => {
    const key = raw.trim();
    const normalized = METHOD_ALIASES[key];
    if (!normalized) throw new Error(`不明な method: ${key}`);
    return normalized;
  });
  return parts;
}

function main(): void {
  const { values } = parseArgs({
    options: {
      bodyCode: { type: 'string' },
      color: { type: 'string' },
      locations: { type: 'string' },
      methods: { type: 'string' },
    },
    allowPositionals: true,
  });

  if (!values.bodyCode || !values.locations) {
    printUsage();
    process.exit(1);
  }

  const invoices = loadAllInvoices(PARSED_DIR);
  const totalItems = invoices.reduce((s, i) => s + i.lineItems.length, 0);
  console.log(
    `学習データ: ${invoices.length} 請求書 / ${totalItems.toLocaleString()} 明細`,
  );

  const processingCostStats = aggregateProcessingCosts(invoices);
  const bodyPriceRanges = buildBodyPriceRanges(invoices);
  console.log(
    `集計済: ${processingCostStats.length} 商品（番号付き） / ${bodyPriceRanges.length} ボディレンジ`,
  );
  console.log('');

  const locations = resolveLocations(values.locations);
  const methods = resolveMethods(values.methods, locations.length);
  const locInputs = locations.map((loc, i) => ({
    location: loc,
    method: methods[i],
  }));

  const result = estimate(
    {
      bodyCode: values.bodyCode,
      color: values.color,
      locations: locInputs,
    },
    { bodyPriceRanges, processingCostStats },
  );

  console.log('=== 加工費推定 ===');
  console.log(
    `ボディ: ${result.bodyPrice.bodyCode}${
      result.bodyPrice.color ? ' / ' + result.bodyPrice.color : ''
    }`,
  );
  console.log(`  単価レンジ: ¥${result.bodyPrice.range}`);
  console.log('');
  console.log('加工費内訳:');
  for (const p of result.processing) {
    const priceStr = p.estimatedPrice.toLocaleString();
    console.log(
      `  ${p.location.padEnd(16)} (${p.method.padEnd(14)}) : ¥${priceStr.padStart(6)}  [信頼度: ${p.confidence}, 基づく ${p.basedOn} 件]`,
    );
  }
  console.log(
    `  加工費小計${' '.repeat(35)}: ¥${result.subtotalProcessing.toLocaleString()}`,
  );

  if (result.totalMin !== undefined && result.totalMax !== undefined) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      `  商品単価合計（ボディ + 加工費）: ¥${result.totalMin.toLocaleString()} 〜 ¥${result.totalMax.toLocaleString()}`,
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  console.log('');
  for (const n of result.notes) console.log(`※ ${n}`);
}

main();
