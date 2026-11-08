// Capture actual application output for documentation; no fabricated UI or model output.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('docs/assets',{recursive:true});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport:{width:1440,height:1120},reducedMotion:'reduce'});
  await page.goto(process.env.CAPTURE_URL || 'http://127.0.0.1:4401/');
  await page.waitForFunction(() => !document.querySelector('#download').disabled);
  await page.screenshot({path:'docs/assets/studio.png',animations:'disabled'});
  await page.locator('#workbench').screenshot({path:'docs/assets/workbench.png',animations:'disabled'});
  for (const id of ['original','result']) {
    const url = await page.locator('#'+id).evaluate(canvas => canvas.toDataURL('image/png'));
    await writeFile(`.impeccable/review/demo-${id}.png`,Buffer.from(url.split(',')[1],'base64'));
  }
  await page.setViewportSize({width:1200,height:630});
  await page.locator('.intro').screenshot({path:'.impeccable/review/demo-intro.png',animations:'disabled'});
} finally { await browser.close(); }
