import Dexie, { type EntityTable } from 'dexie';
import type { AnalysisResult } from '../../types';

interface CacheRow { url: string; expiresAt: number; result: AnalysisResult; }
class ParallaxDatabase extends Dexie {
  analyses!: EntityTable<CacheRow, 'url'>;
  constructor() { super('parallax'); this.version(1).stores({ analyses: '&url, expiresAt' }); }
}
export const db = new ParallaxDatabase();
export async function getCached(url: string): Promise<AnalysisResult | null> {
  const row = await db.analyses.get(url);
  if (!row) return null;
  if (row.expiresAt < Date.now()) { await db.analyses.delete(url); return null; }
  return row.result;
}
export async function putCached(result: AnalysisResult, ttlHours = 24) {
  await db.analyses.put({ url: result.article.canonicalUrl, result, expiresAt: Date.now() + ttlHours * 3_600_000 });
}
export async function clearCache() { await db.analyses.clear(); }
