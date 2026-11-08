# Quality and release evidence

This document preserves the 2026-11-05 release history and its measurements. Current 2.1 tests and release status are recorded separately in [RELEASE_2_1.md](RELEASE_2_1.md). Earlier Lighthouse values below are not asserted for the expanded workbench until remeasured.

## Acceptance checks

Ten core tests cover deterministic processing, exact buffer and alpha invariants, presets, outlines, invalid parameters, image header guards, output bounds, filenames, and both synthetic targets. Seven browser tests cover real PNG export/re-import, printing, settings, empty/error/slow states, offline reload, and automated AA checks at phone (390×844), tablet (768×1024), and desktop (1440×1000).

Screenshots are written to .impeccable/review by `npm run test:e2e` and attached by CI. They are excluded from git. The main flow requires a real image to decode; mocked result bytes cannot satisfy it.

## Visual references and critique

[Squoosh](https://squoosh.app/), [Photopea](https://www.photopea.com/), and [Adobe Express](https://www.adobe.com/express/) are the reference products. These are design observations, not performance benchmarks. Squoosh sets the bar for direct comparison; Photopea demonstrates substantial local editing; Express demonstrates approachable hierarchy and clear export.

Toonforge puts the inspectable mechanism first, narrows the visible decisions, and keeps export beside the artwork. Its periwinkle/navy/yellow system, self-hosted Manrope, colour swatches, and image aperture give the workspace a consistent identity. First inspection found small control type and compressed tablet imagery; the second version increases critical type and stacks settings at tablet widths. Mobile export requires scrolling past the image and controls.

The initial empty print image was replaced with an image created after the export blob is ready. A copy-cadence warning was resolved by simplifying the privacy sentence. HTML-only type detection missed imported CSS and reported every heading as 16px; its narrow file-scoped exception records the rendered 48px heading and 14px paragraph hierarchy. No whole-file or whole-rule suppression was applied.

## Lighthouse

Local mobile Lighthouse 13.6.0, Chromium 156, simulated throttling, production build on loopback: an initial run concurrent with browser checks measured performance 77, accessibility 100, best practices 100, SEO 91. An isolated repeat measured 98 / 100 / 100 / 91. The final reviewed build measured **93 / 100 / 100 / 91**, with LCP 0.8 seconds and total blocking time 320 ms. Scores vary with scheduling and machine conditions; none is field telemetry, and the lower run is retained here.

Run `npx --yes lighthouse@13.6.0 <URL> --chrome-flags="--headless" --output=json --output-path=report.json` against production. The four requested category thresholds are at least 90. Automated checks do not replace assistive-technology testing; no manual screen-reader testing is claimed.

[Recorded lab measurements](lighthouse-results.json) preserve timestamps, tool version, throttling settings, scores, LCP, and blocking time for all runs. The public deployment measured **90 performance / 100 accessibility / 100 best practices / 100 SEO**, with LCP 1.0 seconds and total blocking time zero in this lab run. This meets the declared floor; field performance and other devices are unmeasured.

The independent finish review checked all eight captures and source, then scored its four requested fixes resolved: selected-style focus contrast, worker failure stopping, asynchronous export integrity, and the one-time comparison reveal. The verdict is scoped to those fixes; runtime test results were checked by the build and CI workflows. Two extra browser cases cover worker/manual-retry/focus behaviour and delayed export/clear races.

## Release verification

Published from application commit `eb6be2dad155873db5e0901ac5bd61ec9525bf87` on 2026-11-05. [The production run](https://github.com/brej-29/toonforge-mobile-ai/actions/runs/41978393522) passed verify, deploy, and smoke. An independent fresh browser also completed local processing, Mono ink selection, download of a valid 1100×733 PNG, and successful browser decode through re-import. No account or prior browser state was used.

Public screenshots at 390, 768, and 1440 pixels were captured and inspected; all three returned HTTP 200, had no automated AA violations, no horizontal overflow, and no runtime errors. The files are named live-mobile.png, live-tablet.png, and live-desktop.png in the excluded review directory. [Machine-readable release evidence](release-verification.json) records the run, dimensions, viewport checks, and live Lighthouse values.
