# KrishiAssist page redesign

## What changed

### Resources
- Replaced the generic information panel with a searchable, filterable agriculture knowledge centre.
- Added six practical topic guides: crop planning, soil health, irrigation, pest/disease, seeds/machinery, and insurance/risk.
- Added official government portal links and a clear disclaimer about checking current rules.

### About Us
- Replaced the card-like information layout with an editorial brand story.
- Added the problem KrishiAssist addresses, the platform approach, a four-step workflow, product principles, and an explicit limitation notice explaining that eligibility checks are not official approvals.

### Contact
- Added separate routes for scheme-specific help and central-government grievances.
- Added a translated feedback form with validation. The form prepares and copies a message to the user's clipboard; it does not claim to send or store messages because this project has no contact submission API or verified KrishiAssist support address.
- Added privacy guidance not to submit Aadhaar, bank details, passwords, OTPs or complete identity documents.

## Files changed
- `frontend/src/components.tsx`
- `frontend/src/styles.css`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/hi.json`
- `frontend/src/i18n/locales/hinglish.json`
- `frontend/i18n-allowlist.json`

## Translation and validation
- All new page content is provided through the central English, Hindi and Hinglish locale files.
- `node scripts/i18n-audit.mjs`: PASS, 747 keys per language, 0 problems.
- TypeScript JSX transpilation syntax check for `components.tsx` and `App.tsx`: PASS.
- A full Vite build was not run: dependency installation (`npm ci`) timed out in this environment. Run `npm ci` and `npm run build` locally.

## Important behavior
- Official scheme and grievance links open in a new tab.
- The contact form only copies a prepared message; it is not a live support ticket system. To enable submissions, configure a real backend endpoint and verified support destination.
