import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('sample → settings → real PNG export → print → clear → local import', async ({ page }) => {
  const failures: string[] = []; page.on('pageerror', error => failures.push(error.message));
  const outbound: string[] = []; page.on('request', request => { if (request.method() !== 'GET') outbound.push(request.method()+' '+request.url()); });
  await page.goto('./');
  await expect(page.getByRole('button', { name:'Download PNG' })).toBeEnabled();
  const before = await page.locator('#result').evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByRole('button', { name: /Mono ink/ }).click();
  await expect(page.getByRole('button', { name:'Download PNG' })).toBeEnabled();
  const after = await page.locator('#result').evaluate((c: HTMLCanvasElement) => c.toDataURL());
  expect(after).not.toBe(before);
  await page.getByRole('slider', {name:'Outline strength'}).fill('70');
  await expect(page.getByRole('button', { name:'Download PNG' })).toBeEnabled();
  await page.getByRole('slider', {name:/Comparison:/}).fill('25');
  await expect(page.locator('#image-frame')).toHaveCSS('--wipe', '25%');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', {name:'Download PNG'}).click()]);
  const bytes = await readFile((await download.path())!);
  expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]); expect(bytes.length).toBeGreaterThan(1000);
  await page.evaluate(() => { window.print = () => { document.body.dataset.printCalled='true'; }; });
  await page.getByRole('button', {name:'Print a sheet'}).click();
  await expect(page.locator('body')).toHaveAttribute('data-print-called','true');
  await expect(page.locator('#print-image-slot img')).toHaveAttribute('src', /^blob:/);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('#print-title')).toBeVisible();
  await expect(page.locator('main')).not.toBeVisible();
  await page.screenshot({path:'.impeccable/review/print.png',fullPage:true});
  await page.emulateMedia({media:'screen'});
  await page.getByRole('button', {name:'Clear photo'}).click();
  await expect(page.getByRole('heading', {name:'Your next little story starts here.'})).toBeVisible();
  await expect(page.getByRole('button', {name:'Download PNG'})).toBeDisabled();
  await page.screenshot({path:'.impeccable/review/empty.png',fullPage:true});
  await page.locator('#file').setInputFiles({name:'private.png',mimeType:'image/png',buffer:bytes});
  await expect(page.getByRole('button', {name:'Download PNG'})).toBeEnabled();
  await expect(page.locator('#filename')).toHaveText('private.png');
  expect(outbound).toEqual([]); expect(failures).toEqual([]);
});

test('bad input explains recovery and preserves the usable result', async ({ page }) => {
  await page.goto('./'); await expect(page.locator('#download')).toBeEnabled();
  await page.locator('#file').setInputFiles({name:'invalid.png',mimeType:'image/png',buffer:Buffer.from('not a photo')});
  await expect(page.getByRole('alert')).toContainText('could not be read');
  await expect(page.locator('#download')).toBeEnabled();
  await page.screenshot({path:'.impeccable/review/error.png',fullPage:true});
});

test('keyboard access and automated AA checks at phone, tablet and desktop', async ({ page }) => {
  for (const [name,width,height] of [['mobile',390,844],['tablet',768,1024],['desktop',1440,1000]] as const) {
    await page.setViewportSize({width,height}); await page.goto('./'); await expect(page.locator('#download')).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const report = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(report.violations).toEqual([]);
    await page.screenshot({path:`.impeccable/review/${name}.png`,fullPage:true,animations:'disabled'});
  }
  await page.keyboard.press('Tab'); await expect(page.getByRole('link',{name:'Skip to the studio'})).toBeFocused();
});

test('offline reload uses cached public assets and still creates artwork', async ({ page, context }) => {
  await page.goto('./'); await expect(page.locator('#download')).toBeEnabled();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); await expect(page.locator('#download')).toBeEnabled();
  await context.setOffline(true); await page.reload();
  await expect(page.locator('#connection')).toBeVisible(); await expect(page.locator('#download')).toBeEnabled();
  await page.screenshot({path:'.impeccable/review/offline.png',fullPage:true});
  await page.getByRole('button',{name:/Graphic novel/}).click(); await expect(page.locator('#download')).toBeEnabled();
  await context.setOffline(false);
});

test.describe('worker fault injection', () => {
test.use({serviceWorkers:'block'});
test('a slow local worker explains the wait, then restores export', async ({page}) => {
  await page.route('**/worker-*.js',async route => {
    const response=await route.fetch(); await new Promise(resolve=>setTimeout(resolve,2400)); await route.fulfill({response});
  });
  await page.goto('./');
  await expect(page.locator('#processing-label')).toContainText('Still working', {timeout:5000});
  await expect(page.locator('#download')).toBeDisabled();
  await page.screenshot({path:'.impeccable/review/loading.png',fullPage:true});
  await expect(page.locator('#download')).toBeEnabled({timeout:10000});
});

test('unavailable worker stops retrying and recovers after an explicit action', async ({page}) => {
  let attempts=0;
  await page.route('**/worker-*.js',route=>{attempts++;return route.abort();});
  await page.goto('./'); await expect(page.getByRole('alert')).toContainText('worker stopped');
  await expect(page.locator('#download')).toBeDisabled();
  await page.waitForTimeout(350); expect(attempts).toBe(1);
  await page.unroute('**/worker-*.js');
  await page.getByRole('button',{name:'Reset this style'}).click(); await expect(page.locator('#download')).toBeEnabled();
  await page.keyboard.press('Tab');
  await page.getByRole('button',{name:/Soft print/}).focus();
  const outline=await page.getByRole('button',{name:/Soft print/}).evaluate(b=>({width:getComputedStyle(b).outlineWidth,color:getComputedStyle(b).outlineColor}));
  expect(outline).toEqual({width:'3px',color:'rgb(81, 70, 186)'});
  await page.screenshot({path:'.impeccable/review/focus.png',fullPage:true});
});
});

test('delayed export keeps its metadata and clearing cancels a pending print', async ({page}) => {
  await page.goto('./'); await expect(page.locator('#download')).toBeEnabled();
  await page.evaluate(()=>{
    const serialize=HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob=function(callback,...args){serialize.call(this,blob=>setTimeout(()=>callback(blob),350),...args);};
    window.print=()=>{document.body.dataset.printCalled='true';};
  });
  const pending=page.waitForEvent('download');
  await page.locator('#download').click(); await page.getByRole('button',{name:/Graphic novel/}).click();
  const download=await pending; expect(download.suggestedFilename()).toBe('manarola-sample-soft-print.png');
  await expect(page.locator('#print')).toBeEnabled();
  await page.locator('#print').click(); await page.locator('#clear').click();
  await page.waitForTimeout(450);
  await expect(page.locator('#print-image-slot')).toBeEmpty(); await expect(page.locator('body')).not.toHaveAttribute('data-print-called');
});
