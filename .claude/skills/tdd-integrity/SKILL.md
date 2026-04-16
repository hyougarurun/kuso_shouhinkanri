---
name: tdd-integrity
description: >
  RED→GREEN→REFACTORの厳格分離でTDDを強制実行する。
  「実装して」「機能追加」「バグ修正」「テスト駆動で」
  などの実装系キーワードで自動起動する。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# TDD Integrity スキル

RED → GREEN → REFACTOR の厳格分離を強制し、AIがテストを「攻略」することを防ぐ。

**事前に必ず読む**: `.claude/rules/tdd-integrity-contract.md`

---

## 起動時の宣言

作業開始時、必ず以下を宣言してからフェーズに入る:

```
## TDD Integrity 実行開始

### 変更したい振る舞い（1つに絞る）
{具体的な振る舞いを1文で記述}

### 対象ファイル
- テストファイル: {path}
- 実装ファイル: {path}

### 現在のフェーズ
RED（テスト追加）

開始します。
```

複数の振る舞いを同時に扱おうとするな。必ず1つずつ。

---

## RED フェーズ

### やること
1. テストファイル **のみ** を開く
2. 1つの failing test を追加する
3. テストを実行して **実際に失敗する** ことを確認する
4. 失敗ログを記録する

### 禁止
- 実装ファイルを開くこと
- 複数の failing test を一度に追加すること
- テスト実行せずにGREENに進むこと

### 終了条件
```
RED フェーズ完了:
  追加テスト: {test name}
  失敗確認: {test command} → FAIL (期待通り)
  失敗メッセージ: {抜粋}

GREEN フェーズに進みます。
```

---

## GREEN フェーズ

### やること
1. 実装ファイル **のみ** を開く
2. 直前の failing test を通すための **最小変更** を入れる
3. フォーカステストを実行して PASS を確認する
4. 既存テストが壊れていないことを確認する

### 禁止事項チェック（自己監査）
実装前に以下を自問せよ:
- [ ] テストファイル、snapshot、fixture、coverage設定を編集しようとしていないか？
- [ ] `process.env.NODE_ENV === 'test'` のような test 環境分岐を入れていないか？
- [ ] テスト入力の特定値をハードコードで返していないか？
- [ ] production code から test file / fixture を読もうとしていないか？
- [ ] 要件を超えた機能を追加していないか？（YAGNI）

1つでも該当したら実装を中止してユーザーに報告せよ。

### 終了条件
```
GREEN フェーズ完了:
  実装変更: {変更内容を1行で}
  フォーカステスト: {test command} → PASS
  既存テスト: {affected suite command} → PASS (X/X)

必要ならREFACTOR、不要なら次のテストケースまたは完了報告へ。
```

---

## REFACTOR フェーズ（任意）

### やること
1. 振る舞いを変えない整理のみ行う
2. 各変更後に全テストを実行してPASSし続けることを確認する

### 禁止
- 振る舞いの変更
- テストの編集
- 「ついでの改善」

振る舞い変更が必要になったらREFACTORを中止し、REDに戻る。

### 終了条件
```
REFACTOR フェーズ完了:
  整理内容: {内容}
  全テスト: {test command} → PASS (X/X)
```

---

## 作業完了時の TDD Ledger 出力（必須）

作業を一区切りつける前に、以下を **必ず** 出力する:

```markdown
## TDD Ledger

### Phase
{RED / GREEN / REFACTOR / 全サイクル完了}

### Behavior implemented
{実装した振る舞いを1文で}

### Changed files
- {test file path}（{追加したテストの概要}）
- {implementation file path}（{実装変更の概要}）

### Test commands executed
- `{focused test command}` → PASS (X/X)
- `{affected suite command}` → PASS (X/X)
- `{lint command}` → OK
- `{typecheck command}` → OK

### Why this change is minimal
{最小変更であることの根拠を具体的に}

### What would count as cheating here
{この変更で起こりうる不正パターンを具体的に列挙}
- 例: テスト期待値 "foo" をハードコードで返すこと
- 例: if (input === 'testCase1') return 'expected'
```

Ledger出力なしに「完了しました」と報告することは禁止。

---

## 違反検出時の対応

### AI自身が違反に気づいた場合
1. 作業を即座に停止する
2. 違反内容をユーザーに報告する:
   ```
   TDD Integrity違反を検出しました:
     違反内容: {内容}
     該当箇所: {ファイル:行番号}
     対応策: {正しい手順}
   ```
3. ユーザーの承認を得てから正しい手順で再実行する

### hooksにブロックされた場合（Bash deny等）
- Edit/Write ツールで代替する
- 代替できない場合はユーザーに相談する

---

## よくあるミスパターン（検出用）

以下のパターンは必ず停止する:

### パターン1: テストと実装を同時編集
```
❌ RED中にsrc/foo.tsも編集
❌ GREEN中にtests/foo.test.tsも編集
```

### パターン2: テストを弱める
```
❌ expect(result).toBe(42) → expect(result).toBeTruthy()
❌ expect(arr).toEqual([1,2,3]) → expect(arr.length).toBeGreaterThan(0)
```

### パターン3: skipで逃げる
```
❌ test.skip('should do X', ...)
❌ it.only('one passing test', ...) で他を無視
❌ @pytest.mark.skip をテストが通らないから追加
```

### パターン4: テスト用ハードコード
```
❌ if (process.env.NODE_ENV === 'test') return 'mocked'
❌ if (userId === 'test-user-001') return testFixture
```

### パターン5: snapshot一括更新で通す
```
❌ vitest -u  (failing snapshotを無思考で更新)
❌ jest --updateSnapshot
```

いずれも発見次第停止して報告せよ。
