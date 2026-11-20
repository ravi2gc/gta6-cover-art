# Palm Fever — GTA-Style Cover Art Maker

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/gta6-cover-art-01)
[![repo](https://img.shields.io/badge/repo-ravi2gc%2Fgta6--cover--art-181717?logo=github)](https://github.com/ravi2gc/gta6-cover-art)
[![cover art](https://img.shields.io/badge/cover%20art-Palm%20Fever-ff4d8d)](https://make.fun/bounty/gta6-cover-art-01)

Turn your own photos into a multi-panel GTA-style poster — the cast grid, the
striped-gradient title, the neon script subtitle, the press quote, the gold
seal — and export it as a PNG to share. Everything runs offline in the
browser: your photos are read on your own machine and never uploaded.

## What it makes

- **5 layouts** — the flagship 6-panel cast grid, an asymmetric collage, a
  2×2 grid, a 3-panel stack, and a full-bleed hero with a code-drawn retro sun,
  palm silhouettes and birds.
- **6 colour grades** — Vice City Sunset, Neon Nights, Golden Hour, Noir, Palm
  Dusk and Magenta Rush, applied evenly across every panel.
- **Per-panel photos** — upload several photos at once, fill all panels with
  one photo, or assign a different photo to each panel; every panel has its own
  zoom, pan, Fill / Show-whole fit and editable role label
  (THE DRIVER, THE BOSS, THE INSIDER, THE RIDER, THE COURIER, THE FIXER).
- **Editable caption** — big striped title, neon script subtitle, tagline bar,
  press quote and source, all live in the preview.
- **Poster chrome, drawn in code** — quote strip with five stars and a VOL. 1
  badge, tagline ribbon, production footer, barcode and an ORIGINAL COVER ART
  gold seal.
- **One-click PNG export** at 1080 × 1080, 1080 × 1350 and 1920 × 1080.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Click **Load the sample cast** for six model-made sunset portraits, pick a
layout and a grade, click any panel to select it, then export.

## Originality

All lettering uses local OFL fonts (Anton, Pacifico, Oswald under
`app/fonts/`). The sun, palms, halftone dots, birds, barcode and seal are drawn
in code in `app/src/cover.js`. No Rockstar Games logo, wordmark, official
artwork, character or font is used anywhere. The sample portraits in
`app/samples/` were made with an image model for this entry.

## Files

- `app/index.html`, `app/style.css` — page and editor styling
- `app/src/cover.js` — the poster renderer (layouts, grades, title, seal)
- `app/src/main.js` — editor wiring, sample cast, PNG export
- `app/fonts/` — Anton, Pacifico, Oswald (SIL Open Font License)
- `app/samples/` — six model-made portraits plus the kit's two starter photos
- `main.ts` — hands `app/` and `screenshots/` in as the entry
- `serve.ts` — static server for local trying
