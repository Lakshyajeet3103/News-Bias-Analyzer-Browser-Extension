import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractArticle } from '../src/lib/extract/article';
describe('Readability extraction',()=>{it('extracts saved article text and metadata',()=>{document.documentElement.innerHTML=readFileSync('tests/fixtures/article.html','utf8');const article=extractArticle(document,'https://example.com/transit-plan');expect(article.isArticle).toBe(true);expect(article.wordCount).toBeGreaterThan(100);expect(article.publisher).toBe('Example Ledger');expect(article.canonicalUrl).toBe('https://example.com/transit-plan');});});
