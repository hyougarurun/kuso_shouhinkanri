import type { LineItemType } from '../types.js';

export function classifyLineItem(raw: string): LineItemType {
  if (/^メガメガ\s*\d/.test(raw)) return 'processing_numbered';
  if (/^メガメガ/.test(raw)) return 'processing_named';
  if (/^\d{4}-\d{2,3}/.test(raw)) return 'body';
  if (/佐川急便|手数料|OPP|タグ|送料/.test(raw)) return 'material_shipping';
  return 'processing_named';
}
