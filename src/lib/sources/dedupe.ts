import type { RelatedArticle } from '../../types';
export function normaliseDomain(value: string): string {
  const raw = value.includes('://') ? value : `https://${value}`;
  return new URL(raw).hostname.toLowerCase().replace(/^www\./, '').replace(/^amp\./, '');
}
export function normaliseTitle(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}
export function dedupeArticles(items: RelatedArticle[]): RelatedArticle[] {
  const urls = new Set<string>(); const titles = new Set<string>();
  return items.filter((item) => {
    let canonical = item.url;
    try {
      const url = new URL(item.url); url.hash = '';
      for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_') || key === 'gclid') url.searchParams.delete(key);
      canonical = url.toString();
    } catch { /* retain source URL */ }
    const title = normaliseTitle(item.title);
    if (urls.has(canonical) || titles.has(title)) return false;
    urls.add(canonical); titles.add(title); return true;
  });
}
