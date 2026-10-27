import { Readability } from '@mozilla/readability';
import type { Article } from '../../types';

function meta(doc: Document, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const value = doc.querySelector<HTMLMetaElement>(selector)?.content?.trim();
    if (value) return value;
  }
  return undefined;
}

export function extractArticle(doc: Document, pageUrl: string): Article {
  const url = new URL(pageUrl);
  const canonical = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? pageUrl;
  const parsed = new Readability(doc.cloneNode(true) as Document, { charThreshold: 300 }).parse();
  const text = parsed?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const title = parsed?.title?.trim() || doc.title.trim();
  const publishedAt = meta(doc, ['meta[property="article:published_time"]', 'meta[name="date"]', 'meta[name="pubdate"]']);
  const publisher = meta(doc, ['meta[property="og:site_name"]', 'meta[name="application-name"]']) ?? url.hostname.replace(/^www\./, '');
  const wordCount = text ? text.split(/\s+/).length : 0;
  const isArticle = Boolean(parsed && title && wordCount >= 120);
  return {
    title: title || 'Untitled page',
    ...(parsed?.byline ? { byline: parsed.byline } : {}),
    publisher,
    domain: url.hostname,
    ...(publishedAt ? { publishedAt } : {}),
    canonicalUrl: canonical,
    ...(parsed?.excerpt ? { excerpt: parsed.excerpt } : {}),
    text,
    wordCount,
    isArticle,
    ...(!isArticle ? { reason: 'The page does not contain enough article-like text.' } : {})
  };
}
