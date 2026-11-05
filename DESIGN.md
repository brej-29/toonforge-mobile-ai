---
name: Toonforge
description: A private photo and print studio with an animation festival character.
colors:
  ink: "#26234c"
  muted: "#615e7c"
  paper: "#fff"
  lilac: "#c2bef4"
  ground: "#e9e8fa"
  line: "#d9d7eb"
  yellow: "#f7d96c"
  focus: "#5146ba"
  headline-accent: "#756caa"
  preview-ground: "#f2f1f7"
  switch-ground: "#f1f0f8"
  selected-ground: "#efedf9"
  selected-line: "#a69dcf"
  metrics-ground: "#f8f7fc"
  offline-ground: "#fff3bd"
  error-ground: "#fff0ef"
  error-text: "#9c2920"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(28px,3.2vw,48px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    letterSpacing: "-.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.8
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 800
  style-title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 800
  primary-action:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 800
rounded:
  label: "4px"
  switch: "6px"
  action: "7px"
  control: "8px"
  drop: "10px"
  studio: "16px"
  circle: "50%"
spacing:
  switch: "3px"
  tight: "8px"
  control-gap: "10px"
  inset: "20px"
  rail: "23px 22px 16px"
  action: "13px 16px"
  style: "10px 9px"
  metrics: "14px 20px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.primary-action}"
    rounded: "{rounded.action}"
    padding: "{spacing.action}"
  button-print:
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
  button-text:
    textColor: "{colors.ink}"
    padding: "3px 0"
  view-switch:
    backgroundColor: "{colors.switch-ground}"
    rounded: "{rounded.switch}"
    padding: "{spacing.switch}"
  view-switch-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.label}"
    padding: "6px 9px"
  style-option:
    rounded: "{rounded.control}"
    padding: "{spacing.style}"
  style-option-selected:
    backgroundColor: "{colors.selected-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "{spacing.style}"
  studio:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.studio}"
  metrics:
    backgroundColor: "{colors.metrics-ground}"
    padding: "{spacing.metrics}"
  error:
    backgroundColor: "{colors.error-ground}"
    textColor: "{colors.error-text}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
---

# Design System: Toonforge

## Overview

**Creative North Star: "Animation festival programme"**

An open periwinkle field, deep navy typography, and a white working surface frame the photograph. Manrope gives the studio a friendly, precise voice. Yellow makes the next export action easy to find while the broad image aperture carries the visual interest.

The character comes from colour, compact utility labels, and the comparison seam. Controls keep familiar button, range, and disclosure behaviour. Motion briefly reveals a newly processed image; the same information remains available through explicit preview choices and reduced-motion behaviour.

**Key Characteristics:**

- Periwinkle ground with navy text and white working surfaces.
- A large, contained image preview and a compact settings rail.
- Yellow primary actions, quiet outlined print actions, and visible selected states.
- Friendly Manrope, strong headlines, and tabular measurements.
- A draggable comparison seam with a brief eased reveal.

## Colors

The palette combines a cool lavender workspace with warm action colour and dark, legible ink. Frontmatter preserves the values used in `src/style.css`.

### Primary

- **Warm yellow** identifies the primary download and empty-state photo actions; text stays navy.
- **Deep navy ink** carries headings, controls, selected preview buttons, and range accents.

### Secondary

- **Lilac** details the wordmark; **headline accent** softens the second line of the introduction.
- **Focus violet** identifies keyboard focus independently of selection.

### Neutral

- **Periwinkle ground** fills the page; **paper** defines the editor.
- **Muted lavender ink** supports explanations, captions, and measurement labels.
- **Line** divides the settings rail, adjustments, and measurement strip.
- **Preview ground**, **switch ground**, **selected ground**, and **metrics ground** distinguish local contexts without heavy borders.
- **Selected line** accompanies the filled selection indicator on style choices.
- **Offline ground** provides the connection notice. **Error ground** and **error text** provide the inline error treatment.

## Typography

Manrope with a sans-serif fallback is the only type family. The implementation loads weights 400, 500, 600, 700, and 800; the base weight is 500. Headlines are tightly tracked, while smaller operational text remains compact and direct.

- **Display:** the frontmatter display role defines the desktop introduction. It becomes 34px at the tablet breakpoint and 35px on phones.
- **Headline:** the explanatory section uses the headline role; its size becomes 25px on tablets and 28px on phones.
- **Title:** the settings heading uses the title role and becomes 15px on phones.
- **Body:** explanatory prose uses the body role, a maximum measure of 65ch, and becomes 13px on phones. Introduction copy uses a 1.75 line-height and becomes 12px below the tablet breakpoint.
- **Labels:** adjustment labels use the label role, becoming 11px below the tablet breakpoint. Style titles use the style-title role, becoming 12px on tablets and 11px on phones.
- **Measurements:** numeric outputs use tabular numerals. Utility text ranges from 8px image labels to 13px disclosure summaries; preserve each component's established hierarchy.

## Layout

Header, main content, and footer share a 1600px maximum width. Desktop page padding is 4.5%. The editor is a two-column grid: a flexible image workspace and a 286px settings rail. At 1100px and below, the rail narrows to 260px and metadata compresses. The preview is contained rather than cropped, with a desktop height of `clamp(320px,32.6vw,482px)`; it is 445px in the intermediate layout and 500px above 1700px.

At 900px and below, page padding becomes 5% and the editor stacks into one column. The settings follow the preview, styles become three adjacent choices, swatches disappear, adjustments form two columns, and download/print sit alongside each other. The preview uses `clamp(270px,58vw,410px)`. The explanatory area remains two columns.

At 480px and below, introduction text stacks, the preview is 278px tall, toolbar metadata shortens, and the explanatory area becomes one column. Secondary metadata and the duplicate sample action are hidden to preserve space. Style choices remain three columns; labels wrap within them. Measurements wrap beneath the work.

The interface uses local gaps and insets from the frontmatter rather than a universal spacing grid. The editor toolbar and image footer are 58px tall, with a 52px phone toolbar. The primary action has a minimum height of 44px; print has a minimum height of 38px.

Print uses a white sheet with 15mm page margins, a centred image capped at 220mm high, a 20pt title, a 9pt caption, and 8mm gaps. The screen interface is hidden.

## Elevation & Depth

Depth is restrained. White and pale tinted surfaces divide tasks; thin rules organise the controls. The studio has one diffuse shadow (`0 14px 40px -20px #4d407536`). The white circular comparison handle uses `0 2px 10px #0002`, and its seam has a subtle drop shadow (`0 1px 2px #0004`). Shadows anchor the editor and make the seam readable over variable image content.

## Shapes

The editor has broad rounded corners, with smaller radii for buttons, choice surfaces, view switches, and image labels. Circular selection marks and the comparison handle contrast with these quiet rectangles. Style swatches are small clipped rectangles rotated by -4deg on desktop. Icons are outlined, with rounded caps and joins; the main stroke width is 1.7.

## Components

### Buttons and navigation

The primary action uses warm yellow, navy text, an 800 weight, and the action inset and radius from frontmatter. Print is a quieter outlined action. Text actions use an underline; the upload action pairs an outline icon with bold text. Enabled buttons darken slightly on hover through `brightness(.96)`. Disabled buttons use half opacity and a disabled cursor.

Header navigation is compact, bold text with an underline on hover. The last header link hides at the tablet breakpoint. A skip link becomes visible on focus.

### Preview selector and style choices

Compare, Result, and Original form a compact segmented group with a navy selected button. Style choices combine a title, short description, swatch, and circular selection indicator. Selection uses a pale fill, thin outline, and filled navy indicator. Selected appearance and keyboard focus are distinct: focus uses a 3px violet outline with 4px offset, including on a selected style choice.

### Range inputs and comparison seam

Adjustment ranges retain native browser rendering with navy accents, paired labels, numeric output, and endpoint captions. The comparison control is an invisible full-image range input; its visible seam is 2px wide with a 38px white circular handle. Its focused image frame receives a 4px inset violet outline. Preview buttons provide explicit alternatives to dragging.

A new image's first result reveals over 550ms using `cubic-bezier(.16,1,.3,1)` when Compare is active. Ordinary colour and shadow transitions take 160ms. The processing spinner rotates once per second; the toast fades in 200ms and moves in 300ms with the same easing. Reduced motion disables CSS animations, transitions, and smooth scrolling, and skips the result reveal.

### Working surface and states

The white editor contains the image toolbar, preview, image footer, settings, and tinted measurement strip. The strip uses tabular values and a small green readiness dot alongside a text status.

Loading places a translucent pale overlay and text above the image, with a small spinner. Before a valid result, result pixels and seam controls stay hidden. Empty state centres an outline image icon, a short heading, helper text, and photo/sample actions. Errors appear inline under the workspace; offline status appears above the editor. A drag target uses a dashed focus-colour border. A navy toast provides transient feedback without displacing the workspace.

### Explanatory disclosures

Native details/summary rows use thin separators, bold question text, and a plus/minus indicator. Body copy is muted and comfortably spaced. The open state expands in document flow.

## Do's and Don'ts

### Do:

- **Do** keep the photograph and comparison seam visually dominant within the white working surface.
- **Do** use the established yellow primary action, navy control text, and periwinkle page ground.
- **Do** preserve visible keyboard focus independently of selected states.
- **Do** retain explicit preview choices and the reduced-motion path alongside the draggable seam.
- **Do** apply the tablet and phone layout changes together with their typography overrides.

### Don't:

- **Don't** crop the preview to fill its aperture; preserve the image's aspect ratio.
- **Don't** show a result or comparison seam before processed pixels are ready.
- **Don't** replace the established native ranges and disclosures with decorative controls.
- **Don't** carry the screen interface onto the printed sheet.
