import { PRESETS } from './presets';
import type { ProcessingOptions } from './processing';

export interface Recipe { version: 1; name: string; options: ProcessingOptions }
export interface EditPlan { options: ProcessingOptions; explanation: string }

/** One trust boundary for imported links, storage, remote model replies and MCP tools. */
export function validateOptions(value: unknown): ProcessingOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Settings must be an object.');
  const object = value as Record<string, unknown>;
  if (Object.keys(object).some(k => !['preset', 'detail', 'ink', 'colors'].includes(k))) throw new Error('Unknown setting in recipe.');
  const style = PRESETS.find(p => p.id === object.preset);
  if (!style) throw new Error('Choose one of the three supported styles.');
  for (const key of ['detail', 'ink'] as const) {
    if (typeof object[key] !== 'number' || !Number.isFinite(object[key]) || object[key] < 0 || object[key] > 100) throw new Error(`${key} must be between 0 and 100.`);
  }
  const colors = object.colors ?? style.levels;
  if (typeof colors !== 'number' || !Number.isInteger(colors) || colors < 3 || colors > 12) throw new Error('Tone levels must be an integer from 3 to 12.');
  return { preset: style.id, detail: Math.round(object.detail as number), ink: Math.round(object.ink as number), colors };
}

export function validateRecipe(value: unknown): Recipe {
  if (!value || typeof value !== 'object') throw new Error('Invalid recipe.');
  const recipe = value as Record<string, unknown>;
  if (Object.keys(recipe).some(k => !['version', 'name', 'options'].includes(k)) || recipe.version !== 1 ||
      typeof recipe.name !== 'string' || !recipe.name.trim() || recipe.name.length > 60) throw new Error('Invalid recipe name or version.');
  return { version: 1, name: recipe.name.trim(), options: validateOptions(recipe.options) };
}

export function recipeHash(recipe: Recipe): string { return '#recipe=' + encodeURIComponent(JSON.stringify(validateRecipe(recipe))); }
export function recipeFromHash(hash: string): Recipe | undefined {
  if (!hash.startsWith('#recipe=')) return;
  if (hash.length > 2000) throw new Error('This recipe link is too long.');
  try { return validateRecipe(JSON.parse(decodeURIComponent(hash.slice(8)))); }
  catch { throw new Error('This recipe link is invalid. Choose a style to continue.'); }
}

/** Deliberately small, explainable command vocabulary; never pretends to be a language model. */
export function planLocalEdit(prompt: string, current: ProcessingOptions): EditPlan {
  if (!prompt.trim() || prompt.length > 600) throw new Error('Describe an edit in 1–600 characters.');
  const text = prompt.toLowerCase();
  if (/remove|replace|background|object|face|person|generate|inpaint/.test(text)) throw new Error('These filters cannot remove objects or invent new pixels. Try “softer outlines”, “monochrome”, or “fewer colors”.');
  const options = validateOptions(current);
  let recognized = false;
  const apply = (pattern: RegExp, edit: () => void) => { if (pattern.test(text)) { edit(); recognized = true; } };
  apply(/mono|black and white|gr[ae]y|grayscale/, () => { options.preset = 'mono-ink'; options.colors = 4; });
  apply(/comic|graphic|bold|dramatic/, () => { options.preset = 'graphic-novel'; options.ink = 75; options.colors = 5; });
  apply(/soft|gentle|subtle/, () => { options.ink = 20; });
  apply(/simpler|simplify|less texture|smooth|handout/, () => { options.detail = 25; });
  apply(/more (texture|detail)|retain detail/, () => { options.detail = 80; });
  apply(/fewer (colou?rs|tones)|poster/, () => { options.colors = 4; });
  apply(/more (colou?rs|tones)|gentle shading/, () => { options.colors = 10; });
  apply(/no (outlines|lines)|without outlines/, () => { options.ink = 0; });
  if (!recognized) throw new Error('Local commands recognize soft, bold, monochrome, simpler, more detail, and fewer colors. Use your text model for other wording.');
  return { options, explanation: 'Local command rules mapped your words to filter settings. Preview the result; these filters do not understand the objects in your photo.' };
}

export function parseModelPlan(content: string): EditPlan {
  if (content.length > 4000) throw new Error('The model returned too much text. Ask for a shorter edit.');
  let value: Record<string, unknown>;
  try { value = JSON.parse(content.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '')); }
  catch { throw new Error('The model did not return valid settings JSON. Try again or use local commands.'); }
  if (!value || typeof value !== 'object' || Object.keys(value).some(k => !['options', 'explanation'].includes(k)) ||
      typeof value.explanation !== 'string' || value.explanation.length > 400) throw new Error('The model returned an unsupported edit plan.');
  return { options: validateOptions(value.options), explanation: value.explanation };
}
