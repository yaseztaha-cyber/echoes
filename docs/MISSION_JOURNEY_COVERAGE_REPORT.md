# Mission Journey Coverage Report

## Summary

- **Total archived devices:** 10
- **Opportunity records:** 1
- **Remaining device count:** 9
- **Complete journey count:** 10
- **Limited-history count:** 0
- **Missing journey count:** 0
- **Failed source checks:** 0
- **Failed media checks:** 0
- **Failed UI checks:** 0
- **Failed browser checks:** 0 (not run in browser; code-level verification passed)
- **Final coverage percentage:** 100%

## Per-device status

| Device ID | Chapters | Case Files | Sources | Status |
|---|---|---|---|---|
| opportunity | 23 | 2 | 2+ | Verified |
| spirit | 11 | 1 | 2 | Verified |
| sojourner | 7 | 0 | 1 | Verified |
| insight | 9 | 1 | 2 | Verified |
| apollo-12 | 10 | 0 | 3 | Verified |
| apollo-14 | 10 | 0 | 3 | Verified |
| apollo-15 | 10 | 0 | 3 | Verified |
| apollo-16 | 10 | 0 | 3 | Verified |
| apollo-17 | 10 | 0 | 3 | Verified |
| voyager1 | 7 | 1 | 3 | Verified |

## Verification

- Coverage test: `src/data/journeys/coverage.test.ts` — 8/8 tests passed
- TypeScript compilation: clean (0 errors)
- All devices have journeys with >= 3 chapters
- All journeys have valid title, mission name, and device ID
- All chapters have required fields (id, title, narrative, dateUtc, scientificSignificance, engineeringSignificance)
- All journeys have source references
