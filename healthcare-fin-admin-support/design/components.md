# components.md — HFAS component library reference

Reference for the React components in `frontend/components/` and their design
source in Figma (see FIGMA_PROMPT.md). States: default / hover / pressed /
loading / success / error.

## Button
| Prop | Values | Default |
|---|---|---|
| variant | `primary` `secondary` `ghost` | `primary` |
| size | `sm(32)` `md(40)` `lg(48)` | `md` |
| loading | boolean | false — shows 16px spinner, keeps width |
| disabled | boolean | false |

Hover lift -2px + shadow-2 (140ms). Focus ring 2px `--border-focus` offset 2.
Icon-only buttons need `aria-label`.

## Input
States: default / error (`aria-invalid=true`, red border + message with
`role=alert`) / sensitive (lock chip, monospace, `type=password`).
Label always visible (no placeholder-only). `aria-describedby` for hints.

## EligibilityCard
Props: `match` (score, reasons, amount), `onApply(slug)`.
Score chip + expandable "why" list (✓ green / ✗ red). Apply CTA full-width.
Card hover: lift -6px, shadow-2, 140ms.

## DocumentUploader
Signed-URL flow: presign → PUT → confirm(checksum) → OCR.
States: idle → uploading (shimmer 1.2s) → ocr (skeleton pulse 0.9s) →
parsed (field chips, Accept/Edit, check-burst on accept) / failed (manual entry).
Dragover: dashed border → primary-600, bg primary-50.
`capture="environment"` for mobile camera. Keyboard: Enter/Space opens picker.

## CookieConsent
Granular: essential (locked on) / analytics / marketing.
No third-party scripts load before explicit consent. Stores JSON +
timestamp in `localStorage['hfas.cookie-consent']`. **REQUIRES LEGAL REVIEW**
for EU ePrivacy / IAB TCF integration.

## Stepper (inline)
`role=progressbar` with `aria-valuenow/min/max`; 4px bars; animate width 320ms
standard ease. Hidden text `{current} of {n}` for SR users.

## Do / Don't
- DO keep all interactive targets ≥ 44×44.
- DO use real copy from i18n bundles — never lorem ipsum.
- DON'T animate opacity-only for critical info (reduced-motion must still read).
- DON'T disable zoom (`user-scalable=no`) — WCAG 1.4.4.
