import { motion } from 'motion/react';
import type { PipelineStage } from '../types';
const stages: Array<[PipelineStage,string]> = [['reading','Reading article'],['publisher','Checking publisher'],['analysing','Analysing framing'],['coverage','Finding coverage'],['comparing','Comparing lenses'],['complete','Setting type']];
export function PrismSplit({ stage, detail }: { stage: PipelineStage; detail: string }) {
  const index = stages.findIndex(([value]) => value === stage);
  return <div className="prism-loader" role="status" aria-live="polite"><div>
    <svg viewBox="0 0 300 105" aria-hidden="true"><motion.path d="M0 53H112" stroke="var(--ink)" strokeWidth="2" initial={{pathLength:0}} animate={{pathLength:1}}/><path d="M113 16 160 88H72Z" fill="none" stroke="var(--ink)" strokeWidth="2"/><motion.path d="M118 48 300 12" stroke="#4B4FA8" strokeWidth="3" initial={{pathLength:0}} animate={{pathLength:1}}/><motion.path d="M119 54 300 53" stroke="#8A8577" strokeWidth="3" initial={{pathLength:0}} animate={{pathLength:1}} transition={{delay:.1}}/><motion.path d="M118 60 300 94" stroke="#B7791F" strokeWidth="3" initial={{pathLength:0}} animate={{pathLength:1}} transition={{delay:.2}}/></svg>
    <h2>{detail || stages[index]?.[1]}</h2><p className="muted">Following the story across the spectrum.</p>
    <div className="stage-list">{stages.slice(0,-1).map(([value,label],i)=><span key={value} className={`stage-chip ${i <= index ? 'active':''}`}>{label}</span>)}</div>
  </div></div>;
}
