/* global process */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const input = process.argv[2] ?? 'evaluation/dataset.jsonl';
if (!existsSync(input)) {
  process.stderr.write(`Evaluation not run: ${input} is missing. See evaluation/README.md.\n`);
  process.exitCode = 2;
} else {
  const rows = (await readFile(input, 'utf8')).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const allowed = new Set(['left','centre','right']);
  const data = rows.filter((row) => allowed.has(row.label) && typeof row.text === 'string');
  const hash = (value) => [...String(value)].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
  const sample = ['left','centre','right'].flatMap((label)=>data.filter((row)=>row.label===label).sort((a,b)=>hash(a.id)-hash(b.id)).slice(0,150));
  const left = new Set(['equity','inequality','marginalized','progressive','workers','climate']);
  const right = new Set(['border','freedom','taxpayer','traditional','security','regulation']);
  const heuristic = (row) => { const words=row.text.toLowerCase().match(/[a-z'-]+/g)??[]; const count=(set)=>words.filter((w)=>set.has(w)).length; const score=(count(right)-count(left))*30/Math.max(1,words.length); return Math.abs(score)<.02?'centre':score<0?'left':'right'; };
  const labelFromValue = (value) => value < -.2 ? 'left' : value > .2 ? 'right' : 'centre';
  const variants = {
    'publisher-prior': (row) => typeof row.publisherPrior==='number'?labelFromValue(row.publisherPrior):null,
    heuristics: heuristic,
    'gemini-article': (row) => typeof row.gemini==='number'?labelFromValue(row.gemini):null,
    combined: (row) => typeof row.combined==='number'?labelFromValue(row.combined):null
  };
  const evaluate = (predict) => { const matrix=Array.from({length:3},()=>[0,0,0]); const names=['left','centre','right']; let used=0,correct=0; for(const row of sample){const prediction=predict(row);if(!prediction)continue;const actual=names.indexOf(row.label);const found=names.indexOf(prediction);if(found<0)continue;matrix[actual][found]++;used++;if(actual===found)correct++;} const f1=names.map((_,i)=>{const tp=matrix[i][i];const fp=matrix.reduce((n,r,j)=>n+(j===i?0:r[i]),0);const fn=matrix[i].reduce((n,v,j)=>n+(j===i?0:v),0);const p=tp/Math.max(1,tp+fp);const r=tp/Math.max(1,tp+fn);return 2*p*r/Math.max(.000001,p+r);});return {n:used,accuracy:used?correct/used:null,macroF1:used?f1.reduce((a,b)=>a+b,0)/3:null,confusionMatrix:matrix}; };
  const metrics = Object.fromEntries(Object.entries(variants).map(([name,predict])=>[name,evaluate(predict)]));
  const evidenceRows=sample.filter((row)=>Number.isFinite(row.removedEvidence)&&Number.isFinite(row.totalEvidence));
  const removed=evidenceRows.reduce((n,row)=>n+row.removedEvidence,0);const evidenceTotal=evidenceRows.reduce((n,row)=>n+row.totalEvidence,0);
  const result={runAt:new Date().toISOString(),dataset:input,sampleSize:sample.length,stratification:Object.fromEntries(['left','centre','right'].map((label)=>[label,sample.filter((r)=>r.label===label).length])),metrics,hallucinatedEvidenceRate:evidenceTotal?removed/evidenceTotal:null,notes:['Null metrics mean the input did not include cached predictions for that variant.','The fixed sample uses FNV-1a ordering and at most 150 examples per class.']};
  await mkdir('evaluation/results',{recursive:true});await writeFile('evaluation/results/latest.json',JSON.stringify(result,null,2));
  process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
}
