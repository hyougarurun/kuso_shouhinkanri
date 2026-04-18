import { NextResponse } from 'next/server';
import { analyzeImage } from '@/src/vision/analyzeImage';
import type { AnalyzeImageInput } from '@/src/vision/analyzeImage';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request): Promise<Response> {
  const formData = await req.formData();
  const file = formData.get('image');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'form field "image" に画像ファイルを添付してください' },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `対応していない形式: ${file.type}（jpeg / png / webp / gif のみ）`,
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `画像が大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。10MB 以下にしてください`,
      },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const input: AnalyzeImageInput = {
    imageBase64: base64,
    mediaType: file.type as AnalyzeImageInput['mediaType'],
  };

  try {
    const analysis = await analyzeImage(input);
    return NextResponse.json({ analysis });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
