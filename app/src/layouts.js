// The eight layouts. A layout turns a canvas size into panel rectangles, each
// rectangle in fractions of the canvas (0..1), plus where the title sits and
// whether the cover wears a frame. Diagonal panels carry a `poly` of corner
// points instead of a plain rectangle, so the renderer clips them to a slant.
//
// titleBand: multi-panel layouts reserve this fraction of the canvas height
// at the bottom for the caption, and their panels are drawn only above it,
// so the title can never cover a face in a panel. Single-panel layouts
// (Key Art, Billboard) have no band: the title sits over the full-bleed
// photo, as a GTA cover should, and the face-aware crop keeps faces above it.
// Film Strip keeps its mid-cover title and has no band either.
function rect(x, y, w, h) { return { x, y, w, h }; }

export const LAYOUTS = [
  {
    id: 'keyart', name: 'Key Art', panels: 1, frame: true, titleY: 0.84, titleScale: 1.15,
    rects(W, H) { return [rect(0, 0, 1, 1)]; },
  },
  {
    id: 'castgrid', name: 'Cast Grid', panels: 6, frame: false, titleY: 0.86, titleScale: 1.0, titleBand: 0.2,
    rects(W, H) {
      const g = 0.008, cw = (1 - g * 4) / 3, ch = (1 - g * 3) / 2;
      const out = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        out.push(rect(g + c * (cw + g), g + r * (ch + g), cw, ch));
      }
      return out;
    },
  },
  {
    id: 'triptych', name: 'Triptych', panels: 3, frame: false, titleY: 0.85, titleScale: 1.05, titleBand: 0.2,
    rects(W, H) {
      const g = 0.008, cw = (1 - g * 4) / 3;
      return [0, 1, 2].map((c) => rect(g + c * (cw + g), g, cw, 1 - g * 2));
    },
  },
  {
    id: 'quad', name: 'Quad', panels: 4, frame: false, titleY: 0.85, titleScale: 1.0, titleBand: 0.2,
    rects(W, H) {
      const g = 0.008, cw = (1 - g * 3) / 2, ch = (1 - g * 3) / 2;
      const out = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        out.push(rect(g + c * (cw + g), g + r * (ch + g), cw, ch));
      }
      return out;
    },
  },
  {
    id: 'billboard', name: 'Billboard', panels: 1, frame: false, titleY: 0.80, titleScale: 1.25,
    rects(W, H) { return [rect(0, 0, 1, 1)]; },
  },
  {
    id: 'diagonal', name: 'Diagonal', panels: 2, frame: false, titleY: 0.86, titleScale: 1.0, titleBand: 0.2,
    rects(W, H) {
      return [
        { x: 0, y: 0, w: 1, h: 1, poly: [[0, 0], [1, 0], [0.42, 1], [0, 1]] },
        { x: 0, y: 0, w: 1, h: 1, poly: [[1, 0], [1, 1], [0.42, 1]] },
      ];
    },
  },
  {
    id: 'stack', name: 'Stack', panels: 3, frame: false, titleY: 0.86, titleScale: 1.0, titleBand: 0.2,
    rects(W, H) {
      const g = 0.008;
      const h1 = 0.44, h2 = 0.29, h3 = 1 - h1 - h2 - g * 4;
      return [
        rect(g, g, 1 - g * 2, h1),
        rect(g, g * 2 + h1, 1 - g * 2, h2),
        rect(g, g * 3 + h1 + h2, 1 - g * 2, h3),
      ];
    },
  },
  {
    id: 'strip', name: 'Film Strip', panels: 4, frame: false, titleY: 0.60, titleScale: 1.0,
    rects(W, H) {
      const g = 0.008, heroH = 0.60, stripH = 1 - heroH - g * 3;
      const sw = (1 - g * 4) / 3;
      const out = [rect(g, g, 1 - g * 2, heroH)];
      for (let c = 0; c < 3; c++) {
        out.push(rect(g + c * (sw + g), g * 2 + heroH, sw, stripH));
      }
      return out;
    },
  },
];

/** Looks a layout up by id, falling back to the cast grid. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[1];
}
