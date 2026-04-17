/**
 * 加工費推定 PoC 型定義
 * 詳細: docs/design-notes/print-cost-estimation.md §5, §6, §7
 */

/** 加工箇所の正規化（§5.3） */
export type NormalizedLocation =
  | 'front'
  | 'back'
  | 'sleeve'
  | 'both_sleeves'
  | 'three_locations'
  | 'sleeve_patch'
  | 'unspecified';

/** 加工方法の正規化（§5.4） */
export type NormalizedMethod =
  | 'ink_print'
  | 'embroidery'
  | 'patch'
  | 'sagara_attach'
  | 'unspecified';

/** 請求書明細のタイプ分類（§5.1） */
export type LineItemType =
  | 'body'
  | 'processing_numbered'
  | 'processing_named'
  | 'material_shipping';

/** 請求書明細（正規化後） */
export type InvoiceLineItem = {
  type: LineItemType;
  raw: string;
  deliveryDate: string;
  deliveryNumber: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;

  // type === 'body' のとき
  bodyCode?: string;
  bodyName?: string;
  sizeRange?: string;
  color?: string;

  // type === 'processing_numbered' のとき
  productNumber?: string;
  location?: NormalizedLocation;
  method?: NormalizedMethod;
};

/** 請求書全体（パーサーの出力） */
export type ParsedInvoice = {
  sourceFile: string;
  totalAmount: number;
  taxAmount: number;
  subtotal: number;
  lineItems: InvoiceLineItem[];
  parsedAt: string;
  parserVersion: string;
};

/** 加工費統計（商品番号ごと） */
export type ProcessingCostStats = {
  productNumber: string;
  records: {
    location: NormalizedLocation;
    method: NormalizedMethod;
    min: number;
    median: number;
    max: number;
    samples: number;
    lastSeen: string;
  }[];
};

/** ボディ単価レンジ */
export type BodyPriceRange = {
  bodyCode: string;
  color: string;
  minPrice: number;
  maxPrice: number;
  sizeExamples: string[];
  lastSeen: string;
};

/** 推論入力（§8.1） */
export type EstimationInput = {
  imagePath: string;
  bodyCode: string;
  locations: NormalizedLocation[];
};

/** 推論出力（§8.3） */
export type EstimationResult = {
  bodyPrice: {
    range: string;
    bodyCode: string;
    color?: string;
  };
  processing: {
    location: NormalizedLocation;
    method: NormalizedMethod;
    estimatedPrice: number;
    confidence: 'high' | 'medium' | 'low';
    basedOn: number;
  }[];
  subtotalProcessing: number;
  notes: string[];
};
