import * as Tabs from '@radix-ui/react-tabs';
import type { AnalysisResult, RelatedArticle } from '../types';
const groups = [
  { id:'left', label:'Leans left' }, { id:'centre', label:'Centre' }, { id:'right', label:'Leans right' }
] as const;
const inGroup = (item: RelatedArticle, group: typeof groups[number]['id']) => item.lean !== null && (group === 'left' ? item.lean < -.2 : group === 'right' ? item.lean > .2 : item.lean >= -.2 && item.lean <= .2);
export function CoverageColumns({ result }: { result: AnalysisResult }) {
  const synthesis = (group: string) => result.comparison?.syntheses.find((item)=>item.group===group)?.text;
  return <Tabs.Root defaultValue="centre" className="coverage-tabs"><Tabs.List aria-label="Publisher lean group">{groups.map((group)=><Tabs.Trigger key={group.id} value={group.id}>{group.label}</Tabs.Trigger>)}</Tabs.List>
    <div className="coverage-grid">{groups.map((group)=><Tabs.Content forceMount key={group.id} value={group.id} className="coverage-column" aria-label={`${group.label} coverage`}>
      <h3>{group.label}</h3>{synthesis(group.id) && <p className="synthesis">{synthesis(group.id)}</p>}
      {result.related.filter((item)=>inGroup(item,group.id)).map((item)=><a className="coverage-card" key={item.id} href={item.url} target="_blank" rel="noreferrer"><p>{item.publisher} · {item.publishedAt ? new Date(item.publishedAt).toLocaleString([], {dateStyle:'medium',timeStyle:'short'}) : 'time unavailable'}</p><h4>{item.title}</h4><p className="metric">same-event {Math.round((item.similarity??0)*100)}%</p></a>)}
      {!result.related.some((item)=>inGroup(item,group.id)) && <div className="notice">No rated coverage in this column. This is not evidence that coverage is absent.</div>}
    </Tabs.Content>)}</div>
    {result.related.some((item)=>item.lean===null) && <p className="muted">{result.related.filter((item)=>item.lean===null).length} additional matching article(s) are unrated and are not forced onto the US-centric axis.</p>}
  </Tabs.Root>;
}
