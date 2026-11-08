# Toonforge 2.1 release evidence

Date: 2026-11-08. Published and publicly verified. The prior production release remains described in QUALITY.md.

## Local validation

- `npm run build`: TypeScript checks, Vite multi-page build and versioned offline assets pass.
- `npm test`: **16 pass**, including a real SDK stdio MCP handshake, analysis, PNG render/decode, outside-root path rejection and overwrite refusal.
- `npm run evaluate`: both seeded signal targets and the runtime threshold pass. Median engine-only time: 104.28 ms; exact samples/environment in evaluation-results.json. Analysis/decode/startup/export are excluded.
- `npm run test:e2e`: **11 pass in 46.6 seconds** against the owned production preview. Real export/re-import, print and clearing races, offline reload, worker recovery, recipe save/reload/link restore, heuristic suggestions, local command errors and provider boundaries are exercised.
- Automated WCAG A/AA scans and no-horizontal-overflow checks pass at **390, 768 and 1440 pixels**, including the expanded connection and plan UI. The standalone guide also passes the automated scan.
- Optional provider integration uses a mocked compatible endpoint. Tests assert aggregate-only user payload fields, a 220-token cap, explicit Apply, no key persistence, and rejection of invalid settings. No paid key or actual provider quota was used.
- Dependency install audit: **0 vulnerabilities** across 122 audited packages at the recorded install. This is a point-in-time advisory check, not a security proof.
- Publication text check passes before committing. No model credentials or private photographs are included.

The first restricted Windows browser run reported every individual case passing but stalled during process cleanup and was interrupted. The final complete 46.6-second run used the existing preview and normal process permissions; its process exited successfully. This distinction prevents claiming the interrupted run as a completed suite.

## Visual and content checks

Screenshots are generated for desktop/tablet/phone and empty/error/loading/offline/focus/print states. All required captures were opened. Expanded workbench captures include the accessibility scanner's focused skip-link state; the ordinary resting captures and README image show the normal surface. Capture paths are under `.impeccable/review/`, excluded from git. Documentation assets under `docs/assets/` show real output; the social preview is derived from the same licensed sample.

Impeccable's detector ran once. Its advisory palette/type findings reflect both the extension and pre-existing design sidecar drift. The multiple-aphorism warning prompted simplification of the new pipeline copy. Independent review disposition is appended after review; no automatic detector result is treated as visual approval.

No current Lighthouse or field-performance score is claimed. Earlier 90/100/100/100 public lab scores in QUALITY.md describe an earlier release. No manual screen reader, user study or real-photo benchmark is claimed.


## Independent review

Initial review found one material issue: an old provider reply could replace a newer local proposal. The fix cancels and invalidates requests when newer intent takes ownership and checks controller identity in success, error and cleanup callbacks. The gated delayed-response regression passes. The reviewer scored this sole fix **resolved**, with disposition **ship** at that fix's scope; refreshed captures remain valid. The verdict is not a blanket certification of untested providers or manual accessibility.

## Public release result

Application commit: `f25933b394ea0fafcde79328b071c15fa7fe1e01`, merged through [PR #4](https://github.com/brej-29/toonforge-mobile-ai/pull/4).

[Production workflow 42509036358](https://github.com/brej-29/toonforge-mobile-ai/actions/runs/42509036358) completed successfully at 2026-11-08 18:17 UTC: **verify, deploy and smoke all passed**. The main-branch verify job reran the build, sixteen core/integration checks, the seeded evaluation and eleven browser cases in Linux CI.

The public HTTPS smoke downloaded `manarola-sample-mono-ink.png`, verified its PNG signature and re-imported it through the browser at **1100 × 733**. It also verified populated source analysis, applied a local text plan (outline value 20), and fetched the guide, sitemap, machine-readable index and social image successfully. The canonical URL matched the public deployment. This was an ordinary fresh browser without a model key.

Live: https://brej-29.github.io/toonforge-mobile-ai/

[Machine-readable evidence](release-2.1.json) records the application commit and successful job times. Repository description/homepage and twenty relevant topics were applied and read back. [UI extension documentation](UI_2_1.md) records the finished interface while preserving incumbent design files and their disclosed sidecar drift.