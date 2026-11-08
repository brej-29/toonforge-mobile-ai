# Toonforge

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Delegated by the mission: TypeScript, Vite, Canvas, a dedicated Web Worker, and static hosting. No inference service or account is required.

## Users
Working hypothesis: educators and small creative teams who want to turn their own photos into illustrated handouts or simple comic artwork without sending images to a service. Demand is unvalidated; no user study has been conducted.

## Product Purpose
Open a photo, simplify visual texture while retaining outlines, compare the result, and download a PNG or print a sheet. Success is a complete private workflow plus the predeclared processing checks in docs/EVALUATION_PLAN.md.

## Positioning
A narrow photo-to-print workflow with deterministic processing, a visible original/result comparison, and per-image runtime and estimated ink coverage. These are classical image filters, not a generative model or an anonymity tool.

## Operating Context
Users edit in an ordinary browser on a phone or desktop, typically in daylight. Images stay in memory on that device. A labeled sample lets visitors test the entire workflow before selecting a personal photo.

## Capabilities and Constraints
Three styles, controllable texture/outlines/tone levels, local image loading, comparison, PNG export, and browser printing. Local histogram/contrast/transition analysis suggests settings through explicit heuristics. Twelve named recipes can be stored on-device; settings-only links make looks reusable. Local command words and an optional user-supplied text model can propose validated filter settings for review before applying. A local stdio MCP server exposes the shared PNG engine for trusted agents. Processing is bounded for mobile memory. Hosting needs an initial connection; cached public assets may then work offline. Optional text requests need network access and provider CORS. No claim of neural illustration quality, print toner savings, or customer adoption.

## Evidence on Hand
The original repository implements cartoonization across Flutter, FastAPI, Streamlit, and Gradio but ships no inference weights. The new evaluation uses controlled synthetic fixtures and does not measure human preference. See docs/BASELINE.md and docs/SOURCES.md.

## Product Principles
Keep every photo local. Make limitations visible. Measure before claiming improvement. Make the next action obvious. Preserve a useful export without a sign-up. Store settings instead of photos; never persist provider keys. Distinguish rule-based controls from optional language-model assistance.

## Accessibility & Inclusion
Keyboard-operable controls, semantic labels, AA contrast, status announcements, responsive layouts, and reduced motion. The visual comparison also has explicit original/result view controls.
