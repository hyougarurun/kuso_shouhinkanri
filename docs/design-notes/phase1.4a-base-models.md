# Phase 1.4a: base モデル画像生成（着画システム基盤）

作成日: 2026-04-21

## ゴール

KUSOMEGANE 商品の着画イメージを生成するための「**プレーン服を着た base モデル**」を 10 枚用意する。
Phase 1.4b で Kling VTON にこの base モデルを渡し、実商品のプリントを合成する。

## 前提スタイル（サンプル 11 枚の統計解析結果）

- モデル: 日本人若年（20代前半〜半ば）
- 顔特徴: **全員黒縁のスクエア/ウェリントン眼鏡**（ブランドアイコン、必須）
- 髪: 黒髪
- ポーズ: 正面立ち手ポケット / 振り返り背中向き / 2ショット
- 照明: 均一・平坦（スタジオ）
- 背景: **単色フラット**（ピンク / ネイビー / 黄 / オレンジ / ベージュ）
- フレーム: 膝上〜腰のミディアム〜ウエストショット
- 下装: デニム・バギー・チェックスカート等

## 10 パターン構成

| # | 性別 | ポーズ | ガーメント | 色 | 背景色 |
|---|------|--------|-----------|-----|--------|
| 1 | 男 | 前向き手ポケ | クルーネックスウェット | ブラック | マスタードイエロー |
| 2 | 男 | 前向き手ポケ | プルオーバーパーカー | ヘザーグレー | ネイビーブルー |
| 3 | 男 | 前向き手ポケ | クルーネックスウェット | ネイビー | ダスティピンク |
| 4 | 男 | 振り返り背中 | プルオーバーパーカー | ブラック | マスタードイエロー |
| 5 | 男 | 振り返り背中 | クルーネックスウェット | ヘザーグレー | ネイビーブルー |
| 6 | 女 | 前向き手ポケ | クルーネックスウェット | ヘザーグレー | ダスティピンク |
| 7 | 女 | 前向き手ポケ | プルオーバーパーカー | ホワイト | オレンジレッド |
| 8 | 女 | 前向き手ポケ | クルーネックスウェット | ネイビー | ダスティピンク |
| 9 | 女 | 振り返り背中 | クルーネックスウェット | ヘザーグレー | マスタードイエロー |
| 10 | 女 | 振り返り背中 | プルオーバーパーカー | ブラック | ベージュ |

## 共通プロンプト骨子（全 10 枚共通）

```
Professional Japanese apparel lookbook e-commerce photograph,
young Japanese {gender} model in early 20s,
wearing thick-rimmed black square wellington eyeglasses (required, essential brand element),
natural black hair {男性: "short neat hair" / 女性: "low bun or simple ponytail"},
clean minimal makeup, neutral calm expression (slight smile or serene),
{pose_direction},
wearing plain completely blank {garment_type} in solid {garment_color},
NO prints, NO logos, NO text, NO graphics on the garment (this is critical),
paired with {lower_body},
shot from {knees up / waist up} with centered composition,
plain solid {background_color} studio backdrop (flat, no gradient, no texture),
flat even diffused studio lighting, soft shadows only,
sharp focus on the model, high-resolution fashion photography,
3:4 portrait aspect ratio, photorealistic
```

## ポーズ別の `pose_direction` 差分

- **前向き手ポケ**: "standing front-facing to camera, both hands casually tucked into front pockets of jeans, relaxed natural posture, looking directly at the camera"
- **振り返り背中**: "standing with back to camera showing the full back of the garment, turning head slightly over the right shoulder to look back at the camera, arms naturally down at the sides"

## 下装バリエーション `lower_body`

- 男性: "dark washed loose straight denim jeans"
- 女性（前向き #6,8）: "faded baggy wide-leg denim jeans"
- 女性（前向き #7）: "short plaid mini skirt and black tights"
- 女性（振り返り #9,10）: "dark washed loose denim jeans"

## ガーメント指定

- クルーネックスウェット: "plain crewneck sweatshirt with no print, no logo, no chest graphic, clean smooth cotton fleece fabric"
- プルオーバーパーカー: "plain pullover hoodie with drawstring hood, front kangaroo pocket, NO print, NO logo, NO graphic on chest or back, clean smooth cotton fleece fabric"

## 完成条件

- 10 枚生成 → k2 採用判定 → 4〜6 枚採用
- 採用画像を Supabase Storage `base-models` バケットへアップロード
- `/base-models` ページで閲覧・お気に入り・ダウンロード可

## 非スコープ（Phase 1.4a 外）

- VTON 合成（Phase 1.4b で実施）
- 背面デザイン合成（Phase 1.4c で実施）
- 商品 (Product) への自動着画アタッチ（Phase 1.4b 以降）
