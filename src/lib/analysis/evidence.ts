import type { Evidence } from '../../types';
const normalise = (value: string) => value.replace(/[\s\u00a0]+/g, ' ').trim();
export function verifyEvidence(articleText: string, evidence: Evidence[]) {
  const haystack = normalise(articleText);
  const verified = evidence.filter((item) => haystack.includes(normalise(item.span)));
  return { verified, removed: evidence.length - verified.length };
}
