# ASSET_LICENSES.md — HFAS monorepo

| Asset | Used in | License | Status |
|---|---|---|---|
| Inter font | frontend UI | SIL OFL 1.1 — https://openfontlicense.org | ✅ OK |
| Inline SVG icons (hand-authored in repo) | frontend, favicon | Original work (MIT, same as repo) | ✅ OK |
| `public/favicon.svg` | frontend | Original work | ✅ OK |
| Lottie placeholders (`public/lottie/*.json` in the prototype app) | docs reference | Original placeholder geometry | ⚠️ Replace with final licensed exports **REQUIRES LEGAL REVIEW** before launch |
| Photography / illustration (none shipped) | landing hero | Intentionally CSS-only so no unlicensed imagery ships | ✅ OK until imagery is added — then record license here |
| Legal documents under `docs/` | repo | Drafts — **REQUIRES LEGAL REVIEW**; not legal advice |

Rule: any new font, icon set, image or Lottie file MUST be added to this table
with its license URL before being committed. Copyleft assets need an entry in
`docs/ComplianceReport.md` § Licenses as well.
