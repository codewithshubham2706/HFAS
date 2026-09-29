# FIGMA_PROMPT.md — HFAS design system brief

Paste-ready brief for Figma AI / a designer. Produces the 12 screens + component
library matching the frontend prototype in this repo.

## Tokens (exact values)

### Color
```
brand/primary 50 #eef6ff · 100 #d9ecff · 200 #b0d2ff · 300 #7fb3fd · 400 #4d8ef7
500 #2668e8 · 600 #1a4fc6 · 700 #163da0 · 800 #14357f · 900 #122c66
success 50 #e7f8ef · 500 #1e9e5a · 600 #157a44
error   50 #fdeeee · 500 #d23c3c · 600 #b02f2f
warning 50 #fff6e5 · 500 #d98a00 · 600 #b06f00
info    50 #e9f3fd · 500 #2478c8
gray    0 #ffffff · 50 #f7f8fa · 100 #eef0f3 · 200 #dfe3e8 · 300 #c8cfd7
        400 #9aa5b1 · 500 #6b7683 · 600 #4c5560 · 700 #363e48 · 800 #242a32 · 900 #14181e
```

### Spacing (4px base)
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`

### Radius
`sm 6 · md 10 · lg 16 · xl 24 · full 999`

### Typography — Inter
```
caption   12/16 500      body-sm 13/18 400     body 15/22 400
body-lg   17/26 400      title-sm 16/24 600    title-md 20/28 650
title-lg  26/34 700      display 40/48 800     display-lg 52/60 800
```

### Motion
```
page 520ms · overlay 320ms · fast 140ms · base 260ms · stagger 60ms
shimmer 1.2s loop · spinner 900ms
easing standard cubic-bezier(.22,.9,.35,1)
```

## Screens (desktop 1440 + mobile 375 each)

1. **landing** — hero (title, subtitle, CTA primary/secondary), 3 value cards,
   testimonial, footer; language toggle; granular cookie banner.
2. **auth-signup** — phone/email + OTP modal (scale .995→1, 320ms); privacy microcopy.
3. **onboarding-wizard** — one-question-per-step; progress; 60ms stagger reveals;
   slide transitions 320ms.
4. **dashboard** — left rail + top header; eligibility summary; recommended cards;
   quick action "Start application" → app-stepper overlay.
5. **eligibility-results** — filter chips + sort; card grid; row reveal 60ms;
   card hover lift -6px.
6. **scheme-detail** — header; animated eligibility checklist (stroke checkmarks);
   doc list → upload overlay; provider contact.
7. **application-overview** — stepper; documents summary; caseworker card; continue CTA.
8. **application-documents** — dropzone; thumbnail grid; OCR panel with
   Accept/Edit chips and check-burst micro-animation.
9. **application-details** — prefilled form; policy_no marked sensitive (lock);
   shake validation.
10. **application-consent** — consent text; sharing checkboxes; e-sign; submit →
    loading spinner → success toast. **REQUIRES LEGAL REVIEW** on copy.
11. **submission-confirmation** — check-burst celebration; summary; timeline CTA.
12. **status-timeline** — vertical timeline; filters; appeal; download history.

## Overlays (single canvas, SPA wiring)
`app-stepper-drawer` (right slide 320ms) · `doc-upload-overlay` (camera+dropzone+OCR
progress) · `doc-viewer-overlay` (highlights) · `consent-modal` (center) ·
`quick-review-drawer` (caseworker) · `support-chat-drawer`.
All: focus trap on open, Esc closes, exit 280ms decelerate.

## Component variants (states: default/hover/pressed/loading/success/error)
`Button/primary|secondary|ghost × sm|md|lg` · `Input/text default|error|sensitive` ·
`Stepper/horizontal (stepCount)` · `Card/scheme compact|expanded` ·
`Doc/thumbnail default|processing|flagged` · `Uploader/dropzone default|dragover|processing|success` ·
`Timeline/item default|new|expanded` · `Toast success|error` · `Modal/center confirm|form` ·
`Table/row application action-needed` · `Avatar/40|56` · `Icon button/40`

Export names: kebab-case (`button-primary-medium.svg`).
