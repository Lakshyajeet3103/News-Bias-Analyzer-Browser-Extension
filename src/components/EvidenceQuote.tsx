import { browser } from 'wxt/browser';
import type { Evidence } from '../types';
export function EvidenceQuote({ item }: { item: Evidence }) {
  return <article className="evidence"><div className="kicker">{item.dimension.replaceAll('_',' ')}</div><blockquote>“{item.span}”</blockquote><p>{item.explanation}</p><button className="text-button" onClick={() => browser.runtime.sendMessage({ type:'SHOW_EVIDENCE', span:item.span })}>Show on page ↗</button></article>;
}
