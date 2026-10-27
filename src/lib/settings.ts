import { z } from 'zod';
import { browser } from 'wxt/browser';
import { RatingFileSchema, type RatingFile } from './ratings/ratings';

export const SettingsSchema = z.object({
  geminiKey: z.string().default(''),
  model: z.string().default('gemini-3.5-flash'),
  theme: z.enum(['newsprint', 'nightpress', 'system']).default('newsprint'),
  highlights: z.boolean().default(true),
  consent: z.boolean().default(false),
  ttlHours: z.number().min(1).max(168).default(24),
  ratings: RatingFileSchema.nullable().default(null)
});
export type Settings = z.infer<typeof SettingsSchema>;
const defaults: Settings = { geminiKey: '', model: 'gemini-3.5-flash', theme: 'newsprint', highlights: true, consent: false, ttlHours: 24, ratings: null };
export async function getSettings(): Promise<Settings> { return SettingsSchema.parse({ ...defaults, ...(await browser.storage.local.get()) }); }
export async function saveSettings(values: Partial<Omit<Settings, 'ratings'>> & { ratings?: RatingFile | null }) { await browser.storage.local.set(values); }
