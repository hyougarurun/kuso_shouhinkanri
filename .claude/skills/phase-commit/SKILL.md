---
name: phase-commit
description: >
  Phase完了時のcommitと進捗更新を実行する。
  「Phase完了」「フェーズ終わり」「commit」「コミットして」
  などのキーワードで自動起動する。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

Phase完了時の一連の処理を実行しろ。

## 手順

1. 現在のPhaseの作業内容を確認する
2. テストを実行して結果を確認する
3. テストが全てPASSしていることを確認する（FAILがあれば停止）
4. 以下を順番に実行する:

### 4-1. docs/progress.md を更新
- 完了したPhaseの情報を記録
- 次のPhaseの情報を記載
- テスト状況を更新

### 4-2. docs/test-spec.md のテスト結果を更新
- 実行したテストケースの結果を記入（PASS/FAIL）

### 4-3. git commit
- 変更ファイルをステージング
- コミットメッセージ: `Phase {X}: {実装内容の要約}`
- docs/progress.md と docs/test-spec.md の更新も含める

### 4-4. 報告
```
Phase {X} 完了:
  実装内容: {概要}
  テスト結果: {X}/{Y} PASS
  次のPhase: {Phase X+1 の内容}
  
  続けますか？ → Y / N
```

## テストFAIL時

- 停止してユーザーに報告する
- commitしない
- 失敗原因の分析結果を提示する
