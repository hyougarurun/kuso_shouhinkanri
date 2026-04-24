export const FLOW_STEPS = [
  { id: 1, name: "デザイン作成", icon: "✏️" },
  { id: 2, name: "合成 & 登録", icon: "🖼️" },
  { id: 3, name: "Drive格納", icon: "📁" },
  { id: 4, name: "メーカー共有（サンプル依頼）", icon: "📤" },
  { id: 5, name: "サンプル到着確認", icon: "📦" },
  { id: 6, name: "正式発注 & 物撮り", icon: "📸" },
  { id: 7, name: "商品登録素材準備", icon: "📋" },
  { id: 8, name: "販売準備完了", icon: "🚀" },
] as const

export const COLOR_OPTIONS = [
  "ブラック",
  "ホワイト",
  "ネイビー",
  "グレー",
  "ミックスグレー",
  "ピンク",
  "アッシュ",
  "マリンブルー",
  "キャメル",
  "ロイヤルブルー",
  "アシッドブルー",
  "アイビーグリーン",
  "ヘイジーブラック",
  "バニラホワイト",
  "ナチュラル",
  "フリー",
] as const

export const SIZE_OPTIONS = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "フリー",
  "90〜XXXL",
  "その他",
] as const

export const PROCESSING_OPTIONS = [
  "刺繍",
  "プリント（インク）",
  "DTF",
  "転写",
  "刺繍+インク",
  "刺繍+DTF",
] as const

export const PRODUCT_TYPE_OPTIONS = [
  "Tシャツ",
  "パーカー",
  "スウェット",
  "ロンT",
  "トートバッグ",
  "キャップ",
  "その他",
] as const

export const BRAND_YELLOW = "#FFD600"
export const BRAND_BLACK = "#111111"
export const STEP_DONE = "#22C55E"
export const STEP_ACTIVE = "#FFD600"
export const STEP_PENDING = "#E5E7EB"

export const INITIAL_MAX_PRODUCT_NUMBER = 58

export const DEFAULT_MATERIAL = "綿100% 5.6oz"

export const STORAGE_KEYS = {
  PRODUCTS: "kusomegane_products",
  SETTINGS: "kusomegane_settings",
  DRAFT: "kusomegane_draft",
  BODY_MODELS: "kusomegane_body_models",
} as const
