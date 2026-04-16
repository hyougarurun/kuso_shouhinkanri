# TDD Integrity Contract

このルールはTDD実行時の絶対契約である。例外なく全ての実装作業に適用される。
AIがテストを「攻略」する（テストの抜け道を突く）挙動を構造的に防ぐことが目的。

---

## 原則: RED → GREEN → REFACTOR の厳格分離

開発は必ず以下の順序で進める。フェーズを混ぜることは禁止。

```
RED (テスト追加) → GREEN (実装) → REFACTOR (整理)
```

各フェーズで編集可能なファイルは厳密に限定される。違反すれば作業を停止し、ユーザーに報告する。

---

## RED フェーズ

### やること
- **テストファイルだけ**を編集する
- 一度に追加する新しい失敗（failing test）は **1つだけ**
- 失敗することを実際にテスト実行で確認する
- 失敗ログを TDD Ledger に記録する

### やってはいけないこと
- 実装コード（src/, lib/, app/ 等）の編集
- 一度に複数の failing test を追加すること
- 失敗を確認せずにGREENに進むこと

### フェーズ遷移条件
- 1つの failing test が実際に失敗していることを実行ログで確認 → GREEN へ

---

## GREEN フェーズ

### やること
- **実装コードだけ**を編集する
- 直前の failing test を通すための **最小変更**だけを入れる
- フォーカステストで実際にPASSすることを確認する

### やってはいけないこと
- テストファイルの編集（`*.test.*`, `*_test.*`, `tests/`, `__tests__/`, `spec/`）
- snapshot ファイルの編集（`__snapshots__/`, `*.snap`）
- fixture データの編集（テストデータを実装に合わせて書き換えること）
- coverage 設定の編集（`jest.config.*`, `vitest.config.*`, `.coveragerc`, `coverage` フィールド等）
- CI設定の編集（`.github/workflows/`, `.gitlab-ci.yml` 等）
- 要件を超えた機能の追加（YAGNI違反）

### フェーズ遷移条件
- 対象の failing test が PASS する
- 既存テストが1つも壊れていない
- → REFACTOR へ（不要ならそのまま次のREDへ）

---

## REFACTOR フェーズ

### やること
- **振る舞いを変えない整理**だけを行う
- リネーム、関数抽出、重複除去、コメント追加、型付け等
- 全テストがPASSし続けることを確認する

### やってはいけないこと
- 振る舞いの変更（新機能追加、既存ロジックの意味変更）
- テストの編集
- 「ついでの改善」

### 振る舞い変更が必要になったら
- REFACTORを中止してREDに戻る

---

## 常に禁止（全フェーズ共通）

以下は発見次第作業を停止し、ユーザーに報告する:

### テスト不正操作
- **failing test の削除**
- **skip / only / xfail / todo 化**（`.skip`, `.only`, `xit`, `xdescribe`, `@pytest.mark.skip`, `@pytest.mark.xfail` 等）
- **assertion を弱めること**（`toBe` → `toBeTruthy`、厳密比較 → 部分一致、具体値 → `expect.any()` への後退）
- **snapshot / golden file の安易な更新**（`--updateSnapshot`, `-u` フラグでの一括更新）
- **coverage threshold の引き下げ**

### テスト回避のための実装汚染
- **test 環境だけ通る分岐の追加**（`if (process.env.NODE_ENV === 'test')` 等）
- **テスト入力にだけ最適化したハードコード**（`if (input === 'expectedTestValue') return 'expected'`）
- **production code から test file / fixture を読むこと**

### レビュー回避のための直接書き換え
以下のコマンドは使用禁止（`.claude/settings.json` でdenyされる）:
- `sed -i`, `sed --in-place`
- `perl -pi`, `perl -i`
- `python -c "..."`（ファイル書き換え目的）
- `node -e "..."`（ファイル書き換え目的）
- `awk -i inplace`
- `tee` によるファイル上書き

ファイル編集は必ず Edit / Write ツールで行う（差分がユーザーに見える形で）。

---

## 停止前の必須チェック

作業を一区切りつける前に、以下を必ず実行する:

1. **focused test 実行** — 今回追加・修正したテストが PASS
2. **affected suite 実行** — 影響範囲のテストスイート全体が PASS
3. **lint 実行** — コードスタイル違反なし
4. **typecheck 実行** — 型エラーなし
5. **TDD Ledger 出力** — 以下のフォーマットで報告

---

## TDD Ledger（必須報告フォーマット）

作業完了時、以下を必ず出力する:

```markdown
## TDD Ledger

### Phase
{RED / GREEN / REFACTOR}

### Changed files
- tests/example.test.ts（追加: should return X for Y）
- src/example.ts（実装: handleY関数）

### Test commands executed
- `pnpm vitest run tests/example.test.ts` → PASS (3/3)
- `pnpm vitest run` → PASS (127/127)
- `pnpm lint` → OK
- `pnpm typecheck` → OK

### Why this change is minimal
- handleY関数に早期リターンを1行追加するだけで PASS
- 他の分岐や最適化は入れていない

### What would count as cheating here
- テスト期待値 "Y" をハードコードで返すこと
- handleY関数にテスト用のデバッグ分岐を入れること
- 既存テストの assertion を緩めて「通った」とすること
```

このLedgerなしに作業完了を宣言することは禁止。

---

## 違反時の対応

### AIが違反を検出した場合
1. 作業を即座に停止する
2. 違反内容をユーザーに報告する
3. 正しい手順で再実行する提案を出す

### hooksが違反を検出した場合
- Edit/Writeがdenyされる → 別フェーズでの編集を試みる
- Bash(sed -i等)がdenyされる → Edit ツールで書き換える

### ユーザーが違反を発見した場合
- 該当の変更を revert する
- `.claude/rules/mistakes.md` に事例を追記する

---

## 最後の砦: Mutation Testing（推奨）

AIがテストだけに最適化した実装を出しても、mutation testing で露呈しやすくなる。
可能なプロジェクトでは以下の導入を推奨:

- **TypeScript / JavaScript**: [Stryker Mutator](https://stryker-mutator.io/)
- **Python**: [mutmut](https://github.com/boxed/mutmut)
- **その他**: 言語標準のmutation testingツール

mutation score が一定以下の場合はテスト品質が不十分と判定する。
