import type { NormalizedLocation } from '../types.js';

const LOCATION_MAP: Record<string, NormalizedLocation> = {
  front: 'front',
  正面: 'front',
  back: 'back',
  bavk: 'back',
  袖: 'sleeve',
  そで: 'sleeve',
  両袖: 'both_sleeves',
  両腕: 'both_sleeves',
  三か所: 'three_locations',
  '3か所': 'three_locations',
  プリント三か所: 'three_locations',
  袖ワッペン: 'sleeve_patch',
};

export function normalizeLocation(raw: string | undefined | null): NormalizedLocation {
  if (!raw) return 'unspecified';
  const key = raw.trim();
  return LOCATION_MAP[key] ?? 'unspecified';
}
