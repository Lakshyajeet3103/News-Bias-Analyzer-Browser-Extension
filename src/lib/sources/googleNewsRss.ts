import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import type { RelatedArticle } from '../../types';

const FeedSchema = z.object({ rss: z.object({ channel: z.object({ item: z.union([z.array(z.any()), z.any()]).optional() }) }) });
export async function fetchGoogleNews(query: string, signal?: AbortSignal): Promise<RelatedArticle[]> {
  const url = new URL('https://news.google.com/rss/search');
  url.search = new URLSearchParams({ q: `${query} when:2d`, hl: 'en-US', gl: 'US', ceid: 'US:en' }).toString();
  const response = await fetch(url, signal ? { signal } : {});
  if (!response.ok) throw new Error(`Google News RSS returned ${response.status}`);
  const raw = FeedSchema.parse(new XMLParser({ ignoreAttributes: false }).parse(await response.text()));
  const list = raw.rss.channel.item ? (Array.isArray(raw.rss.channel.item) ? raw.rss.channel.item : [raw.rss.channel.item]) : [];
  return list.slice(0, 40).flatMap((item: unknown, index): RelatedArticle[] => {
    const value = item as Record<string, any>;
    const title = String(value.title ?? '').trim(); const link = String(value.link ?? '');
    if (!title || !URL.canParse(link)) return [];
    const publisher = String(value.source?.['#text'] ?? title.split(' - ').at(-1) ?? 'Unknown publisher');
    return [{ id: `rss-${index}-${link.slice(-20)}`, title: title.replace(new RegExp(` - ${publisher}$`), ''), url: link, publisher, ...(value.pubDate ? { publishedAt: new Date(String(value.pubDate)).toISOString() } : {}), snippet: String(value.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), source: 'Google News RSS', lean: null }];
  });
}
