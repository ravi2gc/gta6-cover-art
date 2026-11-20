// Draws the whole cover onto a canvas: the layout's panels with their photos
// (each cropped, panned and rotated on its own), the grade treatment, the bold
// title and subtitle, and the callout labels with their leader lines.
import { layoutById } from './layouts.js';
import { gradeById } from './grades.js';

/** Deterministic noise: the same seed gives the same grain every render. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128; tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  const rnd = mulberry32(20261120);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

/** Draws one photo into one panel rect, honouring its zoom, pan and rotation.
 * face is the photo's measured face span [top, bottom] as fractions of the
 * photo height (or null for an unmeasured photo); faceSafeBottom is the
 * panel fraction faces must stay above (1 when the layout reserves a title
 * band below the panels, ~0.68 when the title sits over the photo). */
function drawPhoto(ctx, photo, rect, crop, face, faceSafeBottom) {
  const px = rect.x, py = rect.y, pw = rect.w, ph = rect.h;
  ctx.save();
  ctx.beginPath();
  if (rect.poly) {
    rect.poly.forEach(([fx, fy], i) => {
      const x = px + fx * pw, y = py + fy * ph;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.clip();
  if (photo) {
    const iw = photo.naturalWidth, ih = photo.naturalHeight;
    const base = Math.max(pw / iw, ph / ih) * (crop?.zoom ?? 1);
    const dw = iw * base, dh = ih * base;
    const cx = px + pw / 2 + (crop?.ox ?? 0) * pw;
    // Vertical framing. A wide panel cropping a tall portrait used to centre
    // on the torso and behead the subject, so the crop window is now placed
    // on the face: when the face span is known, the window is centred on it
    // (or, when the face is taller than the window, the chin is put just
    // above the safe bottom while the eyes stay in frame). The user can
    // still pan freely from there. Without a measured span the previous
    // mild top bias applies.
    let cy;
    if (face && dh > ph) {
      const [faceTop, faceBottom] = face;
      const faceCentre = (faceTop + faceBottom) / 2;
      const winH = ph / dh; // fraction of the photo the panel shows
      const safeBottom = faceSafeBottom ?? 1;
      let t; // window top, as a fraction of the photo height
      if (faceBottom - faceTop > winH) {
        t = faceBottom - (safeBottom - 0.05) * winH;
        t = Math.min(t, faceCentre - 0.03 * winH);
      } else {
        t = faceCentre - (safeBottom / 2) * winH;
      }
      t = Math.max(0, Math.min(1 - winH, t));
      cy = py + dh / 2 - t * dh + (crop?.oy ?? 0) * ph;
    } else {
      const faceBias = Math.max(0, Math.min(0.15, (pw / ph - 1.2) * 0.08));
      cy = py + ph / 2 + (crop?.oy ?? 0) * ph + (dh > ph ? (dh - ph) * faceBias : 0);
    }
    ctx.translate(cx, cy);
    ctx.rotate(((crop?.rot ?? 0) * Math.PI) / 180);
    ctx.drawImage(photo, -dw / 2, -dh / 2, dw, dh);
  } else {
    ctx.fillStyle = '#2a1638';
    ctx.fillRect(px, py, pw, ph);
  }
  ctx.restore();
  // Hairline seam between panels.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = Math.max(1, pw * 0.003);
  ctx.beginPath();
  if (rect.poly) {
    rect.poly.forEach(([fx, fy], i) => {
      const x = px + fx * pw, y = py + fy * ph;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.stroke();
  ctx.restore();
}

/** Draws the title and subtitle, auto-fitting the title to the canvas width.
 * Layouts with a title band centre the caption in the band; the others keep
 * the caption at titleY over the photo. */
function drawCaption(ctx, W, H, layout, title, subtitle) {
  const text = (title || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  const cy = H * (layout.titleBand ? 1 - layout.titleBand / 2 : layout.titleY);
  if (text) {
    let size = H * 0.115 * layout.titleScale;
    ctx.font = `900 ${size}px ViceCondensed, 'Arial Narrow', sans-serif`;
    while (ctx.measureText(text).width > W * 0.92 && size > 18) {
      size -= 2;
      ctx.font = `900 ${size}px ViceCondensed, 'Arial Narrow', sans-serif`;
    }
    ctx.save();
    ctx.translate(W / 2, cy);
    ctx.rotate(-0.035);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeStyle = 'rgba(20, 4, 32, 0.9)';
    ctx.lineWidth = size * 0.14;
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);
    ctx.restore();
    if (sub) {
      const subSize = Math.max(14, size * 0.22);
      ctx.save();
      ctx.font = `700 ${subSize}px ViceBold, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${subSize * 0.42}px`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = subSize * 0.3;
      ctx.fillStyle = '#ffc93c';
      ctx.fillText(sub, W / 2, cy + size * 0.62);
      ctx.restore();
    }
  }
}

/** Draws one callout: a leader line from its anchor to its label chip. */
function drawCallout(ctx, W, H, callout) {
  const ax = callout.ax * W, ay = callout.ay * H;
  const lx = callout.lx * W, ly = callout.ly * H;
  const pad = H * 0.012;
  ctx.save();
  ctx.font = `700 ${Math.max(13, H * 0.016)}px ViceBold, sans-serif`;
  const tw = ctx.measureText(callout.text).width;
  const th = H * 0.016 * 2 + pad;
  const bx = Math.min(Math.max(lx - tw / 2 - pad, pad), W - tw - pad * 2 - pad);
  const by = Math.min(Math.max(ly - th / 2, pad), H - th - pad);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(1.5, H * 0.002);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx + tw / 2 + pad, by + th / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = '#ffc93c';
  ctx.arc(ax, ay, Math.max(3, H * 0.004), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(16, 4, 28, 0.88)';
  ctx.strokeStyle = 'rgba(255, 201, 60, 0.9)';
  ctx.lineWidth = Math.max(1, H * 0.0015);
  ctx.beginPath();
  ctx.roundRect(bx, by, tw + pad * 2, th, th / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(callout.text, bx + tw / 2 + pad, by + th / 2 + 1);
  ctx.restore();
}

/**
 * Draws the cover described by `state` onto `canvas` at its own size.
 * state: { layout, grade, title, subtitle, photos, panels, callouts }.
 * photos are HTMLImageElements (or null); panels[i] is { photo, zoom, ox, oy, rot }.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#160a20';
  ctx.fillRect(0, 0, W, H);

  const rects = placedRects(layout, W, H);
  // Faces must stay above the title: the whole panel when the layout
  // reserves a title band below the panels, the top ~68% when the title
  // sits over the photo itself (single-panel layouts).
  const faceSafeBottom = layout.titleBand ? 1 : 0.68;
  rects.forEach((rect, i) => {
    const crop = state.panels?.[i];
    const entry = crop && crop.photo != null ? state.photos?.[crop.photo] : null;
    const photo = entry && 'img' in entry ? entry.img : entry;
    drawPhoto(ctx, photo ?? null, rect, crop, entry && 'face' in entry ? entry.face : null, faceSafeBottom);
  });

  if (layout.frame) {
    ctx.save();
    const m = W * 0.025;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);
    ctx.strokeStyle = 'rgba(255, 201, 60, 0.9)';
    ctx.lineWidth = Math.max(1, W * 0.0015);
    ctx.strokeRect(m * 1.7, m * 1.7, W - m * 3.4, H - m * 3.4);
    ctx.restore();
  }

  // Colour grade: light wash, colour wash, vignette, grain.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.save();
  ctx.globalCompositeOperation = grade.washBlend;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = grade.tintBlend;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(
    W / 2, H * 0.45, Math.min(W, H) * 0.42,
    W / 2, H * 0.5, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, `rgba(0, 0, 0, ${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  if (grade.grain > 0) {
    ctx.save();
    ctx.globalAlpha = grade.grain;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Readability scrim behind the caption, then the caption itself. Layouts
  // with a title band put the whole caption in the band; the others keep the
  // scrim over the lower part of the photo.
  const band = layout.titleBand ?? 0;
  const scrimTop = band ? H * (1 - band) : H * (layout.titleY - 0.14);
  const scrim = ctx.createLinearGradient(0, scrimTop, 0, H);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, scrimTop, W, H - scrimTop);
  drawCaption(ctx, W, H, layout, state.title, state.subtitle);

  (state.callouts ?? []).forEach((c) => drawCallout(ctx, W, H, c));
}

/** The layout's panel rects in canvas pixels. Layouts with a title band
 * draw their panels only in the area above the band. */
function placedRects(layout, W, H) {
  const band = layout.titleBand ?? 0;
  return layout.rects(W, H).map((r) => ({
    ...r,
    x: r.x * W,
    y: r.y * H * (1 - band),
    w: r.w * W,
    h: r.h * H * (1 - band),
  }));
}

/** Hit-tests a point (canvas pixels) against the layout's panels; -1 when none. */
export function panelAt(state, W, H, px, py) {
  const layout = layoutById(state.layout);
  const rects = placedRects(layout, W, H);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

/** Hit-tests a point against callout label chips; -1 when none. */
export function calloutAt(state, W, H, px, py) {
  const callouts = state.callouts ?? [];
  for (let i = callouts.length - 1; i >= 0; i--) {
    const c = callouts[i];
    const lx = c.lx * W, ly = c.ly * H;
    if (Math.abs(px - lx) < W * 0.09 && Math.abs(py - ly) < H * 0.03) return i;
  }
  return -1;
}
