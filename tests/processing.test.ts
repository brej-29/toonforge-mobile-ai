import assert from 'node:assert/strict';
import test from 'node:test';
import { processImage, processBaseline, MAX_PIXELS, type PixelImage, type ProcessingOptions } from '../src/lib/processing';
import { PRESETS } from '../src/lib/presets';
import { makeFixture, regionStandardDeviation, stepContrast } from '../scripts/fixtures';

const options: ProcessingOptions = { preset: 'graphic-novel', detail: 55, ink: 0, colors: 5 };
const pixel = (r: number, g: number, b: number, alpha = 255): PixelImage =>
  ({ width: 1, height: 1, data: new Uint8ClampedArray([r, g, b, alpha]) });

test('all presets preserve size, alpha, input bytes, and deterministic output', () => {
  const source = makeFixture(11, 32);
  for (let i = 3; i < source.data.length; i += 4) source.data[i] = i % 256;
  const original = source.data.slice();
  for (const preset of PRESETS) {
    const config = { preset: preset.id, detail: preset.defaultDetail, ink: preset.defaultInk };
    const first = processImage(source, config);
    const second = processImage(source, config);
    assert.equal(first.width, source.width);
    assert.equal(first.height, source.height);
    assert.deepEqual(first.data, second.data);
    for (let i = 3; i < first.data.length; i += 4) assert.equal(first.data[i], original[i]);
    assert.deepEqual(source.data, original);
    for (const value of Object.values(first.metrics)) assert.ok(Number.isFinite(value));
    assert.ok(first.metrics.edgeCoverage >= 0 && first.metrics.edgeCoverage <= 1);
    assert.ok(first.metrics.estimatedInkCoverage >= 0 && first.metrics.estimatedInkCoverage <= 1);
  }
});

test('monochrome has equal RGB channels and fully transparent images have zero darkness', () => {
  const result = processImage(makeFixture(17, 24), { ...options, preset: 'mono-ink' });
  for (let i = 0; i < result.data.length; i += 4) {
    assert.equal(result.data[i], result.data[i + 1]);
    assert.equal(result.data[i + 1], result.data[i + 2]);
  }
  const transparent = processImage(pixel(0, 0, 0, 0), options);
  assert.equal(transparent.metrics.estimatedInkCoverage, 0);
  assert.equal(transparent.metrics.edgeCoverage, 0);
});

test('single pixels and flat fields stay stable without a false outline', () => {
  assert.deepEqual([...processImage(pixel(255, 255, 255), options).data], [255, 255, 255, 255]);
  assert.deepEqual([...processImage(pixel(0, 0, 0), options).data], [0, 0, 0, 255]);
  assert.equal(processImage(pixel(127, 127, 127, 99), { ...options, ink: 100 }).metrics.edgeCoverage, 0);
});

test('transparent colors do not bleed into a visible neighbor', () => {
  const image = { width: 2, height: 1, data: new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 0]) };
  const result = processImage(image, options);
  assert.equal(result.data[0], 255);
  assert.equal(result.data[3], 255);
  assert.equal(result.data[7], 0);
});

test('outlines darken edges without changing alpha', () => {
  const image = makeFixture(19, 64);
  const noInk = processImage(image, { ...options, ink: 0 });
  const ink = processImage(image, { ...options, ink: 100 });
  let darkened = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    assert.ok(ink.data[i] <= noInk.data[i]);
    if (ink.data[i] < noInk.data[i]) darkened++;
    assert.equal(ink.data[i + 3], image.data[i + 3]);
  }
  assert.ok(darkened > 0);
});

test('invalid buffers, dimensions, styles and non-finite parameters fail closed', () => {
  for (const size of [0, -1, 1.1, NaN, Infinity, 8193, MAX_PIXELS + 1]) {
    assert.throws(() => processImage({ ...pixel(1, 2, 3), width: size }, options));
  }
  assert.throws(() => processImage({ width: 2001, height: 2000, data: new Uint8ClampedArray(0) }, options));
  assert.throws(() => processImage({ width: 2, height: 1, data: new Uint8ClampedArray(4) }, options));
  for (const value of [-1, 101, NaN, Infinity]) {
    assert.throws(() => processImage(pixel(1, 2, 3), { ...options, detail: value }));
    assert.throws(() => processImage(pixel(1, 2, 3), { ...options, ink: value }));
  }
  for (const colors of [2, 13, 5.5, NaN]) {
    assert.throws(() => processImage(pixel(1, 2, 3), { ...options, colors }));
  }
  assert.throws(() => processImage(pixel(1, 2, 3), { ...options, preset: 'unknown' as ProcessingOptions['preset'] }));
});

test('preregistered signal thresholds hold for two fixed seeds', () => {
  for (const seed of [29, 71]) {
    const image = makeFixture(seed);
    const naive = processBaseline(image, options, 'posterize');
    const box = processBaseline(image, options, 'box');
    const edgeAware = processImage(image, options);
    assert.ok(regionStandardDeviation(edgeAware) <= regionStandardDeviation(naive) * 0.5);
    assert.ok(stepContrast(edgeAware) >= 120 * 0.9);
    assert.ok(stepContrast(edgeAware) > stepContrast(box));
  }
});
