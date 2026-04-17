/**
 * 請求書 PDF 一括パース CLI エントリーポイント。
 *
 * 実行: `npm run parse:batch`
 * 出力: data/parsed/<ファイル名>.pdf.json（正規化後 JSON）
 *       data/parsed/<ファイル名>.pdf.raw.txt（Claude 生レスポンス、parseInvoicePdf 側で生成）
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../config/loadEnv.js';
import { batchParseInvoices } from './batchParseInvoices.js';
import { INVOICE_CATALOG } from './invoiceCatalog.js';

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', '..', 'data', 'parsed');

async function main(): Promise<void> {
  const paths = INVOICE_CATALOG.map((entry) => entry.path);

  console.log('=== 請求書バッチパース開始 ===');
  console.log(`対象 PDF: ${paths.length} 件`);
  console.log(`出力先: ${OUTPUT_DIR}`);
  console.log('');

  const startAt = Date.now();
  const result = await batchParseInvoices(paths, OUTPUT_DIR, {
    onProgress: (index, total, path) => {
      const label =
        INVOICE_CATALOG.find((entry) => entry.path === path)?.label ?? '?';
      console.log(`[${index + 1}/${total}] ${label}  ${path}`);
    },
  });

  const elapsedSec = Math.round((Date.now() - startAt) / 1000);

  console.log('');
  console.log('=== バッチ完了 ===');
  console.log(`所要時間: ${elapsedSec}s (${Math.round(elapsedSec / 60)}m)`);
  console.log(`成功: ${result.successes.length} / ${result.total}`);
  console.log(`失敗: ${result.failures.length} / ${result.total}`);

  if (result.successes.length > 0) {
    console.log('');
    console.log('--- 成功内訳 ---');
    for (const s of result.successes) {
      if (s.status !== 'success') continue;
      const label =
        INVOICE_CATALOG.find((entry) => entry.path === s.path)?.label ?? '?';
      console.log(
        `  ${label}  合計=${s.invoice.totalAmount.toLocaleString()}円  明細=${s.invoice.lineItems.length}件`,
      );
    }
  }

  if (result.failures.length > 0) {
    console.log('');
    console.log('--- 失敗詳細 ---');
    for (const f of result.failures) {
      if (f.status !== 'failure') continue;
      const label =
        INVOICE_CATALOG.find((entry) => entry.path === f.path)?.label ?? '?';
      console.log(`  ${label}  ${f.path}`);
      console.log(`    → ${f.error}`);
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
