import Anthropic from '@anthropic-ai/sdk';
import { normalizeLocation } from '../normalizer/location';
import { normalizeMethod } from '../normalizer/method';
import type {
  ImageAnalysisLocation,
  ImageAnalysisResult,
  NormalizedLocation,
  NormalizedMethod,
} from '../types';

const MODEL = 'claude-sonnet-4-6';

const PROMPT = `このアパレル合成商品画像を解析し、純粋な JSON のみを返してください（コードブロック・説明文なし）。

スキーマ:
{
  "locations": [
    {
      "location": "front" | "back" | "sleeve" | "both_sleeves" | "three_locations" | "sleeve_patch",
      "method": "ink_print" | "embroidery" | "patch" | "sagara_attach",
      "sizeHint": "small" | "medium" | "large",
      "description": "何がプリント/刺繍されているかの短い説明（例: 胸にキャラクターロゴ）"
    }
  ],
  "bodyObservation": "見えるボディタイプ（例: 半袖Tシャツ・ホワイト / プルオーバーパーカー裏起毛・ブラック）",
  "confidence": "high" | "medium" | "low"
}

判定ガイド:
- 画像に写っている **プリント/刺繍/ワッペンが見える箇所だけ** locations に挙げる。見えない面（例: 背面が写っていない）は推定しない
- location:
  - "front": 胸・身頃の前側全般
  - "back": 背中
  - "sleeve": 片袖のみ
  - "both_sleeves": 両袖に同じ加工（画像では片袖のみ見えても、明らかに左右対称なら）
  - "three_locations": 身頃＋両袖のような複数箇所にまたがる大判デザイン
  - "sleeve_patch": 袖に縫い付けたワッペン/タグ
- method:
  - "ink_print": インクで平面的に印刷されているもの（最も一般的）
  - "embroidery": 糸で縫われた立体感のあるもの
  - "patch": 別素材の布やフェルトを縫い付けたもの
  - "sagara_attach": サガラ刺繍特有のモコモコした質感
- method 判別に迷ったら "ink_print"
- sizeHint:
  - "small": ワンポイント（胸元の小さなマーク、袖の小さな刺繍）
  - "medium": 一般的なセンタープリント（ロゴやキャラのイラスト）
  - "large": 全身・大判、複数箇所に渡る大きなデザイン

画像が Tシャツ・スウェット・パーカー等のアパレルではない場合や、加工が無い場合は locations を空配列にしてください。`;

function isValidLocation(v: string): v is NormalizedLocation {
  return ['front', 'back', 'sleeve', 'both_sleeves', 'three_locations', 'sleeve_patch', 'unspecified'].includes(v);
}

function isValidMethod(v: string): v is NormalizedMethod {
  return ['ink_print', 'embroidery', 'patch', 'sagara_attach', 'unspecified'].includes(v);
}

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

export type AnalyzeImageInput = {
  imageBase64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
};

export async function analyzeImage(input: AnalyzeImageInput): Promise<ImageAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が未設定です。.env を確認してください。');
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2_000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: input.mediaType,
              data: input.imageBase64,
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') {
    throw new Error(`Claude response is not text: ${JSON.stringify(response.content)}`);
  }

  const jsonText = extractJsonBlock(block.text);
  const raw = JSON.parse(jsonText) as {
    locations?: {
      location?: string;
      method?: string;
      sizeHint?: string;
      description?: string;
    }[];
    bodyObservation?: string;
    confidence?: string;
  };

  const locations: ImageAnalysisLocation[] = (raw.locations ?? []).flatMap((loc) => {
    const locationRaw = loc.location ?? '';
    const methodRaw = loc.method ?? '';
    const location = isValidLocation(locationRaw)
      ? locationRaw
      : normalizeLocation(locationRaw);
    const method = isValidMethod(methodRaw) ? methodRaw : normalizeMethod(methodRaw);
    if (location === 'unspecified') return [];
    const sizeHint =
      loc.sizeHint === 'small' || loc.sizeHint === 'medium' || loc.sizeHint === 'large'
        ? loc.sizeHint
        : 'medium';
    return [{
      location,
      method,
      sizeHint,
      description: loc.description ?? '',
    }];
  });

  const confidence =
    raw.confidence === 'high' || raw.confidence === 'medium' || raw.confidence === 'low'
      ? raw.confidence
      : 'medium';

  return {
    locations,
    bodyObservation: raw.bodyObservation ?? '',
    confidence,
  };
}
