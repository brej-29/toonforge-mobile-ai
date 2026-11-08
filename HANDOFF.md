# Toonforge — project and portfolio handoff

Updated: 2026-11-08. This file is the durable brief for maintaining, explaining, demonstrating and presenting the project. Draft social copy below is not published automatically.

## Start here

- Public app: https://brej-29.github.io/toonforge-mobile-ai/
- Public guide: https://brej-29.github.io/toonforge-mobile-ai/guide.html
- Repository: https://github.com/brej-29/toonforge-mobile-ai
- Current release evidence: [docs/RELEASE_2_1.md](docs/RELEASE_2_1.md)
- Quick visual overview: [README](README.md), [demo GIF](docs/assets/comparison.gif), [studio screenshot](docs/assets/studio.png), [workbench screenshot](docs/assets/workbench.png).

**One sentence:** Toonforge turns photos into printable comic artwork on the user's own device, combines measurable image processing with reusable recipes, and optionally translates text instructions into validated filter settings.

**Portfolio positioning:** A deployed computer-vision application with a constrained language-model control layer and a local MCP integration. It demonstrates pixel processing, numerical evaluation, responsive product engineering, privacy boundaries and deployment reliability. It is not a trained neural image model or a generative image editor.

## Verified release outcome

The 2.1 application is deployed and usable at the public URL above. [PR #4](https://github.com/brej-29/toonforge-mobile-ai/pull/4) merged application commit `f25933b394ea0fafcde79328b071c15fa7fe1e01`. [Production run 42509036358](https://github.com/brej-29/toonforge-mobile-ai/actions/runs/42509036358) passed verification, deployment and public smoke at 2026-11-08 18:17 UTC. Sixteen core/integration and eleven browser tests pass; the public test decoded a real 1100×733 PNG, applied a local text plan, checked analysis and fetched search assets. Twenty repository topics, the description and website URL were updated and read back. No API key was required for this working public release.

The complete handoff includes CV bullets, two LinkedIn drafts, a demo script, methods, negative findings and a prioritized roadmap. [The UI extension record](docs/UI_2_1.md) accompanies the preserved original design system. Owner follow-ups are actual-provider/key/CORS verification and Search Console property/sitemap submission; rankings, adoption and learned-model performance are not claimed.

## What we are trying to do

Build a useful repeatable photo-to-print workflow instead of a one-visit filter demo. Teachers can prepare illustrated handouts; creators can make zine/comic artwork; individuals can print memories. These are intended audiences, not validated customers. No adoption, retention or customer interview evidence is claimed.

The recurring loop is: open a photo → inspect it → find a style → compare and refine → export or print → save the settings → reuse them with the next photo. Settings-only links help move a look across browsers and share it without exposing photos. MCP supports repeatable local PNG work in agent workflows.

User direction for this release: improve the UI with creative control and motion, create a real deployed utility, strengthen the CV/image-processing/AI substance, support user-supplied text-model credentials, add repository topics and search metadata, and prepare complete portfolio/LinkedIn material. The user explicitly asked to cover both creator and teaching workflows as well as general photo use.

## Project evolution and the actual problem

The original repository contained Flutter, FastAPI, Streamlit, Gradio and model-conversion code. It expressed an offline/cloud cartoonization idea, but the audited runtime path did not produce a valid PNG: the local path had no model weights and the cloud path lacked configuration. Five API tests passed because the successful output path mocked bytes. See [BASELINE.md](docs/BASELINE.md).

The earlier production revision narrowed the problem to deterministic browser processing, real export and free static deployment. This release extends that working foundation with image diagnostics, text direction, recipes, MCP and documentation. It does not claim the older code was built during this release. Legacy code stays in `legacy/` and history for context.

## Features that exist

| Area | Shipped behavior | Boundary |
| --- | --- | --- |
| Import | Header inspection, browser decode, aspect-preserving downsample | JPG/PNG/WebP; 20 MiB; 40 MP source; 20,000-pixel source side |
| Image engine | Four-pass separable range-weighted smoothing, quantization, Sobel outlines | Classical filters; no learned weights or semantic understanding |
| Controls | Three styles, texture, outlines, 3–12 tonal levels per channel | Tonal levels are not total palette size |
| Inspection | Original/result wipe and explicit view buttons | Small text and hair can disappear; inspect before export |
| Measurements | Alpha-weighted 32-bin luminance histogram, mean/std, local transitions | Aggregate statistics, not object or face recognition |
| Suggestions | Texture/contrast rules choose starting settings | Heuristics, not learned recommendations |
| Text direction | Supported rule-based commands and optional remote text model | Remote result proposes filter settings; user chooses Apply |
| Recipes | Twelve local named settings, apply/remove, settings-only links | No saved photo gallery; browser storage can be cleared |
| Output | Valid transparent PNG and browser print sheet | Browser output capped at 1.5 MP; no upscaling |
| MCP | list_styles, analyze_png, plan_edit, render_png | Local stdio; PNG only, 4 MP; no public remote endpoint |
| Accessibility | Semantic controls, keyboard focus, announcements, reduced motion | Automated checks do not replace screen-reader/user testing |
| Motion | Comparison reveal, drifting print arcs, in-view pipeline signal, progressive scroll heading | Visible static fallback and pause/reduced-motion controls |
| Deployment | Static GitHub Pages, CI checks, public export/decode smoke | No SLA; uncached first visit requires the host |
| Search | Static guide, canonical URLs, structured data, social card, sitemap, llms index | No ranking or AI-inclusion guarantee |

## Architecture and source map

The frontend is framework-free TypeScript with Vite, Canvas and native HTML controls. Fonts are self-hosted. The MCP SDK and PNG codec are used by the local Node process and are not bundled into the browser application.

| Path | Responsibility |
| --- | --- |
| `index.html` | Semantic studio, workbench, disclosures, search/social metadata |
| `guide.html` | Crawlable how-to, methods, setup, privacy and limitations |
| `src/main.ts` | Import/export, worker lifecycle, generation guards, controls and motion |
| `src/worker.ts` | Background image filtering and source analysis |
| `src/lib/processing.ts` | Pure RGBA image engine and controlled baselines |
| `src/lib/analysis.ts` | Histogram, luminance statistics, adjacent-pixel transitions, heuristic settings |
| `src/lib/import.ts` | Raster header guards, size bounds, safe export naming |
| `src/lib/presets.ts` | Three supported style definitions |
| `src/lib/recipes.ts` | Strict shared option/recipe validation, links, local words-to-settings mapping |
| `src/lib/text-model.ts` | Endpoint validation, bounded request/response, JSON plan parsing |
| `src/workbench.ts` | Plans, model form, histogram rendering, local shelf, sharing |
| `src/style.css` | Responsive design, UI states, motion and print rules |
| `scripts/mcp-server.ts` | SDK stdio server, folder limits, PNG decode/render and exclusive output creation |
| `scripts/build-offline.mjs` | Content-versioned public-asset cache |
| `tests/` | Engine/import/trust-boundary tests and real MCP client/server integration |
| `tests/e2e/` | Browser workflows, provider mocks, offline/error/focus/print checks and AA scans |
| `.github/workflows/studio.yml` | Verify → deploy Pages → public PNG smoke |
| `scripts/capture-docs.mjs`, `scripts/make-demo.py` | Reproducible real-output screenshots, comparison GIF and social card |

## Technical decisions worth explaining

**A smaller architecture earns reliability.** The deployment path needs no GPU, secret, hosted inference service or downloaded model. Removing those runtime dependencies made valid output possible when both original inference paths failed.

**Approximate edge-aware filtering deliberately.** Four horizontal/vertical passes use a radius-three kernel. A precomputed range-weight table depends on maximum RGB difference; spatial weights depend on offset. This is a separable approximation, not an exact two-dimensional bilateral filter. Transparent neighbors contribute in proportion to opacity, preventing invisible colors bleeding into visible pixels.

**Keep gradients and quantization separate.** Smoothing reduces texture, per-channel quantization simplifies shading, and Sobel gradients drive a smooth outline ramp. Disabling outlines in the evaluation avoids disguising boundary loss as a dark drawn edge.

**Protect responsiveness and asynchronous correctness.** Processing and analysis run in a Worker. Generations reject stale results; new settings terminate previous work. Decode tokens, timeout recovery and export snapshots prevent one image/style's metadata being attached to another output. Printing waits for a decoded blob image and is cancelled if the active generation changes.

**Use a language model as a planner.** The app sends a short instruction, settings and three aggregate measurements to the visitor's chosen compatible provider. It never sends photo pixels or filenames. Replies are restricted to known style IDs and bounded numbers; no returned code is executed. Plans are reviewed before Apply. Local command rules keep the main workflow free and usable without a provider.

**Persist the smallest useful artifact.** A recipe contains a version, name and four settings. It can be validated, stored, shared or passed to tools without retaining a photo or credential. The same validation protects stored data, URLs, model plans and MCP inputs.

**Keep MCP local and bounded.** The process gets a user-selected working root, resolves canonical input/parent paths, checks PNG dimensions before full decode, and creates outputs exclusively. It returns paths and measurements rather than sending image data to the agent conversation. It assumes a trusted client and a cooperating filesystem; it is not a security sandbox for hostile local code.

## Challenges faced and how they were handled

| Problem | Evidence / resolution | Remaining tradeoff |
| --- | --- | --- |
| Passing tests did not mean working inference | Baseline tested mocked bytes; replacement tests download and decode real PNGs | Synthetic fixtures still do not measure real-photo preference |
| Missing weights / cloud config | Local deterministic image pipeline | Less expressive than trained stylization or generation |
| Texture suppression can destroy detail | Box baseline, thin-line fixture, negative result documented | Inspect text, faces, hair and foliage |
| Mobile memory and long work | Header bounds, 1.5 MP working image, Worker, timeout, stale-job cancellation | Large decoding can still fail before downsampling |
| Text-only model cannot directly edit pixels | Constrained settings planner and explicit capability copy | No object removal, inpainting or scene understanding |
| Limited model budget | 600-character instruction, 220 output tokens, one request, timeout/cancel, no retries | System prompt/settings also consume input tokens; provider billing varies |
| Browser CORS | Direct provider call with documented requirements and local fallback | A static host cannot bypass provider CORS |
| Untrusted model or shared settings | Strict parsing and allowlisted bounded options; plain-text explanations | A valid plan may still be aesthetically poor |
| Secret handling in a public app | User supplies a key; form-memory only; clear-details control; no storage or URL keys | The chosen provider necessarily receives its key and request |
| Dirty original checkout | Continued in the clean existing flagship worktree and preserved original deletions/build artifacts | Opening the original checkout may show older code |
| Windows sandbox restrictions | Existing auth/process tools needed normal host permissions; browser tests also run in Linux CI | One local run passed individual cases but hung in process cleanup; use the completed run/CI as release evidence |
| Search discoverability | Useful static text, canonical URLs, social metadata, schema and sitemap | Indexing, rankings and recommendations belong to search engines |

## Evaluation and defensible numbers

Two seeded 512×512 synthetic targets compare posterization, uniform box smoothing and range-weighted smoothing with the same quantization and outline-disabled settings. The declared checks include at least 50% flat-region noise reduction, at least 90% strong boundary contrast retention, better boundary retention than the box baseline and engine median below two seconds on the measured machine.

Observed signal values: flat-region std falls from 30.11/30.19 with posterization to 0/0; boundary contrast is 127 versus box smoothing's 63. The clean target is 120, so the overshoot is quantization, not extra information. The low-contrast thin line weakens to 23.33 from noisy-input 29.73/28.38. The latest run's exact timings and environment are in [evaluation-results.json](docs/evaluation-results.json); timing is local and engine-only.

Tests cover real pixel invariants, unchanged alpha/input bytes, import/output limits, safe filenames, local rules, invalid settings, text-provider payloads/errors, real MCP handshake/render/path restrictions, actual browser PNG decode, offline reload, print races, shelf/link restore and automated AA checks at 390/768/1440 pixels. Current completed counts and release links belong in [RELEASE_2_1.md](docs/RELEASE_2_1.md).

Do not claim human preference, learned-model accuracy, state-of-the-art performance, identity preservation, printer savings, measured user time savings, active users or retention. No real paid text-provider key, manual screen-reader evaluation, real-photo user study or phone benchmark was used in this release. Earlier Lighthouse scores in QUALITY.md belong to that earlier version until remeasured.

## Setup, operation and deployment

Node.js 24 → `npm ci` → `npm run dev`. For release validation: `npm test`, `npm run evaluate`, `npm run build`, install Chromium, then `npm run test:e2e`. On PowerShell use `.cmd` launchers if script policy requires it. The browser editor needs no environment variables or key.

Optional provider setup lives in the app. Enter the router's exact HTTPS API base and text model ID; do not commit a key. A base ending in `/v1` becomes `/v1/chat/completions`. Provider CORS must allow this page's origin. Configure localhost HTTP only for a local router. See [the guide](guide.html#text).

MCP: `npm run mcp -- --root /absolute/path/to/images`. Configure your client to launch that process from the cloned checkout; see [MCP.md](docs/MCP.md). There is no browser-accessible remote MCP endpoint to advertise.

Publishing `main` triggers `.github/workflows/studio.yml`. The verify job builds, runs tests/evaluation/browser checks, and uploads evidence and Pages output. Deploy publishes the artifact; smoke checks the public HTTPS app and re-imports a downloaded PNG. Revert a faulty change on main and let the same workflow redeploy. Service-worker clients may receive the new cache on a subsequent visit/reload.

Search Console ownership verification and sitemap submission remain owner follow-up. Root-level robots rules are not controlled by this project-path Pages deployment. The app's machine-readable index is optional documentation, not a guarantee of AI crawler adoption. See [SEO.md](docs/SEO.md).

## A 90-second portfolio demo

1. Open the public app in a fresh tab. Show the labeled sample and original/result divider.
2. Select Graphic novel, then Mono ink. Move outlines and tone levels and download a PNG.
3. Explain the histogram and contrast measurement; try suggested settings.
4. Use “soft monochrome”, inspect the proposed settings, Apply, and name/save a recipe.
5. Reload, apply the saved recipe, and explain that only settings survived; the photo is not stored.
6. Show a settings link and the optional provider form. Explain the difference between text planning and image generation.
7. Show the MCP integration test or tool calls, then the evaluation table and its thin-detail limitation.

Use your own photo only with appropriate rights and consent. The bundled sample is convenient for public demos because its separate license and credit are documented.

## CV / portfolio wording

**Project title:** Toonforge — Private Computer Vision Photo-to-Print Studio

**Short description:** Built and deployed a browser image-processing studio with edge-aware smoothing, tone quantization, Sobel outlines, live comparison, reusable recipes and an optional text-model planner; exposed the shared engine through local MCP tools.

Select two or three bullets that fit the role:

- Engineered a TypeScript/Canvas image pipeline in a Web Worker, preserving alpha and preventing stale-job/export races while supporting local PNG export and print workflows.
- Evaluated texture suppression and boundary retention against posterization and box smoothing on seeded synthetic targets; documented quantization overshoot and loss of low-contrast fine detail.
- Implemented a bounded language-model-to-settings interface with strict JSON validation, explicit review-before-apply, user-owned credentials and aggregate-only provider requests.
- Built an SDK-based local MCP server sharing the production engine, with PNG analysis/render tools, canonical path checks, size limits and non-overwriting output creation.
- Shipped responsive, keyboard-accessible UI, offline asset caching and CI-gated static deployment with real downloaded-PNG decode verification.

Only add counts, runtime numbers or accessibility results from the completed current release evidence. Do not say “trained a cartoonization model” or “improved model accuracy”; no such experiment took place.

## LinkedIn draft: product story

I wanted Toonforge to be something people could use again, not just a photo-filter demo.

It now turns photos into comic-style prints locally, with controls for texture, outlines and tone levels. The useful part is the recipe loop: find a look, save its settings, and use it on the next classroom handout, zine or personal print.

I also added a small image-analysis panel and optional text direction. A text model proposes filter settings; the browser validates and applies them. The photo stays on the device. There is a local MCP interface for the same processing engine too.

The engineering lesson was to test the artifact. The original API tests passed while real inference could not produce a valid PNG. The current checks download, decode and re-import real output.

There are limits: these are classical filters, not a trained generative model, and fine details can disappear. I documented those alongside the evaluation instead of hiding them.

Try it: https://brej-29.github.io/toonforge-mobile-ai/
Source: https://github.com/brej-29/toonforge-mobile-ai

#ComputerVision #ImageProcessing #TypeScript #MCP #BuildInPublic

## LinkedIn draft: technical angle

Can a text-only model help edit an image without seeing it?

In Toonforge, I treated language as a control interface. A short instruction becomes a validated recipe: style, texture, outline strength and tone levels. The user reviews the plan; a local Web Worker performs the pixel transformation.

That split keeps the image pipeline deterministic and avoids sending photo pixels to the text provider. It also makes the limitations clear: the model cannot remove an object or invent a new background through these controls.

The same processing code runs behind a browser editor and a local MCP server. I added actual PNG export/decode checks, seeded signal comparisons, strict recipe validation and provider-boundary tests. My next useful evaluation is with real photos and people making real prints, rather than a larger feature list.

Demo: https://brej-29.github.io/toonforge-mobile-ai/

#ComputerVision #AIEngineering #WebDevelopment #MCP #SoftwareEngineering

## Interview questions to prepare

- Why use separable range-weighted smoothing instead of a full bilateral filter? Discuss bounded work and the approximation.
- What is lost by using the maximum RGB difference? It is a cheap range metric, not perceptual color distance.
- Why disable outlines in the experiment? To expose smoothing damage instead of hiding it behind drawn dark boundaries.
- Why can boundary retention exceed 100%? Quantization changes levels; it is overshoot, not recovered information.
- What does the text model know? The instruction, current settings and three aggregate statistics; no visual/semantic evidence.
- What prevents unsafe model output? Allowlisted schema, bounded numeric values, no executable code and explicit Apply.
- What does MCP add? Agent access to the same real local processing, avoiding a second implementation.
- Is the project validated as a business? No. It proves a working utility and engineering behavior; demand remains a hypothesis.

## Next work, in useful order

1. Observe teachers and zine makers completing a real print task; compare completion, corrections and preference with a simple posterize baseline.
2. Build a consented, diverse real-photo test set covering skin tones, lighting, hair, foliage, low-contrast lines and transparency.
3. Verify one real user-owned text provider, its exact route, CORS behavior, small-budget model and JSON reliability. Do not publish credentials.
4. Consider batch recipe application and printable multi-image layouts only after observing repeat use.
5. If adding learned CV, start with a licensed compact segmentation/stylization model, publish provenance and evaluation, measure download/memory/latency on phones, and retain the local classical fallback. Do not relabel heuristics as ML.
6. Add a remote MCP service only if users need it and image retention, authentication, abuse limits and hosting costs are deliberately designed. The local server already serves the demonstrated workflow.
7. Monitor indexing through an owner-verified search property; improve useful examples based on actual queries instead of keyword volume alone.

## Checkout and maintenance warning

The authoritative implementation for this work is in `D:/Project/toonforge-mobile-ai/.worktrees/flagship`. The original root checkout was already on `cosine/init/monorepo-scaffold` with many tracked files deleted and generated mobile files untracked. Those changes were preserved. Do not reset/clean that checkout to make it resemble the deployed site. Use the release branch/main in the flagship worktree, or open a fresh clone of the public repository.

Previous production baseline: `359e1d80ad955a72b81b57aa4eba7a8c652059e6`. Current release commit/CI evidence is recorded separately to avoid self-referential commit hashes. Historical backup tags remain untouched.

## Licensing

Application code: MIT. Sample photograph: Green Liu, Unsplash License, separately attributed in [SOURCES.md](docs/SOURCES.md). README screenshots/GIF and the social preview derive from that sample and the actual application output. Manrope: SIL Open Font License. Dependencies have their own licenses in the package distribution. No customer photographs, keys or user analytics are bundled.