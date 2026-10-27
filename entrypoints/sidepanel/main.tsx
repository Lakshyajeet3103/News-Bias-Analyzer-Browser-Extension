import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import type { AnalysisResult } from '../../src/types';
import { AppShell } from '../../src/components/AppShell';
import { Broadsheet } from '../../src/components/Broadsheet';
import { Masthead } from '../../src/components/Masthead';
import { getSettings } from '../../src/lib/settings';
import '../../src/styles/global.css';
function App(){const[result,setResult]=useState<AnalysisResult|null>(null);useEffect(()=>{void getSettings().then(s=>{document.documentElement.dataset.theme=s.theme;});void browser.storage.local.get('activeAnalysis').then(v=>setResult((v.activeAnalysis as AnalysisResult)??null));const listener=(changes:Record<string,any>)=>{if(changes.activeAnalysis?.newValue)setResult(changes.activeAnalysis.newValue as AnalysisResult);};browser.storage.onChanged.addListener(listener);return()=>browser.storage.onChanged.removeListener(listener);},[]);return result?<Broadsheet result={result}/>:<main className="broadsheet"><Masthead publisher="The Broadsheet"/><h1 className="headline side-headline">No article on the press.</h1><p>Open a news article and run Parallax from the toolbar.</p></main>}
createRoot(document.getElementById('root')!).render(<StrictMode><AppShell><App/></AppShell></StrictMode>);
