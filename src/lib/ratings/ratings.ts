import { z } from 'zod';
import { normaliseDomain } from '../sources/dedupe';

export const RatingRecordSchema = z.object({
  domain: z.string().min(3),
  lean: z.number().min(-1).max(1),
  source: z.string().min(2),
  licence: z.string().min(2)
});
export const RatingFileSchema = z.object({
  name: z.string(), licence: z.string(), url: z.string().url().optional(),
  records: z.array(RatingRecordSchema).max(10000)
});
export type RatingFile = z.infer<typeof RatingFileSchema>;
export function findPublisherPrior(domain: string, dataset: RatingFile | null): number | null {
  if (!dataset) return null;
  const target = normaliseDomain(domain);
  return dataset.records.find((item) => normaliseDomain(item.domain) === target)?.lean ?? null;
}
