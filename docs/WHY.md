# Why Toonforge exists

Toonforge tests a specific product hypothesis: a teacher, workshop facilitator, or small creative team may want a photo simplified into illustrated artwork for a handout without learning a full editor or uploading that photo. The product offers one local workflow: open, choose a style, adjust texture and outlines, inspect the original against the result, then export a PNG or print a sheet. It does not establish that these users want another tool; that requires user research.

The concrete starting failure is reproducible. At commit `1266990`, all five API tests passed, but a real PNG produced no successful image in either local or cloud mode: local lacked runtime dependencies and then a model artifact; cloud lacked its service configuration. [BASELINE.md](BASELINE.md) records the commands, responses, and the mocked happy-path test that concealed the gap. The rebuild keeps photo simplification and offline operation, then reduces the number of things that must be available for a visitor to finish.

## Why now

The immediate change is in this project's constraints and evidence, not the invention of a new filter. The old stack already demonstrated that model availability, runtime installation, and a cloud adapter could prevent its core job despite passing route tests. Mature browser [Canvas pixel access](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas), [background workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), and existing free static hosting make a smaller implementation practical today.

There is no claim that these browser capabilities arrived recently, that a regulatory deadline creates demand, or that a market suddenly opened. The cost change is architectural: executing deterministic pixel operations on the visitor's device removes this application's remote inference bill and quota from the processing path. It trades learned illustration quality for predictable source geometry, local controls, and a small deployable artifact.

## Alternatives on the same criteria

These are published-product comparisons, not timed usability trials. Links and asset terms are collected in [SOURCES.md](SOURCES.md).

| Choice | Photo locality | Account for the described workflow | Task and control | Scope and tradeoff |
| --- | --- | --- | --- | --- |
| Toonforge | Browser memory; local worker | None | Three styles, texture, outlines, comparison, PNG and print | A narrow deterministic photo-to-print utility; no semantic redrawing or layers |
| Plain posterization | Can run locally | None | Channel quantization | Simpler and faster; the ablation leaves texture noise on this repository's controlled target |
| [Photopea](https://www.photopea.com/) | Its product page states files stay on the device | No required account described for its browser editor | Extensive filters, layers, masks, and adjustments | A strong alternative for skilled users; privacy is already available here, so task focus must earn Toonforge's existence |
| [Adobe Firefly photo to cartoon](https://www.adobe.com/products/firefly/features/ai-cartoon-generator/photo-to-cartoon.html) | Published workflow uploads the photo | Sign-in specified | Prompted generative restyling | Better suited to inventing an artistic treatment; this is a different mechanism from preserving and filtering existing pixels |
| [Squoosh](https://squoosh.app/) | Its site states processing stays local | No required account described for its local tool | Compression settings and direct comparison | A model for clear inspection and export; it solves compression rather than comic stylization |

Toonforge has no demonstrated usability advantage over Photopea or a well-designed posterize tool. Its working differentiator is a tightly constrained workflow with an immediately inspectable result and no remote model dependency. If target users already finish the task more reliably in an existing editor, the correct response is to stop expanding this standalone product or turn it into a focused preset/export recipe for that editor.

## Why this implementation

The pipeline in [processing.ts](../src/lib/processing.ts) uses four alternating horizontal/vertical range-weighted smoothing passes, per-channel quantization, and Sobel-derived outlines. It is a separable approximation, not a full two-dimensional bilateral filter and not a trained model. [OpenCV's smoothing explanation](https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html) motivates the boundary/noise tradeoff; its [Sobel explanation](https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html) describes the gradient operation.

The next best architecture is a local or hosted learned style-transfer model when generative appearance is necessary. That would require a verified artifact, redistribution terms, runtime compatibility, and either sufficient device resources or an available server. Those dependencies are exactly what blocked the starting repository. Toonforge chooses a smaller claim that can be exercised end to end with ordinary browser APIs.

TypeScript expresses the pixel, options, and worker-message boundaries; Vite supplies development and static production builds. A dedicated worker keeps the pixel loop away from UI events, and obsolete jobs are terminated before replacement work. There is no database, account system, or image API because this job needs no durable server-side records. [Architecture](architecture.md), [main.ts](../src/main.ts), and [worker.ts](../src/worker.ts) describe and implement those boundaries.

## What the measurements say

The [evaluation plan](EVALUATION_PLAN.md) was written locally before engine implementation. It requires at least 50% lower flat-region noise than posterization, at least 90% clean step-contrast retention, better immediate boundary contrast than box smoothing, invariant preservation, and median runtime below 2,000 ms for a 512×512 target. It is not an externally preregistered study.

Both fixed seeds pass the signal thresholds. Posterized flat-region luminance standard deviation is 30.11 and 30.19; both smoothing methods reduce it to zero. Edge-aware step contrast is 127 against a clean input contrast of 120, compared with 63 for box smoothing and 116/117 for posterization. The 105.83% retention value is quantization overshoot, not added information. The checked-in run's median is 98.44 ms over five measured runs after one warm-up on an i5-13450HX; timing varies across runs and devices. [EVALUATION.md](EVALUATION.md) and [raw results](evaluation-results.json) carry the full methods and samples.

The negative result matters: a low-contrast one-pixel line falls from input contrast 29.73/28.38 to 23.33 under the edge-aware method. Some details near a quantization boundary can disappear. The fixtures deliberately expose the intended mechanism and cannot establish photo aesthetics, face identity, print readability, demand, time saved, or printer consumables saved. There is no real-photo benchmark or user study, and five timings from one machine do not provide confidence intervals for those claims.

## Limits, falsification, and next evidence

The UI accepts supported raster files up to 20 MiB, rejects header dimensions over 40 million pixels or 20,000 pixels on either side, and downsamples work to at most 1.5 million pixels. The pure engine independently rejects over four million pixels; its higher library cap is not the UI's export promise. These checks reduce browser resource risk rather than making image decoding invulnerable. [import.ts](../src/lib/import.ts) and [import tests](../tests/import.test.ts) are the executable source for those rules.

Darkness coverage is a screen calculation, not a toner or ink estimator validated against printers. An outlined photo may use more dark area than its source. Thin text, hair, foliage, distant faces, and low-light photos require inspection; this filter does not anonymize people or certify safe publication. The sample is a licensed real photograph, clearly labeled and separately credited in [SOURCES.md](SOURCES.md).

For the declared engineering scope, failure means noise improves by less than 50%, clean step retention drops below 90%, or correctness/runtime acceptance fails. For the product hypothesis, the next falsifiable study should ask consenting teachers or facilitators to prepare their own usable illustrated sheet in Toonforge and a simple posterization/editor baseline, with randomized order and blinded output ratings. Before collecting data, set a task-completion and preference threshold, include diverse lighting and subject detail, and publish all failures. If usefulness does not improve, build a simpler export/preset tool rather than adding a model to rescue the narrative.

The intended public address is [brej-29.github.io/toonforge-mobile-ai](https://brej-29.github.io/toonforge-mobile-ai/). This document does not certify publication; release status and live verification belong in the README and CI output. [GitHub Pages' terms and limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) allow eligible public repositories on the free plan, with a 1 GB published-size limit and soft 100 GB monthly bandwidth limit, while excluding commercial SaaS hosting. The chosen product is a free open-source utility with no transactions; a commercial direction would require another hosting review.

## Fifteen hard questions

### 1. Who has actually asked for this?

No documented customer or research participant has asked for the rebuilt workflow. Teachers, workshop facilitators, and small creative teams are explicitly a working hypothesis in [PRODUCT.md](../PRODUCT.md). The evidence supports a runnable engineering problem and a proposed job, not product-market fit.

### 2. Why build anything when Photopea already works locally?

[Photopea](https://www.photopea.com/) is a credible free local alternative with much broader editing tools, so local privacy alone is no moat. Toonforge tests whether a few task-specific controls and a direct print/export path help an occasional user finish more reliably. That advantage remains unmeasured, and the comparison study above could disprove it.

### 3. Did you solve the original problem by quietly removing its hard part?

The scope changed openly from learned cartoonization across several services to deterministic photo simplification in one browser. [BASELINE.md](BASELINE.md) records why the original core request could not finish, and [processing.ts](../src/lib/processing.ts) exposes the replacement mechanism. The new product makes no promise to reproduce a neural illustration style; if that style is essential, this approach is insufficient.

### 4. What proves the added filter is better than posterization?

On two fixed synthetic targets, it removes flat-region noise while preserving the deliberately strong boundary, using identical quantization and no outlines to hide damage. [The ablations](EVALUATION.md) also show why ordinary smoothing is insufficient: its immediate boundary contrast is 63 versus 127 for range-weighted smoothing. This proves a narrow signal-processing behavior, not that humans prefer the art.

### 5. Are these benchmarks designed to make your algorithm win?

Yes, the fixtures isolate the mechanism this algorithm is intended to address, and the evaluation states that limitation. A second seed checks sensitivity to one noise realization but does not provide domain diversity. The thin-line result is reported as a failure mode; a consented real-photo set and blinded judgments are still required.

### 6. How can edge retention exceed 100%?

The metric divides output step contrast by the clean input's contrast of 120; quantization produces a contrast of 127. The resulting 105.83% indicates overshoot and is explicitly not evidence of recovered detail. [Raw output values](evaluation-results.json) make the calculation inspectable.

### 7. What important content can the filter destroy?

The measured low-contrast one-pixel line weakens, and quantization can erase similarly small details. Text, hair, subtle facial shading, and foliage are plausible failure cases that users must inspect in the original/result comparison. [EVALUATION.md](EVALUATION.md) reports the actual line values and distinguishes observed failure from untested photo generalization.

### 8. Are you claiming this reduces printing costs?

No printer consumables were measured, and the evaluation explicitly excludes that claim. `estimatedInkCoverage` is average visible-pixel darkness on white, implemented in [processing.ts](../src/lib/processing.ts); it cannot account for printer profiles, paper, halftoning, or toner behavior. Strong outlines can increase the darkness proxy, so neither a lower bill nor a percentage saving is promised.

### 9. How can a stranger verify that a photo stays local?

The photo path is file selection, local header inspection/decoding, worker pixel transforms, and Canvas export in [main.ts](../src/main.ts); there is no image-upload endpoint. [Browser tests](../tests/e2e/studio.spec.ts) exercise private-file import and reject unexpected non-GET requests in the tested flow, while source inspection establishes the actual request paths. The host still receives ordinary page and asset requests, and this does not claim anonymity from the hosting provider.

### 10. Does clearing the photo erase every trace?

The editor clears its source/result references, resets canvases, terminates current worker work, and revokes its print URL in [main.ts](../src/main.ts). That is an application-state action, not guaranteed secure erasure from browser memory, operating-system caches, screenshots, or previously downloaded files. Service-worker storage is for bundled public assets, not selected photos, as shown in [the cache builder](../scripts/build-offline.mjs).

### 11. Will a large image freeze or crash a cheap phone?

[Import guards](../src/lib/import.ts) bound file size and inspect known raster dimensions before decoding, then cap the working image at 1.5 million pixels. The worker, a 30-second processing timeout, and recoverable errors reduce disruption, but decoding a supported source can still consume substantial memory on a constrained device. The recorded 512×512 desktop timing is not a cheap-phone benchmark.

### 12. Why do the UI and engine have different pixel limits?

The engine's four-million-pixel cap is a defensive library boundary, tested independently in [processing tests](../tests/processing.test.ts). The UI chooses a lower 1.5-million-pixel working cap to leave room for source/result canvases, copied buffers, and decoding overhead. Exports use that working resolution; the product does not silently promise the original photo's full resolution.

### 13. Why should anyone trust the new tests after the old green tests missed failure?

The new unit tests call real pixel transforms and check deterministic bytes, dimensions, alpha, parameter rejection, and the fixed signal thresholds. The [browser flow](../tests/e2e/studio.spec.ts) changes a style, exports actual PNG bytes, exercises print preparation, clears the editor, and imports a local image; it also checks error recovery and cached offline reload. Those checks cover the supported implementation more directly, while browser coverage and human print quality remain bounded.

### 14. What happens when the free host stops serving it?

GitHub Pages can rate-limit or change terms, so free deployment is a current operating choice rather than an availability guarantee. Once public assets are cached, the service worker can support the tested offline reload path; a first visit or failed cache installation still needs hosting. Static build output and a reproducible setup make migration possible without moving user photos or replacing an inference backend.

### 15. What would make you abandon the approach, and what would you build next?

Failure of the fixed thresholds in [the plan](EVALUATION_PLAN.md) would invalidate the declared engineering acceptance until fixed or the scope is revised openly. More importantly, if target users cannot make acceptable handouts more reliably than with plain posterization or Photopea, the standalone product hypothesis fails. The next useful artifact would be a tested preset/export workflow for an existing editor, or a carefully licensed local learned model only if research shows that learned style is the missing capability.
