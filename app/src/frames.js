// VICE GOLD — layouts (frames). Nine poster layouts, all defined in normalised
// 0..1 canvas coordinates and scaled to any export size by layoutPanels().
// title: 'top' reserves a title band above the panels; 'bottom-left' puts the
// title over the lower-left of a full-bleed hero; 'band' uses a title band
// below the panels (Billboard). biasY is passed to the face-aware crop so the
// hero close-up leaves room for the title.
const M = 0.03; // outer margin
const G = 0.012; // gap between panels
const TOP = 0.17; // top of the panel area for 'top' layouts
const BOT = 0.905; // bottom of the panel area

function grid(cols, rows, y0 = TOP, y1 = BOT) {
  const panels = [];
  const w = (1 - 2 * M - (cols - 1) * G) / cols;
  const h = (y1 - y0 - (rows - 1) * G) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      panels.push({ x: M + c * (w + G), y: y0 + r * (h + G), w, h, slant: 0 });
    }
  }
  return panels;
}

export const LAYOUTS = [
  { id: 'hero', name: 'Hero', title: 'bottom-left', castStrip: true, biasY: 0.36 },
  { id: 'cast-grid', name: 'Cast Grid', title: 'top', castStrip: false, biasY: 0.5 },
  { id: 'triptych', name: 'Triptych', title: 'top', castStrip: false, biasY: 0.5 },
  { id: 'quad', name: 'Quad', title: 'top', castStrip: false, biasY: 0.5 },
  { id: 'billboard', name: 'Billboard', title: 'band', castStrip: false, biasY: 0.42 },
  { id: 'diagonal', name: 'Diagonal', title: 'top', castStrip: false, biasY: 0.5 },
  { id: 'stack', name: 'Stack', title: 'top', castStrip: false, biasY: 0.5 },
  { id: 'film-strip', name: 'Film Strip', title: 'top', castStrip: false, biasY: 0.5 },
  { id: 'poster-wall', name: 'Poster Wall', title: 'top', castStrip: false, biasY: 0.5 },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

function normalisedPanels(id) {
  switch (id) {
    case 'hero':
      return [{ x: 0, y: 0, w: 1, h: 1, slant: 0 }];
    case 'cast-grid': return grid(3, 2);
    case 'triptych': return grid(3, 1);
    case 'quad': return grid(2, 2);
    case 'billboard':
      return [
        { x: M, y: M, w: 0.60, h: 0.69, slant: 0 },
        { x: 0.645, y: M, w: 0.325, h: 0.335, slant: 0 },
        { x: 0.645, y: 0.38, w: 0.325, h: 0.335, slant: 0 },
      ];
    case 'diagonal': {
      const panels = [];
      for (let i = 0; i < 3; i++) {
        panels.push({ x: 0.01 + i * 0.31, y: TOP, w: 0.32, h: BOT - TOP, slant: 0.045 });
      }
      return panels;
    }
    case 'stack': return grid(1, 3);
    case 'film-strip': return grid(5, 1);
    case 'poster-wall': return grid(3, 3);
    default: return grid(3, 2);
  }
}

/** Scale a layout to a real canvas. Panels come back in pixels. */
export function layoutPanels(id, W, H) {
  const layout = layoutById(id);
  const panels = normalisedPanels(id).map((p) => ({
    x: p.x * W,
    y: p.y * H,
    w: p.w * W,
    h: p.h * H,
    slant: (p.slant || 0) * W,
  }));
  return { layout, panels, titleZone: layout.title, castStrip: layout.castStrip, biasY: layout.biasY };
}
