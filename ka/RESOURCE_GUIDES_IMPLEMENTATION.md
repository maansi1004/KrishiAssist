# Resource guide implementation

## Files changed
- `frontend/src/data/resourceGuides.ts` (new): six complete practical guides, each localized in English, Hindi and Hinglish. Each guide has five sections with practical points.
- `frontend/src/components.tsx`: resource cards are now accessible buttons and open a detailed modal with a contents navigation, section details, safety note and close actions. The guide uses the shared language store, so changing the app language changes the entire guide.
- `frontend/src/styles.css`: responsive modal, table-of-contents, section and focus styles.
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/hi.json`
- `frontend/src/i18n/locales/hinglish.json`: translated guide labels and agricultural safety notice.

## Guide topics
1. Crop planning & cultivation
2. Soil health & nutrients
3. Water & irrigation
4. Pest & disease management
5. Seeds & farm machinery
6. Insurance & risk management

## Validation
- `node frontend/scripts/i18n-audit.mjs`: PASS — 752 keys in each language, 0 audit problems.
- TypeScript compiler was invoked, but this extracted ZIP has no installed React dependencies. Compiler output therefore reports missing `react` / `react-jsx-runtime` modules; a full frontend build must be run after `npm ci`.

## Install / use
Copy the files in this patch ZIP into the same paths in your project, overwriting the existing files. Then run:
```bash
cd frontend
npm ci
npm run build
npm run dev
```

These are general educational guides, not crop-specific prescriptions. Verify local varieties, dates, seed rates, nutrient doses and plant-protection measures with the local KVK or state agriculture department.
