import type { HeuristicSignals } from '../../types';

const EMOTIVE = new Set(['alarming', 'betrayal', 'chaos', 'crisis', 'devastating', 'disastrous', 'extreme', 'fury', 'outrage', 'radical', 'shocking', 'threat', 'unprecedented', 'war']);
const SUBJECTIVE = new Set(['clearly', 'obviously', 'remarkably', 'supposedly', 'undeniably', 'unfortunately', 'fortunately', 'absurd', 'reckless', 'heroic', 'dangerous']);
const HEDGES = new Set(['allegedly', 'apparently', 'could', 'likely', 'may', 'might', 'reportedly', 'seems']);
const LEFT = new Set(['equity', 'inequality', 'marginalized', 'progressive', 'workers', 'climate']);
const RIGHT = new Set(['border', 'freedom', 'taxpayer', 'traditional', 'security', 'regulation']);
const words = (value: string) => value.toLowerCase().match(/[\p{L}'-]+/gu) ?? [];
const ratio = (tokens: string[], lexicon: Set<string>) => tokens.length ? tokens.filter((token) => lexicon.has(token)).length / tokens.length : 0;

export function analyseHeuristics(title: string, text: string): HeuristicSignals {
  const tokens = words(text);
  const titleTokens = words(title);
  const emotiveRatio = ratio(tokens, EMOTIVE);
  const subjectivityRatio = ratio(tokens, SUBJECTIVE);
  const hedgeRatio = ratio(tokens, HEDGES);
  const quoteCount = (text.match(/[“”"]/g) ?? []).length / 2;
  const attributionCount = (text.match(/\b(said|told|according to|wrote|reported|stated)\b/gi) ?? []).length;
  const headlineBodyGap = Math.min(1, Math.abs(ratio(titleTokens, EMOTIVE) - emotiveRatio) * 15);
  const rawLean = Math.max(-1, Math.min(1, (ratio(tokens, RIGHT) - ratio(tokens, LEFT)) * 30));
  const strength = Math.min(0.55, 0.08 + (emotiveRatio + subjectivityRatio) * 18 + Math.min(tokens.length / 3000, 0.12));
  const signals: Array<[number, string]> = [
    [emotiveRatio, 'Loaded or emotive wording'],
    [subjectivityRatio, 'Subjective qualifiers'],
    [headlineBodyGap / 10, 'Headline–body tone gap'],
    [hedgeRatio, 'Hedging and uncertainty language']
  ];
  signals.sort((a, b) => b[0] - a[0]);
  return { emotiveRatio, subjectivityRatio, hedgeRatio, quoteCount, attributionCount, headlineBodyGap, leanValue: rawLean, strength, topSignal: signals[0]?.[1] ?? 'No strong local signal' };
}
