import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('analysis, local plans, recipe persistence and recipe links work without a provider', async ({ page }) => {
  await page.goto('./'); await expect(page.locator('#download')).toBeEnabled();
  await expect(page.locator('#analysis-mean')).toContainText('/ 255');
  await page.getByRole('button',{name:'Soft monochrome',exact:true}).click();
  await expect(page.locator('#plan-settings')).toContainText('Mono ink');
  await page.getByRole('button',{name:'Apply these settings'}).click();
  await expect(page.locator('#download')).toBeEnabled(); await expect(page.locator('#ink')).toHaveValue('20');
  await page.getByRole('textbox',{name:'Recipe name',exact:true}).fill('My teaching print');
  await page.getByRole('button',{name:'Save settings',exact:true}).click();
  await expect(page.locator('#recipe-count')).toHaveText('1 / 12');
  const saved = await page.evaluate(() => localStorage.getItem('toonforge.recipes.v1'));
  expect(saved).toContain('My teaching print'); expect(saved).not.toContain('data:image');
  await page.reload(); await expect(page.locator('#download')).toBeEnabled();
  await page.getByRole('button',{name:'My teaching print',exact:true}).click();
  await expect(page.locator('#ink')).toHaveValue('20');
  const hash = '#recipe='+encodeURIComponent(JSON.stringify({version:1,name:'Shared zine',options:{preset:'graphic-novel',detail:20,ink:80,colors:3}}));
  await page.goto('./'+hash); await expect(page.locator('#download')).toBeEnabled();
  await expect(page.locator('#colors')).toHaveValue('3'); await expect(page.locator('#ink')).toHaveValue('80');
  await page.getByRole('button',{name:'Try suggested settings'}).click(); await expect(page.locator('#download')).toBeEnabled();
  await page.getByRole('button',{name:'Remove recipe My teaching print'}).click(); await expect(page.locator('#recipe-count')).toHaveText('0 / 12');
  await page.locator('#direction').fill('remove the background'); await page.locator('#plan-local').click();
  await expect(page.locator('#direction-status')).toContainText('cannot remove objects');
});

test.describe('optional text model boundaries', () => {
  test.use({serviceWorkers:'block'});
  test('newer local intent owns the plan after a delayed model response', async ({page}) => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('https://router.example/v1/chat/completions', async route => {
      await gate;
      await route.fulfill({contentType:'application/json',body:JSON.stringify({choices:[{message:{content:JSON.stringify({options:{preset:'graphic-novel',detail:99,ink:99,colors:3},explanation:'Older model plan.'})}}]})}).catch(() => {});
    });
    await page.goto('./'); await expect(page.locator('#download')).toBeEnabled();
    await page.locator('#model-connection summary').click();
    await page.locator('#model-url').fill('https://router.example/v1'); await page.locator('#model-id').fill('test-text'); await page.locator('#model-key').fill('dummy-key-only');
    await page.locator('#direction').fill('A dramatic print');
    const sent = page.waitForRequest('https://router.example/v1/chat/completions');
    await page.locator('#plan-model').click(); await sent;
    await expect(page.locator('#cancel-model')).toBeVisible();
    await page.getByRole('button',{name:'Soft monochrome',exact:true}).click();
    await expect(page.locator('#plan-settings')).toContainText('Mono ink');
    await expect(page.locator('#cancel-model')).toBeHidden(); await expect(page.locator('#plan-model')).toBeEnabled();
    release!(); await page.waitForTimeout(300);
    await expect(page.locator('#plan-settings')).toContainText('outlines 20');
    await expect(page.locator('#direction-status')).toHaveText('Plan ready. Apply it to preview the change.');
    await page.locator('#apply-plan').click(); await expect(page.locator('#download')).toBeEnabled();
    await expect(page.locator('#ink')).toHaveValue('20');
    await expect(page.locator('[data-preset="mono-ink"]')).toHaveAttribute('aria-pressed','true');
  });
  test('validated plan is explicit, no image is transmitted, key is not persisted, bad output keeps settings', async ({page}) => {
    let payload: any; let authorization = '';
    await page.route('https://router.example/v1/chat/completions', async route => {
      payload = route.request().postDataJSON(); authorization = route.request().headers()['authorization'];
      await route.fulfill({contentType:'application/json',body:JSON.stringify({choices:[{message:{content:JSON.stringify({options:{preset:'graphic-novel',detail:15,ink:85,colors:4},explanation:'A bold print.'})}}]})});
    });
    await page.goto('./'); await expect(page.locator('#download')).toBeEnabled();
    await page.locator('#plan-model').click(); await expect(page.locator('#model-connection')).toHaveAttribute('open','');
    await page.locator('#model-url').fill('https://router.example/v1'); await page.locator('#model-id').fill('my-text-model'); await page.locator('#model-key').fill('dummy-key-only');
    await page.locator('#direction').fill('A bolder print please'); await page.locator('#plan-model').click();
    await expect(page.locator('#plan-settings')).toContainText('outlines 85'); await expect(page.locator('#ink')).toHaveValue('30');
    expect(authorization).toBe('Bearer dummy-key-only'); expect(payload.max_tokens).toBe(220);
    const user = JSON.parse(payload.messages[1].content);
    expect(Object.keys(user).sort()).toEqual(['current','measurements','request']);
    expect(Object.keys(user.measurements).sort()).toEqual(['contrast','edgeDensity','meanLuminance']);
    expect(JSON.stringify(payload)).not.toMatch(/data:image|manarola|dummy-key-only/);
    await page.locator('#apply-plan').click(); await expect(page.locator('#download')).toBeEnabled(); await expect(page.locator('#ink')).toHaveValue('85');
    expect(await page.evaluate(() => JSON.stringify({...localStorage}))).not.toContain('dummy-key-only');
    await page.unroute('https://router.example/v1/chat/completions');
    await page.route('https://router.example/v1/chat/completions', route => route.fulfill({contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'{"options":{"ink":999},"explanation":"bad"}'}}]})}));
    await page.locator('#plan-model').click(); await expect(page.locator('#direction-status')).toContainText('supported styles');
    await expect(page.locator('#ink')).toHaveValue('85'); await expect(page.locator('#plan-preview')).toBeHidden();
    await page.locator('#disconnect-model').click(); await expect(page.locator('#model-key')).toHaveValue('');
  });
});

test('expanded workbench and guide remain accessible and motion can be paused', async ({page}) => {
  await page.goto('./'); await expect(page.locator('#download')).toBeEnabled();
  await page.locator('#model-connection summary').click();
  await page.getByRole('button',{name:'Soft monochrome',exact:true}).click();
  for (const width of [390,768,1440]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
    await page.screenshot({path:`.impeccable/review/workbench-${width}.png`,fullPage:true,animations:'disabled'});
  }
  await page.locator('#motion-toggle').click(); await expect(page.locator('body')).toHaveClass(/motion-paused/);
  await page.goto('./guide.html'); await expect(page.getByRole('heading',{name:'Can a text-only model edit an image?'})).toBeVisible();
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});
