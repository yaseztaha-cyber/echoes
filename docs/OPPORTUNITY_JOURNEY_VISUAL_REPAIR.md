# Opportunity Journey Visual Repair Report

## Root causes found

1. **Root container used `flex` (row direction) instead of `flex flex-col`** — causing header, toggle, progress bar, and content to lay out horizontally instead of stacked. This created the appearance of "five tall columns" because the view-mode buttons and content panels were arranged side-by-side in a row.

2. **Backdrop opacity was `bg-ink-0/98`** (98% opaque) — nearly completely opaque, making the underlying Mars scene invisible.

3. **Right panel used `w-[420px]`** with no responsive consideration, causing clipping on narrower viewports.

4. **No `min-h-0` / `min-w-0` on flex children** — causing content to overflow instead of scrolling within panels.

5. **View-mode buttons had `flex-1`** in a horizontal flex, causing them to stretch to equal width (not height, but visually appeared as tall columns due to the row layout bug).

## Components changed

- `src/components/mission/MissionJourney.tsx` — complete layout reconstruction

## CSS rules corrected

- Root: Changed from `flex bg-ink-0/98` to `flex flex-col bg-ink-0/85 backdrop-blur-sm` with `height: 100dvh`
- View-mode tabs: Removed `flex-1`, added compact `px-3 py-1` with `minHeight: 24px`
- Main content: Added `min-h-0` to flex children, proper `overflow-hidden` on container
- Left panel: Added `min-w-0 min-h-0 overflow-y-auto` with `max-w-3xl` content wrapper
- Right panel: Changed from `w-[420px]` to `w-[320px]` with `overflow-y-auto`
- Backdrop: Reduced from 98% to 85% opacity

## Before/after

- Before: 5 tall columns, near-black screen, clipped right panel, document scrollbar
- After: Compact horizontal tabs, readable content, visible Mars scene, no overflow

## Tested viewport sizes

- 1660 × 930 (primary reference) — screenshot captured
- Build verified at production scale

## Functional test results

- All 23 Opportunity chapters preserved
- All navigation controls (prev/next/play/pause/exit) present
- All view modes (CHAPTER/VIDEO/IMAGE/DISCOVERY/SOURCES) present
- Case file viewer functional
- TypeScript compiles clean
- 127/127 tests pass

## Remaining known limitations

- Browser-based interaction testing not performed (no Playwright CLI available for automated clicks; Python Playwright used for screenshots only)
- Media files for non-Opportunity devices are referenced by ID but not all have corresponding image files
