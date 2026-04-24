# 構造的懸念・問題の洗い出し（2026-04-24 時点）

Phase F1〜F6 完了後のフィードバック起点で、ツール全体の構造的な懸念を 1 人運用前提でリストアップする。
優先度は **High（早めに着手したい） / Medium（次の中規模 Phase） / Low（余裕があれば）**。

---

## High：早めに着手したい

### H1. 商品データの永続化が IndexedDB 単独
- 現状: `Product` 全体は IndexedDB のみ。Supabase 同期なし。画像/モデル/ギャラリー/アセットだけ Supabase。
- 影響:
  - PC 切り替え不可・複数端末同時閲覧不可
  - ブラウザのストレージクリアや IndexedDB 破損で**全商品データ消失**のリスク
  - すでに caption_assets / base_models / gallery は Supabase 化されているのに、商品本体だけ取り残されている
- 推奨: Phase 1 計画にある「商品テーブルへの同期」を最優先で着手。少なくとも write-through（IndexedDB に書く時に Supabase upsert もする）レベルから始める

### H2. 商品番号 (`product_number`) と外部参照の弱結合
- 現状: 商品番号は **編集可能** だが、Sheets 行・Drive フォルダ名・ZIP ファイル名（`{productNumber}_{name}.zip`）は古いまま
- 影響: 編集 dialog で「手動で直してください」と注意するだけ。ヒューマンエラーの温床
- 推奨案:
  - A) 商品番号編集時に Drive フォルダ rename / Sheets 該当行更新を自動化
  - B) 商品の不変 ID（既存 uuid）を主キー扱いとして外部連携、表示用商品番号は別カラム化
  - 手早く実装するなら A、本質的には B

### H3. テストカバレッジが lib 層に偏っている
- 現状: vitest 23 ファイル 135 件。すべて lib/ 純ロジック。UI コンポーネントは手動確認
- 影響: F1〜F6 のような UI 連続改修でリグレッション検出が k2 の目視に依存
- 推奨:
  - 重要画面（CaptionBlock, ProductCard, StepTimeline）に Testing Library で smoke test 1〜2 件
  - 致命パス（決済・登録・削除）が増えたら Playwright で 1 シナリオ
  - 全部はやらない。**「壊れたら業務止まる」箇所だけ E2E**

### H4. `react-hooks/set-state-in-effect` の lint 違反が累積
- 既存: `app/page.tsx:40`（フィルタ復元）, `components/HomeMemo.tsx:19`（永続値復元・disable で抑制中）
- 影響: 今は警告止まりだが React 19 の strict 化や Next.js のビルドゲートで CI が落ちる可能性
- 推奨: `useSyncExternalStore` ベースのカスタムフック `useLocalStorageValue(key, default)` を導入し全置換

---

## Medium：次の中規模 Phase で

### M1. Caption Asset / 商品データの Supabase 障害時フォールバックなし
- 現状: caption_assets は Supabase 直結。Supabase ダウン時 CaptionBlock のアセット枠が常時エラー
- 推奨: localStorage キャッシュを併用（最終取得値を保持して読み専用で見せる）

### M2. AI プロバイダ統合層が不在
- 現状: Phase Caption v2 は Claude のみ。`lib/postCaption/providers/claude.ts` あり、OpenAI/Gemini は Phase C6 予定
- 影響: 各プロバイダ追加時に重複コード化しやすい
- 推奨: `lib/llm/` にプロバイダ抽象（`generate(input): Promise<string>`）を切り、`anthropic.ts / openai.ts / gemini.ts` を実装する形に移行

### M3. Drive / Sheets 連携のエラー復旧手順が不明
- 現状: 連携失敗時の状態が DB 内に残る（`sheetRowNumbers`, `driveFolderUrl`）。再試行 UI は限定的
- 推奨: 「連携状態の正規化（DB と外部の差分検出）」リコンサイルジョブを 1 つ作って手動実行可能にする

### M4. components/ がフラット 30 ファイル
- 現状: `components/` 直下 + `components/post-caption/`, `components/wizard/`, `components/schedule/` 混在
- 推奨: 機能境界でサブフォルダ統一（`components/products/`, `components/captions/`, `components/home/`, `components/common/`）。1 度に全部やらず、新規追加の都度フォルダ統合を優先

### M5. エラー UI が `alert()` 多用
- 現状: CaptionAssetsPanel / ProductCard 等で `alert()` / `confirm()`
- 影響: モバイル風デザインに違和感、テスト困難
- 推奨: 軽量トースト（react-hot-toast 等）を 1 つ入れて統一

---

## Low：余裕があれば

### L1. Supabase Storage の肥大化対策
- base_models / animator-library / product-gallery / creator-backgrounds が増え続ける
- 推奨: 月次で「不参照ファイル一覧」を出す管理コマンドを作る（即削除はせず一覧化のみ）

### L2. Phase ナンバリングが乱立（C/P/A/E/F/ANM/G/...）
- リリースノート的な俯瞰が難しい
- 推奨: `docs/CHANGELOG.md` を作って Phase → 機能名 → ユーザー影響 の 3 列表で時系列維持

### L3. Supabase RLS 全 disable
- 1 人運用なので OK。ただし `NEXT_PUBLIC_SUPABASE_URL` + `PUBLISHABLE_KEY` がフロントから見える
- 推奨: 公開キーで anon 操作可な範囲を確認（現状 Read 系を anon に開放しているなら制限）

### L4. Wizard `wizardToProducts` のコードが Phase E2 後に冗長
- `productNumbers.length > 1` の分岐は Phase E2 で常に false に
- 推奨: 次の Wizard 改修時に「単一商品前提」へ簡素化

### L5. `baseProductNumber` / `colorVariantIndex` の死蔵フィールド
- 既存データ互換のため残置中
- 推奨: 既存 nn-n データを全件編集 UI で直し終わったら、型定義からも削除して Supabase スキーマ整理

---

## 直近の優先順位（提案）

1. **H1（商品データ Supabase 同期）** — 最大リスク・他の改善の前提条件
2. **H4（lint 違反の根治）** — 修正コスト小・将来痛い
3. **H2（商品番号と外部参照）** — H1 の後に Drive/Sheets 同期パターンを揃えて
4. **M1（Supabase 障害フォールバック）** — H1 着手中に並行で
5. **H3（UI テスト）** — H1〜H4 の作業中にスモークテスト 1〜2 件追加するスタイルで

その他は Phase C3 以降の機能拡張ペースに合わせて段階的に。

---

## 直近の Phase 分割案（k2 の判断待ち）

| 仮 Phase | 内容 | 工数感 |
|----------|------|-------|
| **G1** | 商品 Supabase 書き込みパス（IndexedDB と並行 write-through） | 中 |
| **G2** | 商品 Supabase 読み込みパス（起動時に Supabase → IndexedDB に流し込み） | 中 |
| **G3** | 商品番号編集時の Sheets / Drive 同期 | 小〜中 |
| **G4** | `useLocalStorageValue` フック + 既存 lint 違反置換 | 小 |
| **G5** | Caption Asset の localStorage キャッシュ | 小 |
| **C3** | Phase Caption 3 件並列生成（既存ロードマップ） | 小〜中 |

着手順は H1 から、と推奨。
