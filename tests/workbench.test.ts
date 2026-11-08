import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeImage } from '../src/lib/analysis';
import { validateOptions, planLocalEdit, parseModelPlan, recipeHash, recipeFromHash, validateRecipe } from '../src/lib/recipes';
import { completionURL, requestEditPlan } from '../src/lib/text-model';
const current = { preset: 'soft-print' as const, detail: 45, ink: 30, colors: 7 };

test('analysis ignores invisible color, measures flat tones and detects boundaries', () => {
  const flat = { width: 2, height: 1, data: new Uint8ClampedArray([100,100,100,255,250,0,0,0]) };
  const result = analyzeImage(flat);
  assert.ok(Math.abs(result.mean - 100) < .0001); assert.equal(result.contrast, 0); assert.equal(result.edgeDensity, 0);
  assert.equal(result.histogram.reduce((a,b) => a+b), 1);
  assert.equal(analyzeImage({ ...flat, data: new Uint8ClampedArray([0,0,0,255,255,255,255,255]) }).edgeDensity, 1);
  assert.equal(analyzeImage({ ...flat, data: new Uint8ClampedArray(8) }).mean, 255);
  assert.throws(() => analyzeImage({ ...flat, data: new Uint8ClampedArray(7) }));
});
test('local text plans have real constrained behavior and reject semantic edits', () => {
  assert.deepEqual(planLocalEdit('Monochrome with softer outlines', current).options, { ...current, preset:'mono-ink', ink:20, colors:4 });
  assert.equal(planLocalEdit('Simpler handout', current).options.detail, 25);
  assert.throws(() => planLocalEdit('remove the background', current), /cannot remove/);
  assert.throws(() => planLocalEdit('make it nice', current), /recognize/);
});
test('untrusted recipes and model plans reject executable fields, invalid numbers and oversized data', () => {
  for (const options of [{...current,ink:NaN}, {...current,colors:2}, {...current,colors:3.5}, {...current,preset:'invented'}, {...current,code:'anything'}]) assert.throws(() => validateOptions(options));
  assert.throws(() => parseModelPlan('{"options":{"ink":999},"explanation":"x"}'));
  assert.throws(() => parseModelPlan('x'.repeat(4001)));
  assert.throws(() => parseModelPlan('{"options":null,"explanation":"x","code":"alert(1)"}'));
  assert.equal(parseModelPlan('```json\n'+JSON.stringify({ options:current, explanation:'Gentler.' })+'\n```').options.ink, 30);
  const recipe = validateRecipe({version:1, name:'Zine & café', options:current});
  assert.deepEqual(recipeFromHash(recipeHash(recipe)), recipe);
  assert.equal(recipeFromHash('#studio'), undefined);
  assert.throws(() => recipeFromHash('#recipe=not-json'));
  assert.throws(() => recipeFromHash('#recipe='+'x'.repeat(2001)));
});
test('provider URL validation rejects credential URLs, query strings and remote HTTP', () => {
  assert.equal(completionURL('https://router.example/v1/'), 'https://router.example/v1/chat/completions');
  assert.equal(completionURL('http://localhost:20128/v1/chat/completions'), 'http://localhost:20128/v1/chat/completions');
  for (const url of ['http://router.example/v1', 'https://user:pass@router.example/v1', 'https://router.example/v1?key=secret', 'javascript:alert(1)']) assert.throws(() => completionURL(url));
});
test('provider receives bounded text and settings, and errors never echo credentials', async () => {
  const originalFetch = globalThis.fetch; let payload: Record<string, any> = {};
  try {
    globalThis.fetch = async (_url, init) => {
      payload = JSON.parse(String(init?.body));
      assert.equal(init?.redirect,'error'); assert.equal(init?.credentials,'omit');
      return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({ options:current, explanation:'Ready.' })}}]}));
    };
    assert.equal((await requestEditPlan({base:'https://router.example/v1',key:'test-private-key',model:'test-text'},'softer',current)).options.ink, 30);
    assert.equal(payload.max_tokens,220); assert.equal(payload.messages.length,2);
    assert.ok(!JSON.stringify(payload).includes('test-private-key')); assert.ok(!JSON.stringify(payload).includes('data:image'));
    globalThis.fetch = async () => new Response('private-provider-details', {status:401});
    await assert.rejects(requestEditPlan({base:'https://router.example/v1',key:'test-private-key',model:'test-text'},'softer',current), /HTTP 401/);
  } finally { globalThis.fetch = originalFetch; }
});
