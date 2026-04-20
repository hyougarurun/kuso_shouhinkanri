import type { NormalizedMethod } from '../types.js';

const METHOD_MAP: Record<string, NormalizedMethod> = {
  インク: 'ink_print',
  プリント: 'ink_print',
  刺繍: 'embroidery',
  ワッペン: 'patch',
  相良取付: 'sagara_attach',
  相良縫付: 'sagara_attach',
};

export function normalizeMethod(raw: string | undefined | null): NormalizedMethod {
  if (!raw) return 'unspecified';
  const key = raw.trim();
  return METHOD_MAP[key] ?? 'unspecified';
}
