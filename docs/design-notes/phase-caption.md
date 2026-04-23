# Phase Caption: 投稿キャプション生成ツール 設計メモ

作成日: 2026-04-23

## 機能概要

KUSOMEGANE の動画・投稿用に、日記風キャプションを AI で生成するツール。
k2 の従来フロー（作画 + 箇条書き状況 → ChatGPT/Gemini 無料版でキャプション生成 → 手動添削）を専用 UI に載せる。

- 配置: 独立ルート `/captions`（Sidebar 第7項目として追加）
- 作画（イラスト）+ 状況メモを入力
- 3件並列生成して当たり外れを回転させる運用
- 添削後のベストキャプションは Supabase に保存、タグ付けで分類してナレッジ化

## 確定した要件

### 1. ルート配置
- 独立ルート `/captions`
- Sidebar `NAV_ITEMS` に追加（`/creator/backgrounds` の下、または同列に並べる）

### 2. 入力
- **作画イラスト**: 1枚のみ、オプショナル（画像なしでも生成可）
  - アップロード方式: paste（Cmd+V）/ DnD / file picker 全対応（memory 標準）
- **状況メモ**: 1つの textarea、行頭 `-` または改行で項目化
  - オプショナル（画像のみからの推測生成を許可）
  - 履歴サジェストは**適用しない**（毎回状況が異なるため）

### 3. AI モデル（プルダウンで切替可能）
| ID | 用途 | コスト感 |
|---|---|---|
| `claude-haiku-4-5-20251001` | **デフォルト**。3件並列・量回転向け | 最安・最速 |
| `claude-sonnet-4-6` | 品質重視時 | 中 |
| `claude-opus-4-7` | 最高品質が欲しい時 | 高 |
| `gpt-4o` | OpenAI 比較用 | 中 |
| `gemini-2.5-flash` | Gemini 比較用 | 最安 |

全モデルに画像入力サポートあり。

### 4. プロンプトカスタマイズ（すべて切替・チューニング可能）

#### 4-1. プリセット（テンプレ雛形、切替可能）
- `日記風`（デフォルト）: 「イラストの状況を面白おかしく日記風に仕上げてください」
- `独り言風`: 「イラストの人物の心の声を独り言風に書いてください」
- `ポエム風`: 「イラストから感じる情景を短いポエム風に綴ってください」
- `ツッコミ風`: 「イラストの状況を関西弁のツッコミ風に実況してください」
- プリセットは LocalStorage に保存、ユーザーが編集・追加・削除可能

#### 4-2. 文字数（プリセット + スライダー）
- プリセット: 200 / 500 / 800 字（初期値 500）
- スライダーで 100〜1200 字の範囲で微調整

#### 4-3. 文体（ラジオ）
- `です・ます調`
- `だ・である調`
- `タメ口`（デフォルト、KUSOMEGANE の日記トーンに合致）

### 5. 出力

- **1回のリクエストで 3件並列生成**
- 各カードに以下を表示:
  - 編集可能な textarea（生成テキスト）
  - `再生成` ボタン（そのカードだけ再生成）
  - `コピー` ボタン
  - `添削完了` ボタン（= ナレッジ保存）
- 生成中はスケルトン表示

### 6. ナレッジ蓄積（Supabase）

- **保存先**: Supabase（gallery / animator と同じ方針）
- **保存トリガー**: `添削完了` ボタンのみ（手動、自動保存しない）
- **データ構造**: 最終テキスト + タグ配列 + 生成時のプロンプト/モデル/画像パス
- **利用**:
  - 一覧・検索・タグフィルタで閲覧（ナレッジビューア）
  - タグ付けで分類（ブランド / シリーズ / テーマ 等）
- **few-shot 自動投入は MVP スコープ外**（タグ付きナレッジが溜まってから検討）

## 影響範囲

### 既存コードへの影響
- `components/Sidebar.tsx`: `NAV_ITEMS` に `/captions` を追加
- 既存テスト: 影響なし（新規機能のため、既存テストを壊さない）

### 新規ファイル

#### Frontend
- `app/captions/page.tsx` — メイン画面（2カラム: 入力 / 出力 3件）
- `app/captions/knowledge/page.tsx` — ナレッジ一覧（ML 後続タスク）
- `components/captions/CaptionInputPanel.tsx` — 画像 + 状況メモ + 設定 UI
- `components/captions/CaptionResultCard.tsx` — 出力1件分（textarea + 3ボタン）
- `components/captions/PresetEditor.tsx` — プリセット管理（編集・追加・削除）
- `components/captions/StyleControls.tsx` — モデル / 文字数 / 文体切替

#### ロジック
- `lib/captions/buildPrompt.ts` — プリセット + 文字数 + 文体 + 状況メモからプロンプト組み立て
- `lib/captions/presets.ts` — プリセット定義 + LocalStorage I/O
- `lib/captions/parseSituation.ts` — 状況メモ textarea → 箇条書き配列
- `lib/captions/knowledge.ts` — Supabase I/O（保存・一覧・タグ検索）

#### API Route
- `app/api/captions/generate/route.ts` — 画像 + プロンプト → モデル呼び出し（3件並列）
- `app/api/captions/knowledge/route.ts` — POST（保存）/ GET（一覧・タグ検索）

#### Model 呼び出しアダプタ
- `lib/captions/providers/claude.ts`
- `lib/captions/providers/openai.ts`
- `lib/captions/providers/gemini.ts`

### DB スキーマ（Supabase）

```sql
CREATE TABLE caption_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  final_text TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  model TEXT NOT NULL,
  preset_name TEXT,
  target_length INT,
  tone TEXT,
  situation_memo TEXT,
  source_image_path TEXT,
  prompt_snapshot TEXT NOT NULL
);

CREATE INDEX caption_knowledge_tags_idx ON caption_knowledge USING GIN(tags);
CREATE INDEX caption_knowledge_created_at_idx ON caption_knowledge(created_at DESC);
```

## 実装方針（Phase 分割案）

### Phase C1: プロンプト組み立てロジック + LocalStorage プリセット
- `lib/captions/buildPrompt.ts` の TDD
- `lib/captions/parseSituation.ts` の TDD
- `lib/captions/presets.ts` の TDD
- UI なし、純粋ロジックのみ

### Phase C2: UI 骨組み + Claude プロバイダのみで 1件生成
- `/captions` ルート追加 + Sidebar 反映
- 入力パネル（画像 + 状況メモ + 最小限の設定）
- Claude で 1件生成 → 出力カード表示
- 画像 paste / DnD / picker 対応

### Phase C3: 3件並列生成 + 再生成/コピー/編集
- API route を 3件並列に対応
- 各カードに再生成・コピー・編集ボタン
- スケルトン表示

### Phase C4: モデル切替 + プリセット管理 + 文字数/文体切替
- プルダウン・スライダー・ラジオの完全実装
- プリセット編集 UI

### Phase C5: Supabase ナレッジ保存 + 一覧 / タグ検索
- `caption_knowledge` テーブル作成（migration）
- POST / GET API
- 添削完了ボタン
- `/captions/knowledge` 一覧画面

### Phase C6: OpenAI / Gemini プロバイダ追加
- モデル切替で 3社切替可能に

## 未解決の判断事項

なし（MVP 要件は確定）。few-shot 自動投入はナレッジが溜まってから別 Phase で検討。

## 次のステップ

1. この設計メモを k2 に確認（OK なら Phase C1 へ）
2. `docs/test-spec.md` にカテゴリ L / M / N（キャプション関連）を追加して単独 commit
3. Phase C1 から RED/GREEN ループ開始
