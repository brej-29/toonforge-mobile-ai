# Toonforge

**A private photo-to-print studio.** Open a photo, simplify it into comic artwork, compare the result, and download a PNG or print a sheet. Deterministic image filters run on your device.

[Open the studio](https://brej-29.github.io/toonforge-mobile-ai/) · [Why this exists and 15 hard questions](docs/WHY.md) · [Evaluation](docs/EVALUATION.md)

## Problem and evidence

The working audience is teachers, workshop facilitators, and makers preparing illustrated handouts or small prints from their own photos. The hypothesis is that a focused local workflow helps when a full editor is too much and uploading the photo is undesirable. **Demand and a usability advantage are unvalidated.** Photopea already offers local editing; privacy alone is not a differentiator.

The original Flutter/Streamlit/FastAPI/Gradio stack supplied concrete failure evidence: **5 API tests passed**, yet real requests produced **0 PNG outputs in 2 mode attempts**. Local inference lacked a model; the cloud adapter lacked configuration. Its happy-path test returned mocked bytes instead of a decodable image. [The baseline audit](docs/BASELINE.md) records installation commands and observed responses.

## Approach

The production path is one static TypeScript/Vite application with Canvas and a processing worker. Range-weighted smoothing reduces texture, tone quantization simplifies shading, and Sobel gradients add outlines. There is no image API, model download, secret, or account.

The studio includes three styles, texture/outline controls, a keyboard-operable comparison wipe, original/result views, transparent PNG export, printing, and live runtime/darkness measurements. It handles empty/error/slow states and works offline after caching public assets. A licensed sample is labeled and processed live. [Architecture](docs/architecture.md) · [Sources](docs/SOURCES.md)

The previous stack is preserved in [legacy/](legacy/) and git history; it is excluded from deployment. Backup tags preserve both the original checked-out commit and the fetched default branch.

## Targets and results

The [plan](docs/EVALUATION_PLAN.md) was written locally before engine implementation. Acceptance: at least 50% lower flat-region noise than plain posterization; at least 90% clean boundary contrast retention; better boundary retention than box smoothing; preserved pixel invariants; median 512×512 runtime below 2 seconds.

| Controlled measurement | Posterize | Box smoothing | Edge-aware |
| --- | ---: | ---: | ---: |
| Flat-region std, seed 29 | 30.11 | 0.00 | 0.00 |
| Flat-region std, seed 71 | 30.19 | 0.00 | 0.00 |
| Boundary contrast, seeds 29 / 71 | 116 / 117 | 63 / 63 | 127 / 127 |
| Thin-line contrast, seeds 29 / 71 | 44.33 / 42.67 | 0.67 / 2.00 | 23.33 / 23.33 |

All declared engineering thresholds pass. The clean boundary contrast is 120: 127 is **quantization overshoot**, not extra information. The low-contrast line weakens from 29.73/28.38 in the noisy input to 23.33. Inspect small text, hair, faces, and foliage before exporting.

The checked-in local run's median is **98.44 ms**, five measured runs after warm-up on an i5-13450HX. This is not a phone benchmark. [Results and raw timings](docs/EVALUATION.md) include negative findings; `npm run evaluate` regenerates them, with naturally different runtimes. Synthetic fixtures prove neither artistic quality, toner savings, nor user preference.

## Run and verify

Node.js 24 and npm; no service credentials or environment variables.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run evaluate
npm run build
npx playwright install chromium
npm run test:e2e
```

Use `npm.cmd` / `npx.cmd` on PowerShell if script execution is disabled. Browser tests start a strict-port preview on 127.0.0.1:4399. For a deployed check, set `LIVE_URL` to the HTTPS address and run `npm run smoke`.

Ten core tests cover pixel invariants, image header validation, output bounds, safe filenames, and declared signal thresholds. Seven browser tests exercise real PNG download/re-import, controls, printing, invalid input, empty/slow states, offline reload, and automated AA checks at 390, 768, and 1440 pixels. CI attaches screenshots and evaluation JSON for seven days. [Quality evidence](docs/QUALITY.md)

## Deployment and limits

Public address: **https://brej-29.github.io/toonforge-mobile-ai/**. Publication is configured from `main` through `.github/workflows/studio.yml`, after type checks, tests, evaluation, build, and browser checks pass. A separate job smoke-tests the public deployment. Release verification will be updated after first publication.

[GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): eligible public repositories on the free plan; 1 GB maximum site; soft 100 GB bandwidth/month; ten-minute deployment timeout; host rate limiting can return 429. This is a free open-source utility without commercial transactions or a commercial SaaS service. No new account, card, or paid tier is required. No inference cold start or model quota exists; outages still prevent an uncached first visit.

Offline reload requires completed public-asset caching. Storage eviction, private browsing, or a first visit without internet can prevent it. Updates may activate on a subsequent visit/reload. Hosting sees ordinary page requests; selected photos are not transmitted by the editor.

JPG/PNG/WebP inputs: up to 20 MiB, 40 million source pixels, and 20,000 pixels per side. Output downsamples to at most 1.5 million pixels and 8,192 per side, without upscaling. This suits small prints/web artwork rather than high-resolution posters. Browser memory and decoding can still fail. There is no saved gallery; reloading discards a selected photo. Image darkness is a screen statistic, not measured printer ink usage. Processing does not anonymize a subject.

## Documentation and licensing

- [WHY: alternatives, tradeoffs, falsification, and 15 questions](docs/WHY.md)
- [Original failure evidence](docs/BASELINE.md), [evaluation plan](docs/EVALUATION_PLAN.md), [results](docs/EVALUATION.md)
- [Product assumptions](PRODUCT.md), [design system](DESIGN.md), [quality evidence](docs/QUALITY.md)

Code: MIT. The sample is by Green Liu under the [Unsplash License](https://unsplash.com/license), separately credited in [SOURCES.md](docs/SOURCES.md). Bundled Manrope fonts use the SIL Open Font License, included in public/FONT-LICENSE.txt.
