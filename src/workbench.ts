import type { ImageAnalysis } from './lib/analysis';
import type { ProcessingOptions } from './lib/processing';
import { planLocalEdit, recipeFromHash, recipeHash, validateRecipe, type EditPlan, type Recipe } from './lib/recipes';
import { requestEditPlan } from './lib/text-model';
import { PRESETS } from './lib/presets';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const STORAGE = 'toonforge.recipes.v1';

export function createWorkbench(getOptions: () => ProcessingOptions, apply: (options: ProcessingOptions) => void) {
  let analysis: ImageAnalysis | undefined;
  let plan: EditPlan | undefined;
  let recipes: Recipe[] = [];
  let controller: AbortController | undefined;
  const status = (text: string) => { $('direction-status').textContent = text; };
  const shelfStatus = (text: string) => { $('shelf-status').textContent = text; };
  function cancelRequest() {
    const previous = controller; controller = undefined; previous?.abort();
    $<HTMLButtonElement>('plan-model').disabled = false; $('cancel-model').hidden = true;
  }
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) ?? '[]');
    if (!Array.isArray(value) || value.length > 12) throw new Error();
    recipes = value.map(validateRecipe);
  } catch { shelfStatus('Saved settings could not be loaded. You can still use and share recipes.'); }

  function propose(next: EditPlan) {
    plan = next; $('plan-preview').hidden = false;
    const style = PRESETS.find(p => p.id === next.options.preset)!;
    $('plan-settings').textContent = `${style.name} · texture ${next.options.detail} · outlines ${next.options.ink} · ${next.options.colors} tone levels`;
    $('plan-explanation').textContent = next.explanation;
    status('Plan ready. Apply it to preview the change.');
  }
  function persist(next: Recipe[]) {
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); recipes = next; renderShelf(); shelfStatus('Recipe shelf updated on this device.'); }
    catch { shelfStatus('Your browser could not save settings. Copy a recipe link to keep this look.'); }
  }
  function renderShelf() {
    $('recipe-list').replaceChildren(); $('shelf-empty').hidden = recipes.length > 0;
    $('recipe-count').textContent = `${recipes.length} / 12`;
    recipes.forEach((recipe, index) => {
      const row = document.createElement('li');
      const use = document.createElement('button'); use.className = 'recipe-use'; use.textContent = recipe.name;
      use.title = `Apply ${recipe.name}`;
      use.addEventListener('click', () => { apply(recipe.options); shelfStatus(`Applied ${recipe.name}. Open any photo to use this look.`); });
      const remove = document.createElement('button'); remove.className = 'text-button'; remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove recipe ${recipe.name}`);
      remove.addEventListener('click', () => persist(recipes.filter((_, i) => i !== index)));
      row.append(use, remove); $('recipe-list').append(row);
    });
  }
  renderShelf();
  $('save-recipe').addEventListener('click', () => {
    try {
      const recipe = validateRecipe({ version: 1, name: $<HTMLInputElement>('recipe-name').value, options: getOptions() });
      if (recipes.length === 12) throw new Error('Your shelf is full. Remove a recipe before saving another.');
      persist([...recipes, recipe]);
    } catch (error) { shelfStatus(error instanceof Error ? error.message : 'Give your recipe a name.'); }
  });
  $('share-recipe').addEventListener('click', async () => {
    const recipe: Recipe = { version: 1, name: $<HTMLInputElement>('recipe-name').value.trim().slice(0, 60) || 'Shared look', options: getOptions() };
    const url = new URL(location.href); url.hash = recipeHash(recipe);
    const input = $<HTMLInputElement>('share-link'); input.value = url.href;
    try { await navigator.clipboard.writeText(url.href); input.hidden = true; shelfStatus('Settings link copied. It contains no image or API key.'); }
    catch { input.hidden = false; input.focus(); input.select(); shelfStatus('Copy the settings link below. It contains no image or API key.'); }
  });
  $('direction-form').addEventListener('submit', event => {
    event.preventDefault();
    cancelRequest();
    try { propose(planLocalEdit($<HTMLTextAreaElement>('direction').value, getOptions())); }
    catch (error) { plan = undefined; $('plan-preview').hidden = true; status((error as Error).message); }
  });
  document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(button => button.addEventListener('click', () => {
    cancelRequest();
    $<HTMLTextAreaElement>('direction').value = button.dataset.command!;
    propose(planLocalEdit(button.dataset.command!, getOptions()));
  }));
  $('apply-plan').addEventListener('click', () => { if (plan) { apply(plan.options); status('Settings applied locally. Compare your result in the studio.'); } });
  $('auto-tune').addEventListener('click', () => { if (analysis) { apply(analysis.recommendation); status('Applied a measured starting point. Inspect fine details in the comparison.'); } });
  $('direction').addEventListener('input', () => {
    cancelRequest(); plan = undefined; $('plan-preview').hidden = true;
    status('Instruction changed. Plan an edit to review new settings.');
  });
  $('cancel-model').addEventListener('click', () => { cancelRequest(); status('Request cancelled. No settings changed.'); });
  $('disconnect-model').addEventListener('click', () => {
    cancelRequest(); for (const id of ['model-url', 'model-id', 'model-key']) $<HTMLInputElement>(id).value = '';
    status('Connection details cleared from this tab.');
  });
  window.addEventListener('pagehide', cancelRequest);
  $('plan-model').addEventListener('click', async () => {
    const config = { base: $<HTMLInputElement>('model-url').value, model: $<HTMLInputElement>('model-id').value, key: $<HTMLInputElement>('model-key').value };
    if (!config.base || !config.model || !config.key) { $<HTMLDetailsElement>('model-connection').open = true; $<HTMLInputElement>('model-url').focus(); status('Add your provider URL, text model and key below. Nothing has been sent.'); return; }
    cancelRequest(); const request = new AbortController(); controller = request;
    const timer = setTimeout(() => request.abort(), 20_000);
    $<HTMLButtonElement>('plan-model').disabled = true; $('cancel-model').hidden = false;
    $('plan-preview').hidden = true; plan = undefined;
    status('Requesting one settings plan. Your image is staying on this device.');
    try {
      const next = await requestEditPlan(config, $<HTMLTextAreaElement>('direction').value, getOptions(), analysis, request.signal);
      if (controller === request && !request.signal.aborted) propose(next);
    } catch (error) {
      if (controller !== request) return;
      status(request.signal.aborted ? 'Request cancelled or timed out. No settings changed.' : error instanceof TypeError
        ? 'The provider could not be reached. Check its URL and browser CORS support. Local commands still work.' : (error as Error).message);
    } finally {
      clearTimeout(timer);
      if (controller === request) { controller = undefined; $<HTMLButtonElement>('plan-model').disabled = false; $('cancel-model').hidden = true; }
    }
  });

  function readHash() {
    try { const recipe = recipeFromHash(location.hash); if (recipe) { apply(recipe.options); $<HTMLInputElement>('recipe-name').value = recipe.name; shelfStatus(`Loaded ${recipe.name} from this link. Open your own photo to use it.`); } }
    catch (error) { shelfStatus((error as Error).message); }
  }
  window.addEventListener('hashchange', readHash);

  return {
    readHash,
    setAnalysis(next?: ImageAnalysis) {
      analysis = next; $<HTMLButtonElement>('auto-tune').disabled = !next;
      $('analysis-tag').textContent = next ? 'Original image · local' : 'Waiting for pixels';
      $('analysis-mean').textContent = next ? `${Math.round(next.mean)} / 255` : '—';
      $('analysis-contrast').textContent = next ? next.contrast.toFixed(1) : '—';
      $('analysis-edges').textContent = next ? `${(next.edgeDensity * 100).toFixed(1)}%` : '—';
      $('analysis-advice').textContent = next?.advice ?? 'Open a photo to inspect its tonal range and texture.';
      const canvas = $<HTMLCanvasElement>('histogram'); const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (next) {
        const max = Math.max(1, ...next.histogram);
        next.histogram.forEach((count, i) => {
          const height = count / max * 124;
          ctx.fillStyle = i < 12 ? '#5146ba' : i < 24 ? '#a69dcf' : '#c2bef4';
          ctx.fillRect(i * 20, 140 - height, 16, height);
        });
        canvas.setAttribute('aria-label', `Original luminance histogram. Mean ${Math.round(next.mean)} of 255, standard deviation ${next.contrast.toFixed(1)}.`);
      } else canvas.setAttribute('aria-label', 'Luminance distribution; no photo selected');
    },
  };
}
