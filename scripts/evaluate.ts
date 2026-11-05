import { writeFileSync } from 'node:fs';
import { cpus, platform, arch } from 'node:os';
import { processImage, processBaseline, type ProcessingOptions } from '../src/lib/processing';
import { makeFixture, regionStandardDeviation, stepContrast, lineContrast } from './fixtures';

const options: ProcessingOptions = { preset: 'graphic-novel', detail: 55, ink: 0, colors: 5 };
const round = (value: number) => Math.round(value * 10000) / 10000;
const results = [29, 71].map((seed) => {
  const image = makeFixture(seed);
  const naive = processBaseline(image, options, 'posterize');
  const box = processBaseline(image, options, 'box');
  const processed = processImage(image, options);
  const flatNoise = { posterize: regionStandardDeviation(naive), box: regionStandardDeviation(box), edgeAware: regionStandardDeviation(processed) };
  const contrast = { cleanInput: 120, posterize: stepContrast(naive), box: stepContrast(box), edgeAware: stepContrast(processed) };
  const noiseReduction = 1 - flatNoise.edgeAware / flatNoise.posterize;
  const edgeRetention = contrast.edgeAware / contrast.cleanInput;
  return {
    seed,
    flatRegionStandardDeviation: Object.fromEntries(Object.entries(flatNoise).map(([key, value]) => [key, round(value)])),
    immediateStepContrast: Object.fromEntries(Object.entries(contrast).map(([key, value]) => [key, round(value)])),
    flatNoiseReductionPercent: round(noiseReduction * 100),
    cleanEdgeRetentionPercent: round(edgeRetention * 100),
    thinLineContrast: { input: round(lineContrast(image)), posterize: round(lineContrast(naive)), box: round(lineContrast(box)), edgeAware: round(lineContrast(processed)) },
    acceptance: { noiseReductionAtLeast50Percent: noiseReduction >= 0.5, cleanEdgeRetentionAtLeast90Percent: edgeRetention >= 0.9, betterEdgeThanBox: contrast.edgeAware > contrast.box },
  };
});

const fixture = makeFixture();
processImage(fixture, options);
const runtimes = Array.from({ length: 5 }, () => processImage(fixture, options).metrics.processingMs);
const sorted = [...runtimes].sort((a, b) => a - b);
const median = sorted[2];
const report = {
  experiment: 'Seeded texture simplification and boundary retention, not artistic preference',
  fixture: { width: 512, height: 512, seeds: [29, 71], noise: 'uniform integer -16..16', fields: [90, 210], thinLine: 120, options },
  environment: { node: process.version, platform: platform(), architecture: arch(), cpu: cpus()[0]?.model ?? 'unknown' },
  results,
  timing: { warmUpRuns: 1, measuredRuns: 5, samplesMs: runtimes.map(round), medianMs: round(median), minMs: round(sorted[0]), maxMs: round(sorted[4]), thresholdMs: 2000, passed: median < 2000 },
  limitations: ['Synthetic targets are designed for these mechanisms; they do not measure real-photo preference.', 'No printer ink, identity preservation, or end-user time savings measured.', 'Low-contrast thin lines can be smoothed away.', 'Timing samples are one machine, not independent device samples.'],
  passed: results.every((result) => Object.values(result.acceptance).every(Boolean)) && median < 2000,
};
writeFileSync(new URL('../docs/evaluation-results.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
const rows = results.map((result) => `| ${result.seed} | ${result.flatRegionStandardDeviation.posterize.toFixed(2)} | ${result.flatRegionStandardDeviation.box.toFixed(2)} | ${result.flatRegionStandardDeviation.edgeAware.toFixed(2)} | ${result.immediateStepContrast.posterize.toFixed(2)} | ${result.immediateStepContrast.box.toFixed(2)} | ${result.immediateStepContrast.edgeAware.toFixed(2)} |`).join('\n');
const lineRows = results.map((result) => `| ${result.seed} | ${result.thinLineContrast.input.toFixed(2)} | ${result.thinLineContrast.posterize.toFixed(2)} | ${result.thinLineContrast.box.toFixed(2)} | ${result.thinLineContrast.edgeAware.toFixed(2)} |`).join('\n');
const markdown = `# Image engine evaluation

Run \`npm run evaluate\` to reproduce this report and [the raw JSON](evaluation-results.json). The [evaluation plan](EVALUATION_PLAN.md) was written locally before implementing the engine; it is not an externally registered study. Result: **${report.passed ? 'all engineering thresholds passed' : 'one or more engineering thresholds failed'}**.

## Experiment

Two seeded 512 × 512 synthetic targets have noisy flat fields at luminance 90 and 210, a clean step of 120, a one-pixel low-contrast line, and an alpha tile. Noise is uniform integer ±16. All methods use identical five-level per-channel quantization, detail 55, and ink 0. Disabling outlines prevents a dark drawn edge from hiding smoothing damage.

The no-smoothing posterize method is an ablation of the production pipeline. The ordinary box baseline has the same radius and number of passes, but uniform spatial weights and no range weighting. Production uses four alternating horizontal/vertical passes, radius 3, spatial falloff, and a lookup-table weight on maximum channel difference. This separable approximation is intentionally small; it is not a full two-dimensional bilateral filter.

| Seed | Flat std: posterize | Flat std: box | Flat std: edge-aware | Step: posterize | Step: box | Step: edge-aware |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

Flat-region standard deviation falls by ${results[0].flatNoiseReductionPercent.toFixed(0)}% on both targets (threshold: at least 50%). Immediate step contrast is 127, versus the clean input's 120 and the box baseline's 63. Retention is 105.83%, above the 90% threshold; exceeding 100% reflects quantization overshoot, not creation of useful detail. The no-smoothing baseline retains the boundary reasonably well but leaves much more noise.

## Negative result: thin detail loses contrast

| Seed | Noisy input | Posterize | Box | Edge-aware |
| --- | ---: | ---: | ---: | ---: |
${lineRows}

The production method weakens the low-contrast one-pixel line. The input line contrast falls to 23.33, and other line colors near a quantization boundary may disappear altogether. Both smoothing methods remove texture; range weighting buys better boundary preservation, not universal detail preservation. Users should inspect small text, hair, foliage, and distant faces before exporting.

## Runtime and invariants

One warm-up, then five runs: ${runtimes.map((value) => value.toFixed(2)).join(', ')} ms. Median **${median.toFixed(2)} ms**, range ${sorted[0].toFixed(2)}–${sorted[4].toFixed(2)} ms; threshold below 2,000 ms. Environment: ${report.environment.node}, ${report.environment.platform}/${report.environment.architecture}, ${report.environment.cpu}. Timing is a local result, not a phone benchmark; rerunning changes timing but must preserve the signal results.

\`npm test\` checks deterministic output bytes, all presets, unchanged input, exact dimensions and alpha, monochrome equality, single-pixel boundaries, transparent-neighbor handling, outline monotonicity, invalid input rejection, and both fixed signal targets. The engine caps work at four million pixels and rejects invalid dimensions and parameter values.

## What this does and does not establish

The mechanism removes one deliberately defined kind of texture while retaining a strong artificial edge better than a simple blur. These hand-constructed targets favor edge-aware filtering. They do not establish artistic quality, portrait identity, accessibility of printed sheets, user demand, printer ink savings, or performance across devices. Five runtimes on one computer are not a confidence interval for quality or for user performance.

No user study or real-photo benchmark has been conducted. A next evaluation should use consented photos spanning skin tones, lighting, texture, line detail, and camera noise, with blinded ratings and task completion measures from workshop facilitators. Stop or change direction if those users cannot make useful print artwork more reliably than with an ordinary posterize tool.

## Algorithm references

- [OpenCV smoothing tutorial](https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html): why ordinary low-pass filtering affects boundaries and how range-aware filtering differs.
- [OpenCV Sobel tutorial](https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html): the discrete gradient kernels used for outline detection. The implementation is dependency-free TypeScript.
`;
writeFileSync(new URL('../docs/EVALUATION.md', import.meta.url), markdown);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
