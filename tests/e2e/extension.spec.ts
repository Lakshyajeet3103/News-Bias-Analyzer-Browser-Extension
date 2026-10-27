import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

test('loads the MV3 extension and renders its consent-first popup', async () => {
  const extensionPath=path.resolve('.output/chrome-mv3');
  const context=await chromium.launchPersistentContext('',{headless:false,args:[`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`]});
  try {
    let worker=context.serviceWorkers()[0]; if(!worker)worker=await context.waitForEvent('serviceworker');
    const id=new URL(worker.url()).host;
    await new Promise((resolve)=>setTimeout(resolve,1500));
    const page=context.pages().find((candidate)=>candidate.url().startsWith(`chrome-extension://${id}`))??await context.newPage();
    await page.goto(`chrome-extension://${id}/popup.html`,{waitUntil:'domcontentloaded'});
    await expect(page.getByText('A clearer view begins with consent.')).toBeVisible();
    await expect(page.getByRole('button',{name:/continue/i})).toBeVisible();
  } finally { await context.close(); }
});
