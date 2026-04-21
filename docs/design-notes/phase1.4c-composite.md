# Phase 1.4c: 合成画像生成（保留・将来拡張用）

作成日: 2026-04-21
ステータス: **未着手（k2 から「いつでも戻れるように」指示あり）**

## ゴール

base モデル画像 + デザイン画像（プリント/ロゴ/グラフィック）→ 1 枚の合成商品画像を生成。
例: 「白Tシャツを着たモデル」+「クソメガネロゴ PNG」= 「クソメガネロゴが胸にプリントされた白T着用写真」

## 想定ユースケース

1. Phase 1.4a で貯めた着画アセット（17+ 枚）から「プレーン服」系を選ぶ
2. k2 が新デザインを完成（.psd/.ai/.png）
3. 合成生成で商品モック画像を即生産
4. 商品登録ウィザードの Step1 画像として転用 / SNS プレビュー / OEM 相談資料

## 技術的アプローチ

**採用予定**: Gemini 2.5 Flash Image（既存の Phase 1.4b と同じモデル）
- Gemini は `parts` 配列に複数 `inlineData` を渡せる → 多画像入力ネイティブ対応
- 既存 `lib/gemini/generateImage.ts` を最小拡張すれば実現
- 単価: $0.039/枚（変わらず）

## 実装プラン（再開時の参照用）

### B-1: lib 拡張
`lib/gemini/generateImage.ts` に `sourceImages: Array<{data, mime}>` 版の関数を追加（または既存シグネチャを多画像対応に拡張）。

```ts
body.contents[0].parts = [
  { text: prompt },
  { inlineData: { mimeType: base.mime, data: base.base64 } },
  { inlineData: { mimeType: design.mime, data: design.base64 } },
]
```

### B-2: プロンプトビルダ
`buildCompositePrompt({ location: 'front'|'back', size: 'small'|'medium'|'large' })` を追加。

基本テンプレ:
```
Image 1 is the base photograph: a person wearing a plain [garment_color] [garment_type].
Image 2 is the design artwork to be applied as a print.

Compose a final realistic photograph where Image 2 is printed on Image 1's garment,
positioned at the [location] of the garment, at [size] scale.
Match the garment's fabric wrinkles, lighting, perspective, and shadows so the print
looks naturally applied (not just overlaid). Preserve everything else from Image 1
(face, pose, background, lighting). Output a single high-resolution photorealistic image.
```

### B-3: API
`POST /api/base-models/[id]/composite`
- body: `{ designImageId?: string, designBase64?: string, designMime?: string, location, size, additionalPrompt? }`
- `designImageId` 指定なら別 base_model or 別テーブル（素材ライブラリ）から取得
- 多画像生成 → 新 base_model 行（`parent_id=base, target_garment` は親と同じ、`generationPrompt` にテンプレ記録）

### B-4: UI
- base-models カードに「🖼 合成」ボタン追加
- ダイアログ: デザイン画像アップロード（既存 paste 対応パターン踏襲）+ 配置（前/後）+ サイズ
- 完了 → 一覧に派生として追加表示（既存バッジと別色の「🖼 合成」バッジ）

### B-5: （任意）デザインライブラリ分離
合成用のデザイン素材を `designs` テーブル（PSD/AI/透過 PNG 等）に分けるか、`base_models` の `role` カラムで区別。
→ 規模感見てから決める。

## コスト試算

- 合成 1 枚: $0.039
- 17 base × 平均 3 デザイン = 51 枚 ≒ **$2**
- 失敗して再生成してもほぼ誤差

## 再開トリガー

k2 が以下いずれか発言したら Phase 1.4c 開始:
- 「合成画像やって」
- 「phase1.4c 進めて」
- 「ベース + デザインで合成」

## 既存コードのエントリポイント

このフェーズに戻る時に触る場所:
- `kusomegane-apparel/lib/gemini/generateImage.ts` ← 多画像対応で拡張
- `kusomegane-apparel/app/api/base-models/[id]/` ← `composite/route.ts` 新設
- `kusomegane-apparel/components/base-models/` ← `CompositeDialog.tsx` 新設
- `kusomegane-apparel/app/base-models/page.tsx` ← ボタン & バッジ追加

既存の `GenerateVariationDialog` / `generate-variation` ルートをコピーして改造するのが最短。
