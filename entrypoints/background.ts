import { browser } from 'wxt/browser';
import { ArticleSchema, type AnalysisResult, type ExtensionMessage, type PipelineStage, type RelatedArticle, type SourceState } from '../src/types';
import { analyseHeuristics } from '../src/lib/analysis/heuristics';
import { analyseWithGemini } from '../src/lib/analysis/llm';
import { compareCoverage } from '../src/lib/analysis/compare';
import { verifyEvidence } from '../src/lib/analysis/evidence';
import { scoreBias } from '../src/lib/analysis/scoring';
import { fetchGdelt } from '../src/lib/sources/gdelt';
import { fetchGoogleNews } from '../src/lib/sources/googleNewsRss';
import { dedupeArticles } from '../src/lib/sources/dedupe';
import { lexicalSimilarity } from '../src/lib/cluster/similarity';
import { findPublisherPrior } from '../src/lib/ratings/ratings';
import { clearCache, getCached, putCached } from '../src/lib/cache/db';
import { getSettings } from '../src/lib/settings';
import { testGeminiKey } from '../src/lib/analysis/llm';

const progress = async (stage: PipelineStage, detail: string) => { try { await browser.runtime.sendMessage({ type: 'PROGRESS', stage, detail } satisfies ExtensionMessage); } catch { /* no open view */ } };
const queryText = (title: string, entities: string[] = []) => [...title.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).slice(0, 10), ...entities.slice(0, 3)].join(' ');
const withRating = (items: RelatedArticle[], ratings: Awaited<ReturnType<typeof getSettings>>['ratings']) => items.map((item) => ({ ...item, lean: findPublisherPrior(new URL(item.url).hostname, ratings) }));
const cosine = (a: number[], b: number[]) => a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
function coverageBalance(items: RelatedArticle[]): number | null {
  const rated = items.filter((item) => item.lean !== null);
  if (!rated.length) return null;
  const counts: [number, number, number] = [0, 0, 0];
  for (const item of rated) {
    const index = (item.lean as number) < -0.2 ? 0 : (item.lean as number) > 0.2 ? 2 : 1;
    counts[index] += 1;
  }
  const max = Math.max(...counts); const min = Math.min(...counts); return Math.max(0, 1 - (max - min) / rated.length);
}

export default defineBackground(() => {
  const getTab = async () => (await browser.tabs.query({ active: true, currentWindow: true }))[0];
  const extract = async (tabId: number) => {
    try { return ArticleSchema.parse(await browser.tabs.sendMessage(tabId, { type: 'EXTRACT_ARTICLE' })); }
    catch {
      const injected = await browser.scripting.executeScript({ target: { tabId }, files: ['/content-scripts/content.js'] });
      return ArticleSchema.parse(injected[0]?.result);
    }
  };
  const matchEvent = async (articleText: string, items: RelatedArticle[]) => {
    const local = (browser as any).offscreen;
    if (import.meta.env.BROWSER === 'chrome' && local && items.length) {
      try {
        if (!(await local.hasDocument())) await local.createDocument({ url: '/offscreen.html', reasons: ['WORKERS'], justification: 'Compute private same-event sentence embeddings locally.' });
        const texts = [articleText, ...items.map((item) => `${item.title} ${item.snippet}`)];
        const vectors = await Promise.race([browser.runtime.sendMessage({ type: 'LOCAL_EMBED', texts }), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Local embedding timeout')), 25_000))]) as number[][];
        const anchor = vectors[0];
        if (anchor) return { items: items.map((item, index) => ({ ...item, similarity: cosine(anchor, vectors[index + 1] ?? []) })).filter((item) => (item.similarity ?? 0) >= 0.55), method: 'MiniLM embeddings in a private offscreen document.' };
      } catch { /* fall through to deterministic private matcher */ }
    }
    return { items: items.map((item) => ({ ...item, similarity: lexicalSimilarity(articleText, `${item.title} ${item.snippet}`) })).filter((item) => (item.similarity ?? 0) >= 0.12), method: 'Private local lexical similarity fallback.' };
  };
  const run = async (force = false): Promise<AnalysisResult> => {
    await progress('reading', 'Reading article');
    const tab = await getTab(); if (!tab?.id || !tab.url?.startsWith('http')) throw new Error('Open a web article before running Parallax.');
    const article = await extract(tab.id); if (!article.isArticle) throw new Error('NOT AN ARTICLE — the page does not contain enough article-like text.');
    if (!force) { const cached = await getCached(article.canonicalUrl); if (cached) { await browser.storage.local.set({ activeAnalysis: cached }); await progress('complete', 'Loaded from local cache'); return cached; } }
    const settings = await getSettings();
    await progress('publisher', 'Checking publisher');
    const publisherPrior = findPublisherPrior(article.domain, settings.ratings);
    const heuristic = analyseHeuristics(article.title, article.text);
    let llm = null; let removedEvidenceCount = 0; let llmError: string | null = null;
    if (settings.geminiKey && settings.consent) {
      await progress('analysing', 'Analysing framing and evidence');
      try { llm = await analyseWithGemini(article, settings.geminiKey, settings.model); const checked = verifyEvidence(article.text, llm.evidence); removedEvidenceCount = checked.removed; llm = { ...llm, evidence: checked.verified }; }
      catch (error) { llmError = error instanceof Error ? error.message : String(error); }
    }
    await progress('coverage', 'Finding other coverage');
    const search = queryText(article.title, llm?.entities);
    const sourceResults = await Promise.allSettled([fetchGdelt(search, article.publishedAt, AbortSignal.timeout(9000)), fetchGoogleNews(search, AbortSignal.timeout(9000))]);
    const sourceStates: SourceState[] = [
      { name: 'Publisher ratings', state: settings.ratings ? 'OK' : 'NOT CONFIGURED', detail: settings.ratings?.licence ?? 'No dataset bundled; import an openly licensed file.' },
      { name: 'Gemini article analysis', state: llm ? 'OK' : settings.geminiKey ? 'FAILED' : 'NOT CONFIGURED', ...(llmError ? { detail: llmError.slice(0, 180) } : {}) },
      { name: 'GDELT DOC 2.0', state: sourceResults[0].status === 'fulfilled' ? 'OK' : 'FAILED' },
      { name: 'Google News RSS', state: sourceResults[1].status === 'fulfilled' ? 'OK' : 'FAILED' }
    ];
    const found = sourceResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const matched = await matchEvent(`${article.title} ${article.excerpt ?? ''}`, dedupeArticles(found).filter((item) => item.url !== article.canonicalUrl));
    sourceStates.push({ name: 'Same-event matching', state: 'OK', detail: matched.method });
    const related = withRating(matched.items.slice(0, 24), settings.ratings);
    let comparison = null;
    if (llm && related.length >= 3) { await progress('comparing', 'Comparing lenses'); try { comparison = await compareCoverage(related, settings.geminiKey, settings.model); } catch { /* coverage stays useful without comparison */ } }
    const score = scoreBias({ publisherPrior, articleValue: llm?.lean.value ?? null, articleEvidenceCount: llm?.evidence.length ?? 0, heuristic });
    const result: AnalysisResult = { id: crypto.randomUUID(), article, heuristic, llm, removedEvidenceCount, publisherPrior, score, related, coverageBalance: coverageBalance(related), comparison, sources: sourceStates, model: llm ? settings.model : null, createdAt: new Date().toISOString(), mode: llm ? 'full' : 'heuristic' };
    await putCached(result, settings.ttlHours); await browser.storage.local.set({ activeAnalysis: result });
    if (settings.highlights && llm?.evidence.length) try { await browser.tabs.sendMessage(tab.id, { type: 'APPLY_HIGHLIGHTS', evidence: llm.evidence } satisfies ExtensionMessage); } catch { /* page navigation */ }
    await progress('complete', 'Analysis complete'); return result;
  };

  browser.commands.onCommand.addListener((command) => { if (command === 'analyse-page') void run(true); });
  browser.runtime.onInstalled.addListener(({ reason }) => { if (reason === 'install') void browser.runtime.openOptionsPage(); });
  browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
    if (message.type === 'ANALYSE_ACTIVE_TAB') return run(message.force);
    if (message.type === 'GET_ACTIVE_ANALYSIS') return browser.storage.local.get('activeAnalysis').then((value) => value.activeAnalysis ?? null);
    if (message.type === 'CLEAR_DATA') return Promise.all([clearCache(), browser.storage.local.remove(['activeAnalysis'])]).then(() => true);
    if (message.type === 'TEST_KEY') return testGeminiKey(message.key, message.model);
    if (message.type === 'SHOW_EVIDENCE') return getTab().then((tab) => tab?.id ? browser.tabs.sendMessage(tab.id, message) : false);
    return undefined;
  });
});
