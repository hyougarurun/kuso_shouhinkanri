# TDDワークフロー

このルールは全ての実装作業に適用される。例外なし。
詳細な禁止事項とRED/GREEN/REFACTORの厳格分離は `.claude/rules/tdd-integrity-contract.md` を参照。

## 原則: テスト設計が先、実装が後

```
要件確認 → テスト設計 → テスト設計commit → RED → GREEN → REFACTOR → 実装commit
```

この順序を絶対に破らない。

## 新規機能の場合

### STEP A: テスト設計（docs/test-spec.md の更新）

1. `docs/test-spec.md` を開いて、関連するテストケースが存在しないことを確認する
2. テストデータが必要なら「テストデータ一覧」に先に追加する
3. テストケースを追加する（フォーマットは test-spec.md のテンプレートに従う）
4. 以下を必ず含める:
   - **UI実機パス**: 実際のルーティングパスとdata-testid。ボタン等が見つからない場合の代替手段も記載
   - **テストデータ要件**: テストデータ一覧のIDを参照。新規データなら作成手順まで記載
   - **前提条件**: テスト実行に必要な状態を全て列挙。「〜済みであること」だけでなく、その状態の作り方も記載
   - **NG例**: テスターが判断に迷うケースを具体的に記載
5. テスト設計だけを単独でcommitする: `テスト設計: {機能名}のテストケース追加`

### STEP B: RED → GREEN → REFACTOR ループ

テストケース1つごとに以下のループを回す:

1. **RED**: テストファイルだけを編集し、1つの failing test を追加
2. 失敗を実行ログで確認
3. **GREEN**: 実装ファイルだけを編集し、最小変更で PASS させる
4. 成功を実行ログで確認
5. **REFACTOR**: 振る舞いを変えない整理（必要な場合のみ）
6. 全テストがPASSし続けることを確認
7. 次のテストケースに移る（1へ戻る）

複数テストケースを一度にRED化してからまとめてGREENにするのは禁止。

### STEP C: 実装完了時

1. TDD Ledger を出力する
2. 停止前の必須チェック（focused test / affected suite / lint / typecheck）を全てPASS
3. 実装をcommitする

## 既存機能の修正・改修・拡張の場合

### STEP A: 影響範囲の特定とテスト設計更新

1. `docs/test-spec.md` を検索して、該当機能の既存テストケースを特定する
2. 変更の影響を受けるテストケースを全てリストアップする
3. ユーザーに影響範囲を提示する:
   ```
   この変更は以下のテストケースに影響します:
   - TC-XXX-001: [テスト名] → [変更内容]
   - TC-XXX-003: [テスト名] → [変更内容]
   追加するテストケース:
   - TC-XXX-010: [新規テスト名]
   テスト設計を更新してよいですか？ → Y / N
   ```
4. 承認後、テスト設計を更新してcommit

### STEP B: RED → GREEN → REFACTOR ループ

新規機能と同じく、テストケース1つごとにループを回す。

**重要**: 既存の失敗していないテストを壊した場合、それはリグレッション。
REDフェーズに戻って、壊したテストに対応する修正テストを先に書く。

## Phase分割ルール

実装は4-5ステップ以内のPhaseに分割する。

- 各Phaseは「1つの機能単位」であり、複数のRED/GREEN/REFACTORループを含む
- 各Phase完了時にTDD Ledgerを出力する
- Phase完了時に `docs/progress.md` を更新する

## テスト実行後のフロー

- 全テストPASS → TDD Ledger出力 → 実装をcommit → `docs/progress.md` 更新
- テスト FAIL → 失敗原因を特定 → GREENフェーズに戻って修正（テストを弱めるな）
- 3回リトライしてもFAIL → ユーザーに報告して判断を仰ぐ

## 禁止事項（Integrity Contract より抜粋）

以下は発見次第、作業を停止してユーザーに報告する:
- failing test の削除・skip化・only化・xfail化・todo化
- assertion を弱めること
- snapshot / golden file の安易な一括更新
- coverage threshold の引き下げ
- test 環境だけ通る分岐の追加
- テスト入力にだけ最適化したハードコード
- `sed -i` / `perl -pi` / `python -c` / `node -e` 等での直接書き換え

詳細は `.claude/rules/tdd-integrity-contract.md` を参照。

## commit時の自動チェック

git commit実行時、hookが以下を確認する:
- 変更されたファイルに対応するテストケースが `docs/test-spec.md` に存在するか
- テストケースの `最終検証日` が30日以内か
- TDD Ledger が直近の作業ログに存在するか

不足がある場合はユーザーに通知する。
