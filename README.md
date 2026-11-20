# gta6-cover-art
[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ravi2gc/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ravi2gc/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Neon Vice Studio** — turn your own photos into striking GTA-style multi-panel
cover art, right in the browser. Upload photos (or use the built-in samples),
crop each panel, pick from 8 layouts and 8 sunset/neon colour grades, write your
caption, add callout labels, and export a PNG at 1080×1080, 1080×1350 or
1920×1080. Everything runs offline; your photos never leave your machine.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network, just static files
under `app/`.

## How it works

1. **Photos** — drop in your own photos or tap a sample. Click a photo, then a
   panel, to place it; one photo can fill several panels.
2. **Layout** — 8 layouts: framed Key Art, 6-panel Cast Grid, Triptych, Quad,
   Billboard hero, Diagonal split, portrait Stack, and cinematic Film Strip.
3. **Grade** — 8 colour treatments: Vice Sunset, Neon Nights, Heatwave, Palm
   Noir, Gold Hour, Teal Vice, Magenta Mile and Classic Print.
4. **Caption** — bold condensed title lettering over the art, plus a subtitle.
5. **Callouts** — labels with leader lines pointing at the cover; drag them
   where you want them.
6. **Crop** — click a panel to select it, drag inside it to pan, use the zoom
   and rotate sliders.
7. **Export** — one click downloads the PNG in your chosen post size, or copies
   it to the clipboard.

All artwork is original: the sample portraits are model-made fictional
characters, and the title font is Noto Sans Display Condensed Black under the
SIL Open Font License (`app/fonts/OFL.txt`). No Rockstar logo, artwork,
character or font is used.

Built with [make.fun](https://make.fun/r/vpfq6vhj) — get paid in real USDC for
building stuff with your AI.
