import './style.css';
import { PRESETS } from './lib/presets';
import type { PixelImage, ProcessedImage, ProcessingOptions } from './lib/processing';
import { inspectRaster, outputDimensions, exportName, MAX_FILE_BYTES } from './lib/import';
import { createWorkbench } from './workbench';
import type { ImageAnalysis } from './lib/analysis';
import { validateOptions } from './lib/recipes';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const original = $<HTMLCanvasElement>('original');
const canvas = $<HTMLCanvasElement>('result');
const file = $<HTMLInputElement>('file');
const detail = $<HTMLInputElement>('detail');
const ink = $<HTMLInputElement>('ink');
const colors = $<HTMLInputElement>('colors');
const wipe = $<HTMLInputElement>('wipe');
const download = $<HTMLButtonElement>('download');
const print = $<HTMLButtonElement>('print');
const frame = $('image-frame');
let source: PixelImage | undefined;
let processed: ProcessedImage | undefined;
let name = 'manarola-sample.jpg';
let preset: ProcessingOptions['preset'] = 'soft-print';
let resultPreset: ProcessingOptions['preset'] = preset;
let resultName = name;
let revealNext = false;
let generation = 0;
let loadGeneration = 0;
let debounce: ReturnType<typeof setTimeout>;
let slowTimer: ReturnType<typeof setTimeout>;
let timeout: ReturnType<typeof setTimeout>;
let toastTimer: ReturnType<typeof setTimeout>;
let worker: Worker | undefined;
let printUrl = '';
const currentOptions = (): ProcessingOptions => ({ preset, detail: +detail.value, ink: +ink.value, colors: +colors.value });
const workbench = createWorkbench(currentOptions, options => {
  const next = validateOptions(options); preset = next.preset;
  detail.value = String(next.detail); ink.value = String(next.ink); colors.value = String(next.colors);
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === preset)));
  updateValues(); clearTimeout(debounce); process();
});

function context(target: HTMLCanvasElement) {
  const ctx = target.getContext('2d', { willReadFrequently: target === original });
  if (!ctx) throw new Error('Your browser could not open an image canvas. Try a current browser or reload the page.');
  return ctx;
}
function announce(message: string) { $('announcement').textContent = message; }
function toast(message: string) {
  clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('visible');
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4500);
}
function showError(message: string) {
  $('error').textContent = message; $('error').hidden = false;
  $('status').textContent = processed ? 'Previous result kept' : 'Needs a photo';
  announce(message);
}
function setBusy(busy: boolean, label = 'Drawing your illustration…') {
  clearTimeout(slowTimer); clearTimeout(timeout);
  $('dropzone').setAttribute('aria-busy', String(busy));
  $('processing').hidden = !busy;
  $('processing-label').textContent = label;
  download.disabled = busy || !processed; print.disabled = busy || !processed;
  if (busy) {
    $('status').textContent = 'Processing locally';
    slowTimer = setTimeout(() => { $('processing-label').textContent = 'Still working on your device. Larger photos take a moment…'; }, 1800);
  }
}
function createWorker() {
  const currentWorker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  worker = currentWorker;
  currentWorker.onmessage = (event: MessageEvent<{id: number; result?: ProcessedImage; analysis?: ImageAnalysis; error?: string}>) => {
    if (event.data.id !== generation) return;
    if (event.data.error || !event.data.result) {
      setBusy(false); showError(event.data.error || 'Processing failed. Try another style or a smaller photo.'); return;
    }
    processed = event.data.result;
    workbench.setAnalysis(event.data.analysis);
    resultPreset = preset; resultName = name;
    canvas.width = processed.width; canvas.height = processed.height;
    context(canvas).putImageData(new ImageData(new Uint8ClampedArray(processed.data), processed.width, processed.height), 0, 0);
    $('metric-time').textContent = `${Math.round(processed.metrics.processingMs)} ms`;
    $('metric-ink').textContent = `${Math.round(processed.metrics.estimatedInkCoverage * 100)}%`;
    $('status').textContent = 'Made on your device';
    $('export-note').textContent = `${processed.width} × ${processed.height} px · PNG · no watermark`;
    $('error').hidden = true;
    setBusy(false);
    frame.classList.add('has-result');
    if (revealNext && frame.dataset.view === 'compare' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timing = { duration: 550, easing: 'cubic-bezier(.16,1,.3,1)' };
      $('result-clip').animate([{clipPath:'inset(0 100% 0 0)'},{clipPath:`inset(0 ${100 - Number(wipe.value)}% 0 0)`}], timing);
      $('wipe-seam').animate([{left:'0%'},{left:`${wipe.value}%`}], timing);
    }
    revealNext = false;
    announce(`${PRESETS.find(p => p.id === preset)?.name || preset} ready. ${processed.width} by ${processed.height} pixels. Download or print your illustration.`);
  };
  currentWorker.onerror = event => {
    event.preventDefault(); if (worker !== currentWorker) return;
    generation++; setBusy(false); showError('The local image worker stopped. Change a setting to try again, or reload the page.'); currentWorker.terminate();
  };
}
function process() {
  if (!source) return;
  generation++; worker?.terminate();
  setBusy(true); $('error').hidden = true;
  const pixels = new Uint8ClampedArray(source.data);
  try {
    createWorker();
    worker!.postMessage({ id: generation, image: { ...source, data: pixels }, options: currentOptions() }, [pixels.buffer]);
  } catch { setBusy(false); showError('Your browser cannot start the local image worker. Try a current browser or reload the page.'); return; }
  timeout = setTimeout(() => { generation++; worker?.terminate(); setBusy(false); showError('This photo took too long on your device. Try a smaller image or reload to free memory.'); }, 30_000);
}
function selectPreset(id: ProcessingOptions['preset']) {
  preset = id;
  const style = PRESETS.find(p => p.id === id)!;
  detail.value = String(style.defaultDetail); ink.value = String(style.defaultInk);
  colors.value = String(style.levels);
  updateValues();
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === id)));
  clearTimeout(debounce); process();
}
function updateValues() { $('detail-value').textContent = detail.value; $('ink-value').textContent = ink.value; $('colors-value').textContent = colors.value; }
async function openBlob(blob: Blob, filename: string, sample: boolean, token: number) {
  if (blob.size > MAX_FILE_BYTES) throw new Error('This file is over 20 MB. Save a smaller JPG, PNG or WebP and try again.');
  inspectRaster(new Uint8Array(await blob.slice(0, 1024 * 1024).arrayBuffer()));
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  try {
    if (token !== loadGeneration) return;
    const size = outputDimensions(bitmap.width, bitmap.height);
    original.width = size.width; original.height = size.height;
    const ctx = context(original); ctx.clearRect(0, 0, size.width, size.height);
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    const image = ctx.getImageData(0, 0, size.width, size.height);
    source = { width: size.width, height: size.height, data: image.data };
    processed = undefined; name = filename; revealNext = true; frame.classList.remove('has-result');
    workbench.setAnalysis();
    canvas.width = size.width; canvas.height = size.height;
    $('filename').textContent = filename; $('filename').title = filename;
    $('dimensions').textContent = `${size.width} × ${size.height}`;
    $('sample-label').textContent = sample ? 'Sample · Manarola, Green Liu / Unsplash' : 'Your photo · held only in this browser tab';
    $('sample-label').title = sample ? 'Licensed sample by Green Liu: https://unsplash.com/photos/wBV8aZSRc4A' : 'No image upload or server processing';
    $('clear').removeAttribute('disabled'); $('empty-state').hidden = true; frame.hidden = false;
    process();
  } finally { bitmap.close(); }
}
async function openFile(selected: File) {
  const token = ++loadGeneration; clearTimeout(debounce); generation++; worker?.terminate();
  setBusy(true, 'Opening your photo locally…');
  try { await openBlob(selected, selected.name, false, token); }
  catch (error) { if (token === loadGeneration) { setBusy(false); showError(error instanceof Error ? error.message : 'This photo could not be opened. Try a JPG, PNG or WebP.'); if (!source) $('empty-state').hidden = false; } }
  file.value = '';
}
async function loadSample() {
  const token = ++loadGeneration; generation++; clearTimeout(debounce); worker?.terminate();
  setBusy(true, 'Opening the sample photo…');
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}samples/scene.jpg`);
    if (!response.ok) throw new Error('The sample could not load. Try again, or open a photo from your device.');
    await openBlob(await response.blob(), 'manarola-sample.jpg', true, token);
  } catch (error) { if (token === loadGeneration) { setBusy(false); showError(error instanceof Error ? error.message : 'The sample is unavailable. Open a photo from your device.'); if (!source) $('empty-state').hidden = false; } }
}
function clearPhoto() {
  loadGeneration++; generation++; clearTimeout(debounce); worker?.terminate(); source = undefined; processed = undefined;
  frame.classList.remove('has-result'); revealNext = false;
  workbench.setAnalysis();
  original.width = original.height = canvas.width = canvas.height = 1;
  if (printUrl) URL.revokeObjectURL(printUrl); printUrl = '';
  $('print-image-slot').replaceChildren();
  frame.hidden = true; $('empty-state').hidden = false; setBusy(false);
  $('filename').textContent = 'No photo selected'; $('dimensions').textContent = '';
  $('sample-label').textContent = 'Choose a photo or explore the sample';
  $('metric-time').textContent = $('metric-ink').textContent = '—'; $('status').textContent = 'Ready for your photo';
  $('clear').setAttribute('disabled', ''); $('error').hidden = true; $('export-note').textContent = 'No watermark. No sign-up.';
  announce('Photo cleared from the editor. Downloaded files remain on your device.');
}
function asBlob(): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The export could not be created. Try a smaller image.')), 'image/png'));
}

document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.addEventListener('click', () => selectPreset(button.dataset.preset as ProcessingOptions['preset'])));
for (const input of [detail, ink, colors]) input.addEventListener('input', () => { updateValues(); clearTimeout(debounce); download.disabled = true; print.disabled = true; debounce = setTimeout(process, 180); });
wipe.addEventListener('input', () => { for (const element of [$('result-clip'),$('wipe-seam')]) element.getAnimations().forEach(a=>a.cancel()); frame.style.setProperty('--wipe', `${wipe.value}%`); });
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.addEventListener('click', () => { frame.dataset.view = button.dataset.view; document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); }));
frame.dataset.view = 'compare';
$('upload').addEventListener('click', () => file.click());
document.querySelector('.empty-open')!.addEventListener('click', () => file.click());
file.addEventListener('change', () => { if (file.files?.[0]) void openFile(file.files[0]); });
$('sample').addEventListener('click', () => void loadSample()); $('retry-sample').addEventListener('click', () => void loadSample());
$('reset').addEventListener('click', () => selectPreset(preset)); $('clear').addEventListener('click', clearPhoto);
let dragDepth = 0;
$('dropzone').addEventListener('dragenter', event => { event.preventDefault(); dragDepth++; $('drop-overlay').hidden = false; });
$('dropzone').addEventListener('dragover', event => event.preventDefault());
$('dropzone').addEventListener('dragleave', () => { if (--dragDepth <= 0) $('drop-overlay').hidden = true; });
$('dropzone').addEventListener('drop', event => { event.preventDefault(); dragDepth = 0; $('drop-overlay').hidden = true; const files = event.dataTransfer?.files; if (files?.length === 1) void openFile(files[0]); else showError('Drop one photo at a time so you can inspect each result.'); });
window.addEventListener('dragover', event => event.preventDefault()); window.addEventListener('drop', event => event.preventDefault());
download.addEventListener('click', async () => {
  if (!processed || download.disabled) return;
  const filename = exportName(resultName, resultPreset);
  try {
    const blob = await asBlob(); const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.download = filename; link.href = url; link.click(); setTimeout(() => URL.revokeObjectURL(url), 15_000);
    toast('Your illustration is ready. Check your downloads.');
  } catch (error) { showError(error instanceof Error ? error.message : 'Download failed. Please try again.'); }
});
print.addEventListener('click', async () => {
  if (!processed || print.disabled) return;
  const snapshot = generation; const title = resultName.replace(/\.[^.]+$/, '').slice(0,80);
  try {
    const blob = await asBlob(); if (snapshot !== generation || !processed) return;
    if (printUrl) URL.revokeObjectURL(printUrl); const url = URL.createObjectURL(blob); printUrl = url;
    const image = new Image(); image.alt = 'Your illustration ready to print'; image.src = url; await image.decode();
    if (snapshot !== generation || !processed) { URL.revokeObjectURL(url); return; }
    $('print-image-slot').replaceChildren(image); $('print-title').textContent = title; window.print();
  } catch { if (snapshot === generation) showError('The print sheet could not open. Download the PNG and print it from your device instead.'); }
});
function updateConnection() { $('connection').hidden = navigator.onLine; }
window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection); updateConnection();
try { selectPreset('soft-print'); workbench.readHash(); void loadSample(); }
catch { setBusy(false); showError('Your browser cannot start the local editor. Try a current version of Chrome, Firefox, Edge or Safari.'); $('empty-state').hidden = false; }
if (import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load', () => { void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* The online editor remains usable when offline caching is unavailable. */ }); });

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
function setMotion(paused: boolean) {
  document.body.classList.toggle('motion-paused', paused);
  $('motion-toggle').setAttribute('aria-pressed', String(paused));
  $('motion-toggle').textContent = paused ? 'Enable background motion' : 'Pause background motion';
}
setMotion(motionPreference.matches);
motionPreference.addEventListener('change', event => setMotion(event.matches));
$('motion-toggle').addEventListener('click', () => setMotion(!document.body.classList.contains('motion-paused')));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting)), { threshold: .15 });
  document.querySelectorAll('.process-section,.workbench').forEach(section => observer.observe(section));
}
