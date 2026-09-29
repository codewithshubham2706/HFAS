# Cookie Policy — HFAS (DRAFT)

> **REQUIRES LEGAL REVIEW** — EU ePrivacy Directive / GDPR consent standard,
> India DPDP notice requirements. Not legal advice.

_Last updated: {LAST_UPDATED} · Version 1.0-draft_

## 1. What we set

HFAS sets the minimum cookies needed for the site to work, and **only** sets
analytics or marketing cookies after you opt in through the granular banner
(essential / analytics / marketing). No third-party tracking scripts load
before consent.

| Category | Purpose | Cookies / storage | Duration | Consent needed |
|---|---|---|---|---|
| **Essential** | Session, CSRF, security, load-balancing | `hfas.session` (httpOnly, Secure, SameSite=Lax) | Session – 15 min access / 30 d refresh | No (strictly necessary) |
| **Essential** | Cookie consent proof | `hfas.cookie-consent` (localStorage: choices + timestamp) | 12 months | No (stores your choice itself) |
| **Analytics** (opt-in) | Aggregate usage, error rates | `[ANALYTICS_COOKIE]` (e.g., Matomo `mtm_*` / GA4 `_ga`) | 13 months | **Yes** |
| **Marketing** (opt-in) | Campaign attribution — none today | *(none set while PAYMENTS/marketing disabled)* | — | **Yes** |

We do **not** use: fingerprinting, cross-site tracking, advertising IDs,
session-replay recording on authenticated pages, or selling of cookie data.

## 2. Managing your choices

- The banner appears on first visit; "Save preferences" accepts only essential.
- Change anytime: Settings → Privacy → Cookie preferences (banner reappears).
- Withdrawing consent takes effect immediately; analytics scripts are removed
  on next page load and the choice is recorded with a timestamp.

## 3. Do Not Track

We honour `DNT: 1` as equivalent to declining analytics and marketing.
**REQUIRES LEGAL REVIEW** (DNT has no unified legal status).

## 4. Third parties that could set cookies after consent

| Vendor | Role | Policy link to check |
|---|---|---|
| `[ANALYTICS_VENDOR]` e.g., Matomo Cloud | Usage analytics | Fetch latest DPA + cookie list before enabling — **REQUIRES LEGAL REVIEW** |
| Stripe (if payments enabled) | Fraud prevention, PCI scope | **REQUIRES LEGAL REVIEW** |

## 5. Contact

Questions: `[CONTACT_DPO]`. See also PrivacyPolicy.md § Your rights.
