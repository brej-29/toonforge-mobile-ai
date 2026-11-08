# Image engine evaluation

The narrative runtime below preserves the original 2026-11-05 measurement. The 2026-11-08 rerun in [evaluation-results.json](evaluation-results.json) passes the same signal thresholds, with an engine-only median of 104.28 ms on the recorded Windows/i5 machine. It excludes image decoding, source analysis, worker startup and export; it is not a browser/phone performance result.

Run `npm run evaluate` to reproduce this report and [the raw JSON](evaluation-results.json). The [evaluation plan](EVALUATION_PLAN.md) was written locally before implementing the engine; it is not an externally registered study. Result: **all engineering thresholds passed**.

## Experiment

Two seeded 512 × 512 synthetic targets have noisy flat fields at luminance 90 and 210, a clean step of 120, a one-pixel low-contrast line, and an alpha tile. Noise is uniform integer ±16. All methods use identical five-level per-channel quantization, detail 55, and ink 0. Disabling outlines prevents a dark drawn edge from hiding smoothing damage.

The no-smoothing posterize method is an ablation of the production pipeline. The ordinary box baseline has the same radius and number of passes, but uniform spatial weights and no range weighting. Production uses four alternating horizontal/vertical passes, radius 3, spatial falloff, and a lookup-table weight on maximum channel difference. This separable approximation is intentionally small; it is not a full two-dimensional bilateral filter.

| Seed | Flat std: posterize | Flat std: box | Flat std: edge-aware | Step: posterize | Step: box | Step: edge-aware |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 29 | 30.11 | 0.00 | 0.00 | 116.00 | 63.00 | 127.00 |
| 71 | 30.19 | 0.00 | 0.00 | 117.00 | 63.00 | 127.00 |

Flat-region standard deviation falls by 100% on both targets (threshold: at least 50%). Immediate step contrast is 127, versus the clean input's 120 and the box baseline's 63. Retention is 105.83%, above the 90% threshold; exceeding 100% reflects quantization overshoot, not creation of useful detail. The no-smoothing baseline retains the boundary reasonably well but leaves much more noise.

## Negative result: thin detail loses contrast

| Seed | Noisy input | Posterize | Box | Edge-aware |
| --- | ---: | ---: | ---: | ---: |
| 29 | 29.73 | 44.33 | 0.67 | 23.33 |
| 71 | 28.38 | 42.67 | 2.00 | 23.33 |

The production method weakens the low-contrast one-pixel line. The input line contrast falls to 23.33, and other line colors near a quantization boundary may disappear altogether. Both smoothing methods remove texture; range weighting buys better boundary preservation, not universal detail preservation. Users should inspect small text, hair, foliage, and distant faces before exporting.

## Runtime and invariants

One warm-up, then five runs: 90.30, 177.44, 104.28, 88.20, 159.19 ms. Median **104.28 ms**, range 88.20–177.44 ms; threshold below 2,000 ms. Environment: v24.17.0, win32/x64, 13th Gen Intel(R) Core(TM) i5-13450HX. Timing is a local result, not a phone benchmark; rerunning changes timing but must preserve the signal results.

`npm test` checks deterministic output bytes, all presets, unchanged input, exact dimensions and alpha, monochrome equality, single-pixel boundaries, transparent-neighbor handling, outline monotonicity, invalid input rejection, and both fixed signal targets. The engine caps work at four million pixels and rejects invalid dimensions and parameter values.

## What this does and does not establish

The mechanism removes one deliberately defined kind of texture while retaining a strong artificial edge better than a simple blur. These hand-constructed targets favor edge-aware filtering. They do not establish artistic quality, portrait identity, accessibility of printed sheets, user demand, printer ink savings, or performance across devices. Five runtimes on one computer are not a confidence interval for quality or for user performance.

No user study or real-photo benchmark has been conducted. A next evaluation should use consented photos spanning skin tones, lighting, texture, line detail, and camera noise, with blinded ratings and task completion measures from workshop facilitators. Stop or change direction if those users cannot make useful print artwork more reliably than with an ordinary posterize tool.

## Algorithm references

- [OpenCV smoothing tutorial](https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html): why ordinary low-pass filtering affects boundaries and how range-aware filtering differs.
- [OpenCV Sobel tutorial](https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html): the discrete gradient kernels used for outline detection. The implementation is dependency-free TypeScript.
