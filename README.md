# Sunset Cover — GTA 6-style Cover Maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ravi2gc/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ravi2gc/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An entry for [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) on make.fun.

**Sunset Cover** turns your photo and a caption into GTA 6-style poster art —
the multi-panel look with bold condensed lettering and a Vice City sunset or
neon colour grade — and exports it as a PNG to share. It runs entirely
offline in a desktop browser from its own static files: photos are read on
your machine and never leave it.

## How it works

1. **Add photos** — pick one or several from your machine, or use the two
   included sample photos. Click a photo thumbnail to put it in the selected
   panel; "One photo in all panels" fills every panel with the same shot.
2. **Pick a layout** — Hero + strip, 2×2 grid, 3-panel stack, or full-bleed.
3. **Pick a colour grade** — Vice City Sunset, Neon Nights, Golden Hour,
   Noir, or Palm Dusk.
4. **Crop the selected panel** — click a panel in the live preview, then drag
   the photo inside it, or use the zoom and position sliders; Fill panel or
   Show whole photo.
5. **Write the caption** — big outlined condensed caps with a sunset-gradient
   fill, plus an optional kicker line, size and position controls.
6. **Export PNG** — one click at 1080×1080, 1080×1350, or 1920×1080.

## The art

Everything on the poster is drawn by the app's own code (`app/src/cover.js`):
multi-panel comic-book frames, a striped retro sun with rays, palm-tree
silhouettes, halftone dots, birds, vignettes, and outlined Anton lettering
with a gradient fill. No Rockstar Games logo, artwork, or font is used
anywhere. Fonts are Anton and Oswald under the SIL Open Font License,
shipped as files under `app/fonts/` with their licence texts.

## Try it

```sh
node serve.ts   # then open http://localhost:8080
```

## Layout

- `app/` — the web app (static files, no build step, no network requests)
  - `index.html`, `style.css`, `src/cover.js` (drawing engine), `src/main.js` (editor), `src/shots.js` (screenshot scenes)
  - `fonts/` — Anton + Oswald woff2 with OFL licence texts
  - `samples/` — two sample photos made with an image model, free to use
- `screenshots/` — 4 screenshots: the exported landscape cover, the editor
  with a photo loaded, and exported portrait and square covers
- `shots.json` — the reproducible shot scenes behind the screenshots
- `main.ts` — the entry program (Node 22, standard library only): copies
  `app/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged
- `serve.ts` — a tiny static server for local testing

## Licence

MIT — see `LICENSE`.
