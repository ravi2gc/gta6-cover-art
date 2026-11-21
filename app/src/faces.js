// VICE GOLD — face-aware crop.
//
// Every sample photo ships with a measured "critical face box": eyes to chin,
// horizontal span of the face. The auto-fill crop always keeps that whole box
// inside the visible window, so a cover can never cut eyes, mouth or chin.
// Hair may be cropped in a tight close-up (normal key-art practice); the
// critical features never are. Uploaded photos default to a centred box.
//
// Boxes are fractions of the image (x0, y0 top-left, x1, y1 bottom-right),
// measured by eye from the generated portraits.
export const FACE_BOXES = {
  // Sofia: eyes ~0.33, mouth ~0.44, chin ~0.49 of height; face x 0.33-0.68.
  'sofia.jpg':    { x0: 0.31, y0: 0.29, x1: 0.70, y1: 0.52 },
  // Dante: eyes ~0.28, mouth ~0.40, chin ~0.46; face x 0.30-0.70.
  'dante.jpg':    { x0: 0.29, y0: 0.24, x1: 0.71, y1: 0.48 },
  // Milo: eyes ~0.33, mouth ~0.42, chin ~0.47; face x 0.28-0.70.
  'milo.jpg':     { x0: 0.27, y0: 0.29, x1: 0.71, y1: 0.49 },
  // Duo Gold: two faces, woman 0.28-0.50 / man 0.50-0.74, eyes ~0.39-0.41,
  // chins ~0.52-0.53. The combined box keeps both faces whole.
  'duo-gold.jpg': { x0: 0.26, y0: 0.35, x1: 0.77, y1: 0.55 },
  // Kit samples (no close face): a generous centred box.
  'boulevard.jpg': { x0: 0.30, y0: 0.20, x1: 0.70, y1: 0.60 },
  'pier.jpg':      { x0: 0.30, y0: 0.20, x1: 0.70, y1: 0.60 },
};

export const DEFAULT_FACE = { x0: 0.30, y0: 0.15, x1: 0.70, y1: 0.55 };

export function faceBoxFor(file) {
  return FACE_BOXES[file] || DEFAULT_FACE;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Pick the source rectangle (fractions of the image) that cover-fills a panel
 * of aspect panelW/panelH while keeping the whole face box visible.
 * biasY (0..1) places the face-box centre at that height of the window:
 * 0.5 centres it; 0.36 (hero) leaves the lower third of the frame free for
 * the title. slantInset (0..0.2) shrinks the usable panel width for slanted
 * panels, so the crop is computed against the inscribed rectangle and no
 * face is ever split by a diagonal seam.
 * Returns { sx, sy, sw, sh } in image fractions.
 */
export function faceAwareCrop(imgW, imgH, panelW, panelH, face, biasY = 0.5, slantInset = 0) {
  const ia = imgW / imgH;
  const effW = panelW * (1 - 2 * slantInset);
  const pa = effW / panelH; // aspect the source rect must have, in pixels
  // Minimal cover rect (sw/sh = pa/ia in fractions).
  let sw = pa > ia ? 1 : pa / ia;
  let sh = pa > ia ? ia / pa : 1;
  // Grow it until the whole face box (plus a margin) fits.
  const needW = (face.x1 - face.x0) * 1.16;
  const needH = (face.y1 - face.y0) * 1.16;
  if (sw < needW) { sw = Math.min(1, needW); sh = (sw * ia) / pa; }
  if (sh < needH) { sh = Math.min(1, needH); sw = (sh * pa) / ia; }
  if (sh > 1) { sh = 1; sw = (sh * pa) / ia; }
  if (sw > 1) { sw = 1; sh = (sw * ia) / pa; }
  // Position: face-box centre at biasY of the window, clamped so the whole
  // face box stays inside the window.
  const fcx = (face.x0 + face.x1) / 2;
  const fcy = (face.y0 + face.y1) / 2;
  let sx = clamp(fcx - sw / 2, 0, 1 - sw);
  let sy = fcy - biasY * sh;
  sy = clamp(sy, Math.max(0, face.y1 - sh), Math.min(face.y0, 1 - sh));
  sy = clamp(sy, 0, 1 - sh);
  sx = clamp(sx, 0, 1 - sw);
  return { sx, sy, sw, sh };
}

/**
 * Apply a user's zoom / pan on top of a base crop. zoom > 1 zooms in.
 * Pan is in fractions of the (zoomed) window. The result is clamped to the
 * image and never lets the face box leave the window.
 */
export function applyCropAdjust(base, zoom, panX, panY, face) {
  const sw = base.sw / zoom;
  const sh = base.sh / zoom;
  const bcx = base.sx + base.sw / 2;
  const bcy = base.sy + base.sh / 2;
  let cx = clamp(bcx + panX * sw, sw / 2, 1 - sw / 2);
  let cy = clamp(bcy + panY * sh, sh / 2, 1 - sh / 2);
  // Keep the face box inside: the window must still cover it.
  const fx0 = face.x0 - 0.02, fx1 = face.x1 + 0.02;
  const fy0 = face.y0 - 0.02, fy1 = face.y1 + 0.02;
  if (sw >= fx1 - fx0) cx = clamp(cx, fx0 + sw / 2, fx1 - sw / 2);
  if (sh >= fy1 - fy0) cy = clamp(cy, fy0 + sh / 2, fy1 - sh / 2);
  cx = clamp(cx, sw / 2, 1 - sw / 2);
  cy = clamp(cy, sh / 2, 1 - sh / 2);
  return { sx: cx - sw / 2, sy: cy - sh / 2, sw, sh };
}
