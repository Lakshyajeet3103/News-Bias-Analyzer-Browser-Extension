import { z } from 'zod';
import type { RelatedArticle } from '../../types';

const GdeltSchema = z.object({
  articles: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    seendate: z.string().optional(),
    domain: z.string().optional()
  })).default([])
});

const dateStamp = (date: Date) => date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
export async function fetchGdelt(query: string, publishedAt?: string, signal?: AbortSignal): Promise<RelatedArticle[]> {
  const centre = publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? new Date(publishedAt) : new Date();
  const start = new Date(centre); start.setUTCDate(start.getUTCDate() - 2);
  const end = new Date(centre); end.setUTCDate(end.getUTCDate() + 2);
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.search = new URLSearchParams({ query, mode: 'ArtList', maxrecords: '40', format: 'json', sort: 'DateDesc', startdatetime: dateStamp(start), enddatetime: dateStamp(end) }).toString();
  const response = await fetch(url, signal ? { signal } : {});
  if (!response.ok) throw new Error(`GDELT returned ${response.status}`);
  const data = GdeltSchema.parse(await response.json());
  return data.articles.map((item, index) => ({
    id: `gdelt-${index}-${item.url.slice(-24)}`,
    title: item.title.trim(), url: item.url,
    publisher: item.domain?.replace(/^www\./, '') || new URL(item.url).hostname.replace(/^www\./, ''),
    ...(item.seendate ? { publishedAt: item.seendate } : {}),
    snippet: '', source: 'GDELT' as const, lean: null
  }));
}
