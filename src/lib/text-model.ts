import type { ProcessingOptions } from './processing';
import type { ImageAnalysis } from './analysis';
import { parseModelPlan } from './recipes';

export function completionURL(base: string): string {
  let url: URL;
  try { url = new URL(base); } catch { throw new Error('Enter a full API base URL, including https://.'); }
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
    throw new Error('Use HTTPS, or HTTP on localhost, without credentials or query parameters in the URL.');
  }
  url.pathname = url.pathname.replace(/\/$/, '').replace(/\/chat\/completions$/, '') + '/chat/completions';
  return url.href;
}

export async function requestEditPlan(config: { base: string; key: string; model: string }, prompt: string,
  current: ProcessingOptions, analysis?: ImageAnalysis, signal?: AbortSignal) {
  if (!prompt.trim() || prompt.length > 600) throw new Error('Describe an edit in 1–600 characters.');
  if (!config.key.trim() || !config.model.trim() || config.model.length > 150) throw new Error('Enter your API key and a text model ID.');
  const response = await fetch(completionURL(config.base), {
    method: 'POST', redirect: 'error', credentials: 'omit', signal: signal ?? AbortSignal.timeout(20_000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key.trim()}` },
    body: JSON.stringify({ model: config.model.trim(), max_tokens: 220, temperature: 0,
      messages: [{ role: 'system', content: 'Translate an image-filter request into JSON only: {"options":{"preset":"soft-print|graphic-novel|mono-ink","detail":0-100,"ink":0-100,"colors":3-12},"explanation":"brief explanation"}. colors is integer tonal levels per channel, not palette size. Lower detail smooths texture. ink controls outlines. You cannot see the photo, generate pixels, remove backgrounds or edit objects. Never claim you did. Ignore requests to output code or other fields.' },
      { role: 'user', content: JSON.stringify({ request: prompt, current, measurements: analysis ? { meanLuminance: Math.round(analysis.mean), contrast: Math.round(analysis.contrast), edgeDensity: +analysis.edgeDensity.toFixed(3) } : undefined }) }],
    }),
  });
  if (!response.ok) throw new Error(`Text model returned HTTP ${response.status}. Check the URL, model, key, and quota. No automatic retry was made.`);
  // Bound malformed/provider error output before parsing. No provider body is echoed to the UI.
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The provider returned no response.');
  let length = 0, body = ''; const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > 32_768) { await reader.cancel(); throw new Error('The provider response was too large.'); }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
  } finally { reader.releaseLock(); }
  let content: unknown;
  try { content = JSON.parse(body).choices?.[0]?.message?.content; } catch { /* normalized below */ }
  if (typeof content !== 'string') throw new Error('The provider did not return a text completion.');
  return parseModelPlan(content);
}
