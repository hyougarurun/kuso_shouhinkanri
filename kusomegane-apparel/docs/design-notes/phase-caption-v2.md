# Phase Caption v2 設計メモ

Phase C2 で実装した「日記風 / 独り言風 / ポエム風 / ツッコミ風」のジェネリックなプリセット機構を破棄し、
KUSOMEGANE 世界観の「キャラ別」雛形ベースに作り直す。

---

## 1. 完成系フォーマット（コード組み立て）

```
{タイトル}#{話数}

【{titleLabel}】
{AI 生成本文}

Post No.{postNo}
.
#KUSOMEGANE
#ショートアニメ
```

実例（ハリメガネズミ）:
```
ダメージジーンズ病院で回復させメガネ#143

【ハリメガネズミの日記】
今日は父の病院受付の手伝い。…（中略）…何しとんねん。

Post No.168
.
#KUSOMEGANE
#ショートアニメ
```

- `タイトル` は **手動入力**（k2 が毎回考える）
- `話数` `postNo` は **手動 or 自動採番**（後述）
- `titleLabel`（【○○の日記】等）は **キャラ定義に固定**
- 末尾の `.`（半角ドット行）は Instagram 改行隠し用に **常に固定で挿入**
- `#KUSOMEGANE` `#ショートアニメ` は **全キャラ共通固定**（編集 UI なし）
- AI に生成させるのは **本文のみ**（タイトル・タグ等は一切 AI に投げない）

---

## 2. キャラクタ定義（6体）

| id | 表示名 | titleLabel | targetLength（デフォルト） | promptBody（AI への指示）|
|----|-------|-----------|---------------------------|-------------------------|
| `char-harimeganezumi` | ハリメガネズミ | 【ハリメガネズミの日記】 | 450 字 | このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。 |
| `char-kuso-mom` | クソメガネ母 | 【クソメガネ母の日記】 | 450 字 | このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。かなりスピリチュアルでヒステリックな感じの人の設定で、お母さんの口調で書き進めてください。 |
| `char-kuso-dad` | クソメガネ父 | 【クソメガネ父の日記】 | 450 字 | このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。文才の如く書き進めてください。 |
| `char-sakura` | さくら | 【さくらの日記】 | 450 字 | このイラストのストーリーをおもしろおかしく日記風に説明してください。日本語、絵文字たっぷりのギャル文字でお願いします。さくらちゃんとクソメガネというキャラクターの恋愛物語です。 |
| `char-imouto` | いもうと | 【いもうとの日記】 | 450 字 | このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。全部ひらがなにしてください。 |
| `char-ani` | 兄 | 【兄のデコログ】 | 120 字 | このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、少ない文字数で。かなりヤンキーで卍とか使います。 |

注: `titleLabel` の最終確定は k2 から後追いで全員分が来る予定（このメモの値は雛形からの暫定）。

---

## 3. カウンター（話数 / Post No.）

`localStorage` に **2 本独立** で持つ:

- `kuso:post-caption:counter:episode` → 話数（例: 143）
- `kuso:post-caption:counter:postNo` → Post No.（例: 168）

API:
- `getCounter(kind: "episode" | "postNo"): number | null` — 未設定なら null
- `setCounter(kind, value: number)` — 手動入力で初期値 / 任意の値に上書き
- `bumpCounter(kind): number` — 現在値 +1 して返す。未設定なら例外（UI 側で「初期値を入れてください」を出す）

UI フロー:
1. 初回はユーザーが手動入力 → 「この値で確定」ボタンで `setCounter`
2. 2 回目以降は「+1 自動採番」ボタンで `bumpCounter`
3. いつでも手動上書き可

---

## 4. AI 入力（プロンプト）

`buildPrompt(input)` の出力例:
```
このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。

## 状況メモ
- 父の病院受付を手伝う
- クソメガネ母がダメージジーンズを連れて初診で来る

## 出力ルール
- 本文のみを返してください（タイトル・ハッシュタグ・Post No. は不要）
- 文字数: 450 字程度
```

- 1 行目: キャラの `promptBody` をそのまま貼る
- `## 状況メモ` ブロック: 状況メモが空なら丸ごと省略し、代わりに「状況メモはありません。画像から読み取って書いてください。」を入れる
- `## 出力ルール`: 本文のみを返すよう明示・文字数を明示

画像（イラスト）はマルチモーダル入力として API 経由で Claude に渡す（既存実装を踏襲）。

---

## 5. composeCaption（最終キャプション組み立て）

```ts
composeCaption({
  title: "ダメージジーンズ病院で回復させメガネ",
  episode: 143,
  characterId: "char-harimeganezumi",
  body: "今日は父の病院受付の手伝い。…",
  postNo: 168,
}) →
"ダメージジーンズ病院で回復させメガネ#143\n\n【ハリメガネズミの日記】\n今日は父の病院受付の手伝い。…\n\nPost No.168\n.\n#KUSOMEGANE\n#ショートアニメ"
```

- 不正な characterId なら例外
- title が空なら `#{episode}` だけの 1 行になる（後で UI で必須バリデーション）
- 本文は trim する（前後の改行のみ）

---

## 6. 既存実装の扱い

破棄するもの:
- `lib/postCaption/presets.ts`（プリセット機構）
- `__tests__/postCaption/presets.test.ts`
- `__tests__/postCaption/buildPrompt.test.ts`（旧版）
- `lib/postCaption/buildPrompt.ts` の中身（型は再定義）
- `lib/postCaption/constants.ts` の TONE_OPTIONS / LENGTH_PRESETS の一部（character 単位の文字数になるため）

流用するもの:
- `lib/postCaption/parseSituation.ts` と対応テスト（変更なし）
- `app/api/post-captions/generate/route.ts` の Claude 呼び出し基盤（入出力は再定義）
- `app/captions/page.tsx` の画像アップロード UI（DnD / Paste / リサイズ）

新規:
- `lib/postCaption/characters.ts`
- `lib/postCaption/counters.ts`
- `lib/postCaption/composeCaption.ts`

---

## 7. テスト分類（test-spec L/M/N の再定義）

- **L. parseSituation** — 既存の TC-PS-001〜005 をそのまま流用
- **M. characters / buildPrompt** — キャラ定義 + プロンプト組み立て
- **N. counters** — 話数 / Post No. の永続化 + 採番
- **O. composeCaption** — 最終キャプション組み立て（新カテゴリ）

---

## 8. Phase 分割（v2 化）

- **C2.1**: lib 層のリライト（characters / buildPrompt / counters / composeCaption + 既存テスト整理）
- **C2.2**: API 入力を character ベースに更新
- **C2.3**: UI を新設計に更新（キャラ選択 / タイトル入力 / 話数・Post No. UI）

C3 以降は元の計画通り（3 件並列生成等）。
