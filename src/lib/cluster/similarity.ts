const STOP = new Set(['about', 'after', 'again', 'from', 'have', 'into', 'more', 'news', 'that', 'their', 'this', 'with']);
const tokenize = (value: string) => new Set(value.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter((word) => !STOP.has(word)) ?? []);
export function lexicalSimilarity(a: string, b: string): number {
  const left = tokenize(a); const right = tokenize(b);
  if (!left.size || !right.size) return 0;
  return [...left].filter((word) => right.has(word)).length / Math.sqrt(left.size * right.size);
}
