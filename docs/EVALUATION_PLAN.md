# Evaluation plan

Recorded before the browser image engine was implemented (2026-11-05).

## Question and scope

Can an inexpensive edge-aware smoothing pass reduce texture in flat regions before posterization, while preserving a deliberate high-contrast boundary? This is an engineering proxy for readable comic artwork, not a measurement of artistic quality or printer consumables.

## Fixed experiment

Use a seeded 512 × 512 synthetic RGBA fixture containing two flat fields separated by a vertical step, bounded noise of ±16 channel values, and a small thin-line region. Compare identical five-level per-channel quantization with (a) no smoothing, (b) ordinary box smoothing, and (c) the proposed edge-aware smoothing. Disable ink in this comparison so outlines cannot hide smoothing errors. Inspect the line fixture separately. No external image or human preference scores enter this experiment.

Before observing results, success requires:

- At least 50% lower flat-region luminance standard deviation than no-smoothing posterization.
- At least 90% retention of the clean input's vertical step contrast, measured immediately on either side of the step (columns 254 and 257, rows 32–223).
- Better immediate-boundary contrast than ordinary box smoothing.
- Exact preservation of dimensions and every alpha value; deterministic output bytes; finite metrics; rejection of malformed buffers and out-of-range dimensions.
- Median processing time below 2,000 ms for a 512 × 512 fixture over five measured runs after one warm-up, on the machine running the command. This is a local threshold, not a mobile performance guarantee.

The first implementation may fail. Record failures and any changes; do not quietly move thresholds. The chosen fixture can favor this method, so include a second noise seed and report both, plus the thin-line failure mode. Repeated runtime samples show variance on one machine; they are not independent user/device observations or confidence intervals for quality.

## Reproduction and falsification

Run `npm run evaluate`. The script writes its complete raw samples, versions, measured values, and threshold checks to `docs/evaluation-results.json` and exits nonzero if any acceptance threshold fails. `npm test` verifies invariants independently.

The mechanism is falsified for this scope if flat noise does not improve by 50%, or edge retention falls below 90%. A passing synthetic experiment does not establish that users prefer the output, that portraits remain recognizable, or that printing costs fall. Next evidence should be a consented, diverse photo set and a blinded task study with teachers or workshop facilitators.
