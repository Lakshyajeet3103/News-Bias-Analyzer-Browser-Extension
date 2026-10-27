import { z } from 'zod';

export const dimensions = [
  'framing',
  'word_choice',
  'source_balance',
  'omission',
  'headline_body',
  'opinion_reporting'
] as const;

export const DimensionSchema = z.enum(dimensions);
export type Dimension = z.infer<typeof DimensionSchema>;
export const EvidenceSchema = z.object({
  span: z.string().min(3).max(700),
  dimension: DimensionSchema,
  explanation: z.string().min(3).max(500)
});
const DimensionResultSchema = z.object({
  dimension: DimensionSchema,
  value: z.number().min(-1).max(1),
  strength: z.number().min(0).max(1),
  rationale: z.string().max(500)
});
export const LlmAnalysisSchema = z.object({
  lean: z.object({
    value: z.number().min(-1).max(1),
    label: z.enum(['leans_left', 'centre', 'leans_right', 'insufficient_signal']),
    rationale: z.string().max(800)
  }),
  dimensions: z.array(DimensionResultSchema).max(6),
  evidence: z.array(EvidenceSchema).max(18),
  claims: z.array(z.string().max(400)).max(12),
  entities: z.array(z.string().max(120)).max(15),
  article_type: z.enum(['news', 'opinion', 'analysis'])
});
export type LlmAnalysis = z.infer<typeof LlmAnalysisSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;

export const ArticleSchema = z.object({
  title: z.string().min(1),
  byline: z.string().optional(),
  publisher: z.string(),
  domain: z.string(),
  publishedAt: z.string().optional(),
  canonicalUrl: z.string().url(),
  excerpt: z.string().optional(),
  text: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
  isArticle: z.boolean(),
  reason: z.string().optional()
});
export type Article = z.infer<typeof ArticleSchema>;
export const RelatedArticleSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1),
  publishedAt: z.string().optional(),
  snippet: z.string().default(''),
  source: z.enum(['GDELT', 'Google News RSS']),
  similarity: z.number().min(0).max(1).optional(),
  lean: z.number().min(-1).max(1).nullable().default(null)
});
export type RelatedArticle = z.infer<typeof RelatedArticleSchema>;

export interface HeuristicSignals {
  emotiveRatio: number;
  subjectivityRatio: number;
  hedgeRatio: number;
  quoteCount: number;
  attributionCount: number;
  headlineBodyGap: number;
  leanValue: number;
  strength: number;
  topSignal: string;
}
export interface ScoreResult {
  value: number;
  band: number;
  label: string;
  confidence: 'low' | 'medium' | 'high';
  weights: { publisher: number; article: number; heuristic: number };
  insufficient: boolean;
}
export interface SourceState {
  name: string;
  state: 'OK' | 'OUT OF RANGE' | 'FAILED' | 'NOT CONFIGURED';
  detail?: string;
}
export interface CoverageComparison {
  syntheses: Array<{ group: 'left' | 'centre' | 'right' | 'unrated'; text: string; articleIds: string[] }>;
  blindspots: Array<{ text: string; articleIds: string[] }>;
}
export interface AnalysisResult {
  id: string;
  article: Article;
  heuristic: HeuristicSignals;
  llm: LlmAnalysis | null;
  removedEvidenceCount: number;
  publisherPrior: number | null;
  score: ScoreResult;
  related: RelatedArticle[];
  coverageBalance: number | null;
  comparison: CoverageComparison | null;
  sources: SourceState[];
  model: string | null;
  createdAt: string;
  mode: 'full' | 'heuristic';
}
export type PipelineStage = 'reading' | 'publisher' | 'analysing' | 'coverage' | 'comparing' | 'complete';
export type ExtensionMessage =
  | { type: 'ANALYSE_ACTIVE_TAB'; force?: boolean }
  | { type: 'GET_ACTIVE_ANALYSIS' }
  | { type: 'PROGRESS'; stage: PipelineStage; detail: string }
  | { type: 'SHOW_EVIDENCE'; span: string }
  | { type: 'APPLY_HIGHLIGHTS'; evidence: Evidence[] }
  | { type: 'EXTRACT_ARTICLE' }
  | { type: 'TOGGLE_HIGHLIGHTS'; visible: boolean }
  | { type: 'CLEAR_DATA' }
  | { type: 'TEST_KEY'; key: string; model: string };
