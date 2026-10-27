import type { HeuristicSignals, ScoreResult } from '../../types';
export interface ScoreInput { publisherPrior: number | null; articleValue: number | null; articleEvidenceCount: number; heuristic: HeuristicSignals; }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function scoreBias(input: ScoreInput): ScoreResult {
  const hasPrior = input.publisherPrior !== null;
  const hasArticle = input.articleValue !== null && input.articleEvidenceCount >= 2;
  let publisher = hasPrior ? 0.3 : 0;
  let article = hasArticle ? 0.55 : 0;
  let heuristic = 0.15;
  const total = publisher + article + heuristic;
  publisher /= total; article /= total; heuristic /= total;
  const value = clamp((input.publisherPrior ?? 0) * publisher + (input.articleValue ?? 0) * article + input.heuristic.leanValue * heuristic, -1, 1);
  const values = [...(hasPrior ? [input.publisherPrior as number] : []), ...(hasArticle ? [input.articleValue as number] : []), input.heuristic.leanValue];
  const disagreement = Math.max(...values) - Math.min(...values);
  const missingPenalty = (hasPrior ? 0 : 0.13) + (hasArticle ? 0 : 0.2);
  const thinEvidence = clamp((5 - input.articleEvidenceCount) * 0.025, 0, 0.125);
  const band = clamp(0.12 + missingPenalty + disagreement * 0.22 + thinEvidence, 0.12, 0.65);
  const insufficient = !hasArticle && !hasPrior && input.heuristic.strength < 0.22;
  const label = insufficient ? 'INSUFFICIENT SIGNAL' : value < -0.2 ? 'Leans left' : value > 0.2 ? 'Leans right' : 'Centre / mixed';
  return { value, band, label, confidence: band <= 0.23 ? 'high' : band <= 0.4 ? 'medium' : 'low', weights: { publisher, article, heuristic }, insufficient };
}
