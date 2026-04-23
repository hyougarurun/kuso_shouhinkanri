export type CharacterId =
  | "char-harimeganezumi"
  | "char-kuso-mom"
  | "char-kuso-dad"
  | "char-sakura"
  | "char-imouto"
  | "char-ani"

export interface Character {
  id: CharacterId
  name: string
  titleLabel: string
  promptBody: string
  defaultLength: number
}

export const CHARACTERS: Character[] = [
  {
    id: "char-harimeganezumi",
    name: "ハリメガネズミ",
    titleLabel: "【ハリメガネズミの日記】",
    promptBody:
      "このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。",
    defaultLength: 450,
  },
  {
    id: "char-kuso-mom",
    name: "クソメガネ母",
    titleLabel: "【クソメガネ母の日記】",
    promptBody:
      "このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。かなりスピリチュアルでヒステリックな感じの人の設定で、お母さんの口調で書き進めてください。",
    defaultLength: 450,
  },
  {
    id: "char-kuso-dad",
    name: "クソメガネ父",
    titleLabel: "【クソメガネ父の日記】",
    promptBody:
      "このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。文才の如く書き進めてください。",
    defaultLength: 450,
  },
  {
    id: "char-sakura",
    name: "さくら",
    titleLabel: "【さくらの日記】",
    promptBody:
      "このイラストのストーリーをおもしろおかしく日記風に説明してください。日本語、絵文字たっぷりのギャル文字でお願いします。さくらちゃんとクソメガネというキャラクターの恋愛物語です。",
    defaultLength: 450,
  },
  {
    id: "char-imouto",
    name: "いもうと",
    titleLabel: "【いもうとの日記】",
    promptBody:
      "このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、400〜500字程度。全部ひらがなにしてください。",
    defaultLength: 450,
  },
  {
    id: "char-ani",
    name: "兄",
    titleLabel: "【兄のデコログ】",
    promptBody:
      "このイラストの出来事をおもしろおかしく日記風に説明してください。日本語、少ない文字数で。かなりヤンキーで卍とか使います。",
    defaultLength: 120,
  },
]

const BY_ID: Map<string, Character> = new Map(CHARACTERS.map((c) => [c.id, c]))

export function getCharacter(id: string): Character | undefined {
  return BY_ID.get(id)
}
