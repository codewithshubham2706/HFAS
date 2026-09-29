# ASSET_LICENSES.md — HFAS

All fonts, icons, illustrations, photos and Lottie files used in this project, with license links.
Anything marked **REQUIRES LEGAL REVIEW** must be cleared by counsel before release.

| Asset | Where used | License / source | Status |
|---|---|---|---|
| Inter (font) | All UI text | SIL Open Font License 1.1 — https://openfontlicense.org | ✅ Cleared |
| Inline SVG icons (hand-drawn in this repo) | All UI | Original work, no attribution required | ✅ Cleared |
| `lottie/upload-success-check.json` | Upload success (docs page, upload overlay) | Placeholder geometry shipped in repo — replace with a licensed or original Lottie before launch | ⚠️ REQUIRES LEGAL REVIEW |
| `lottie/loader-ring.json` | Loading states (buttons, OCR parsing) | Placeholder geometry shipped in repo — replace with a licensed or original Lottie before launch | ⚠️ REQUIRES LEGAL REVIEW |
| `lottie/check-burst-small.json` | Field accept micro-celebration; confirmation hero | Placeholder geometry shipped in repo — replace with a licensed or original Lottie before launch | ⚠️ REQUIRES LEGAL REVIEW |
| Hero illustration / photography | Landing hero band | **Not yet sourced.** Use original work or a license that permits commercial use (e.g. Unsplash License, paid stock) | ⚠️ REQUIRES LEGAL REVIEW |
| Consent + legal copy (`consent.*` strings) | Consent page & modal | Draft copy by product team — must be reviewed and approved by counsel | ⚠️ REQUIRES LEGAL REVIEW |
| Policy-number handling copy (`details.policyNo*`) | Details form | Draft copy — security & privacy review required (encryption at rest claims) | ⚠️ REQUIRES LEGAL REVIEW |

## Notes

- The landing page intentionally uses a CSS gradient hero band instead of a photo so no unlicensed imagery ships by default.
- All Lottie JSON files in `public/lottie/` are minimal hand-authored placeholder animations (no third-party assets inside).
- If any stock imagery or third-party Lottie is added later, record the license URL and expiry here.
