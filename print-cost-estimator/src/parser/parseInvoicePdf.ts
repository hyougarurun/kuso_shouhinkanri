import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { InvoiceLineItem, ParsedInvoice } from '../types.js';
import { normalizeLocation } from '../normalizer/location.js';
import { normalizeMethod } from '../normalizer/method.js';

const PARSER_VERSION = 'poc-p1-0.1.0';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 32_000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEBUG_DIR = resolve(__dirname, '../../data/parsed');

const PROMPT = `あなたは KUSOMEGANE アパレル商品の加工業者請求書を JSON に変換するアシスタントです。
添付 PDF を解析し、以下スキーマの純粋な JSON のみを返してください（コードブロック・前置き・説明文なし、{ から始めて } で終わる）。

スキーマ:
{
  "issuer": "請求書発行者名（PDF内に記載があれば）",
  "invoiceNumber": "請求書番号/請求書ID（あれば）",
  "totalAmount": 合計金額（税込の数値、カンマなし）,
  "taxAmount": 消費税額（数値）,
  "subtotal": 小計（税抜の数値）,
  "lineItems": [
    {
      "raw": "品目欄に書かれた原文そのまま",
      "deliveryDate": "YYYY/MM/DD",
      "deliveryNumber": "納品書番号（例: 6435）",
      "unitPrice": 単価（数値、カンマなし。欄が空なら 0）,
      "quantity": 数量（数値、欄が空なら 0）,
      "subtotal": 価格（数値、欄が空なら 0）,
      "type": "body" | "processing_numbered" | "processing_named" | "material_shipping",
      "bodyCode": "5001-01 等（type=body の時のみ）",
      "bodyName": "Tシャツ等のボディ商品名（type=body の時のみ）",
      "sizeRange": "S~XL / XXL / XXXL 等（type=body の時）",
      "color": "ホワイト / カラー 等（type=body の時）",
      "productNumber": "14-1, 40, 52-BK 等（type=processing_numbered の時のみ）",
      "locationRaw": "front / back / 袖 / 両袖 / 三か所 等（type=processing_* の時）",
      "methodRaw": "インク / 刺繍 / ワッペン / 相良取付 等（type=processing_* の時）"
    }
  ]
}

type 判定ルール:
- 品目が「メガメガ」で始まり続くトークンが数字（例: "メガメガ 14-1 front", "メガメガ 38 インク", "メガメガ 52-BK"）→ "processing_numbered"
- 品目が「メガメガ」で始まりキャラ名・カタカナ漢字（例: "メガメガ ローレンくん", "メガメガ ソデメガネ", "メガメガ 堺税メガネ"）→ "processing_named"
- 品目が型番で始まる（例: "5001-01 5.6オンス Tシャツ", "NWHT-H0080", "GILD-T2400"）→ "body"
- 「OPP入れ」「タグ一辺縫い」「送料」「手数料」「佐川急便」などの副資材・配送→ "material_shipping"

金額カンマ区切り（952,954）は数値（952954）に変換すること。
品目欄に書かれていない値は省略してよい。純粋な JSON のみ返してください。`;

type RawLineItem = {
  raw: string;
  deliveryDate?: string;
  deliveryNumber?: string;
  unitPrice?: number;
  quantity?: number;
  subtotal?: number;
  type: InvoiceLineItem['type'];
  bodyCode?: string;
  bodyName?: string;
  sizeRange?: string;
  color?: string;
  productNumber?: string;
  locationRaw?: string;
  methodRaw?: string;
};

type RawInvoice = {
  issuer?: string;
  invoiceNumber?: string;
  totalAmount: number;
  taxAmount: number;
  subtotal: number;
  lineItems: RawLineItem[];
};

function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;

  const fenceMatch = trimmed.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export async function parseInvoicePdf(pdfPath: string): Promise<ParsedInvoice> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が未設定です。.env を確認してください。');
  }

  const client = new Anthropic({ apiKey });
  const pdfBase64 = readFileSync(pdfPath).toString('base64');

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });
  const response = await stream.finalMessage();

  const block = response.content[0];
  if (!block || block.type !== 'text') {
    throw new Error(`Claude response is not text: ${JSON.stringify(response.content)}`);
  }

  // デバッグ用: 生レスポンスを保存（JSON パース失敗時の原因調査に使う）
  try {
    mkdirSync(DEBUG_DIR, { recursive: true });
    const debugFile = resolve(DEBUG_DIR, `${basename(pdfPath)}.raw.txt`);
    writeFileSync(
      debugFile,
      `=== stop_reason: ${response.stop_reason} ===\n` +
        `=== usage: ${JSON.stringify(response.usage)} ===\n\n` +
        block.text,
      'utf-8',
    );
  } catch {
    // デバッグログ書き込みエラーは無視
  }

  const jsonText = extractJsonBlock(block.text);
  let raw: RawInvoice;
  try {
    raw = JSON.parse(jsonText);
  } catch (err) {
    const stopReason = response.stop_reason;
    const tail = jsonText.slice(Math.max(0, jsonText.length - 200));
    throw new Error(
      `JSON parse failed (stop_reason=${stopReason}, length=${jsonText.length}). ` +
        `Tail 200 chars: ...${tail} | ${(err as Error).message}`,
    );
  }

  const lineItems: InvoiceLineItem[] = raw.lineItems.map((item) => ({
    type: item.type,
    raw: item.raw,
    deliveryDate: item.deliveryDate ?? '',
    deliveryNumber: item.deliveryNumber ?? '',
    unitPrice: item.unitPrice ?? 0,
    quantity: item.quantity ?? 0,
    subtotal: item.subtotal ?? 0,
    bodyCode: item.bodyCode,
    bodyName: item.bodyName,
    sizeRange: item.sizeRange,
    color: item.color,
    productNumber: item.productNumber,
    location: normalizeLocation(item.locationRaw),
    method: normalizeMethod(item.methodRaw),
  }));

  return {
    sourceFile: basename(pdfPath),
    totalAmount: raw.totalAmount,
    taxAmount: raw.taxAmount,
    subtotal: raw.subtotal,
    lineItems,
    parsedAt: new Date().toISOString(),
    parserVersion: PARSER_VERSION,
  };
}
