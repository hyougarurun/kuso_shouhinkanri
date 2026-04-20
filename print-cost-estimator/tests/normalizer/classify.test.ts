import { describe, it, expect } from 'vitest';
import { classifyLineItem } from '../../src/normalizer/classify.js';

describe('classifyLineItem', () => {
  it('TC-POC-CLS-001: 番号付きメガメガ商品は processing_numbered に分類される', () => {
    expect(classifyLineItem('メガメガ 14-1 front')).toBe('processing_numbered');
  });

  it('TC-POC-CLS-002: キャラ名付きメガメガ商品は processing_named に分類される', () => {
    expect(classifyLineItem('メガメガ ローレンくん')).toBe('processing_named');
  });

  it('TC-POC-CLS-003: ボディ明細は body に分類される', () => {
    expect(
      classifyLineItem('5001-01 5.6オンス ハイクオリティーTシャツ〈アダルト〉・XXLホワイト'),
    ).toBe('body');
  });

  it('TC-POC-CLS-004: 副資材・送料は material_shipping に分類される', () => {
    expect(classifyLineItem('たたみOPP入れ')).toBe('material_shipping');
    expect(classifyLineItem('佐川急便 関西140サイズ')).toBe('material_shipping');
    expect(classifyLineItem('タグ一辺縫い')).toBe('material_shipping');
    expect(classifyLineItem('ユナイテッドアスレ取り寄せ手数料')).toBe('material_shipping');
    expect(classifyLineItem('ボディ手配送料')).toBe('material_shipping');
  });
});
