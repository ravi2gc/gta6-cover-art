// Sunset Cover drawing engine: multi-panel GTA-style poster art, drawn entirely
// with the canvas 2D API. No Rockstar artwork, logo or font is used anywhere:
// lettering is Anton (SIL OFL, shipped under app/fonts), UI type is Oswald,
// and every palm, sun, ray, bird and halftone dot is drawn by the code below.

export const LAYOUTS = ['hero', 'grid', 'stack', 'full'];
export const GRADES = ['sunset', 'neon', 'golden', 'noir', 'dusk'];
export const SIZES = ['1080x1080', '1080x1350', '1920x1080'];

/** How many panels a layout has. */
export function panelCount(layout) {
  if (layout === 'hero' || layout === 'grid') return 4;
  if (layout === 'stack') return 3;
  return 1;
}

/** Colour grades: a canvas filter plus the tint gradient painted over each photo. */
export const GRADE_DEFS = {
  sunset: {
    filter: 'saturate(1.4) contrast(1.1) brightness(1.03)',
    tint: ['rgba(255, 47, 120, 0.34)', 'rgba(255, 122, 26, 0.22)', 'rgba(255, 210, 61, 0.14)'],
    sky: ['#ff5e7a', '#ff9a3d', '#ffd23d'],
    sun: ['#fff3a0', '#ff9a3d', '#ff2f7a'],
    accent: '#ff2fb3',
  },
  neon: {
    filter: 'saturate(1.65) contrast(1.14) hue-rotate(-14deg)',
    tint: ['rgba(0, 229, 199, 0.30)', 'rgba(255, 47, 179, 0.26)', 'rgba(123, 92, 255, 0.30)'],
    sky: ['#00e5c7', '#7b5cff', '#ff2fb3'],
    sun: ['#aefcff', '#00e5c7', '#ff2fb3'],
    accent: '#00e5c7',
  },
  golden: {
    filter: 'sepia(0.28) saturate(1.35) contrast(1.06) brightness(1.05)',
    tint: ['rgba(255, 179, 71, 0.28)', 'rgba(255, 243, 160, 0.18)', 'rgba(255, 122, 26, 0.16)'],
    sky: ['#ffb347', '#ffd23d', '#fff3a0'],
    sun: ['#fffbe0', '#ffd23d', '#ff7a1a'],
    accent: '#ffb347',
  },
  noir: {
    filter: 'grayscale(1) contrast(1.28) brightness(0.96)',
    tint: ['rgba(255, 255, 255, 0.10)', 'rgba(0, 0, 0, 0.12)', 'rgba(120, 140, 180, 0.14)'],
    sky: ['#3a3a44', '#101018', '#e8e8e8'],
    sun: ['#ffffff', '#c9c9d6', '#5a5a6a'],
    accent: '#e8e8e8',
  },
  dusk: {
    filter: 'saturate(1.15) contrast(1.12) brightness(0.9) hue-rotate(18deg)',
    tint: ['rgba(123, 92, 255, 0.34)', 'rgba(255, 94, 122, 0.24)', 'rgba(27, 16, 53, 0.30)'],
    sky: ['#7b5cff', '#ff5e7a', '#1b1035'],
    sun: ['#ffd23d', '#ff5e7a', '#7b5cff'],
    accent: '#7b5cff',
  },
};

/**
 * Panel rectangles for a layout, as fractions of the canvas, with a thin
 * comic-book gutter between them. `role` marks the panel that carries the
 * sun, palms and halftone treatment.
 */
export function layoutPanels(layout, w, h) {
  const g = 0.014; // gutter, as a fraction of the short side, in both axes
  const gx = g * Math.min(w, h);
  const gy = g * Math.min(w, h);
  const R = (x, y, pw, ph, role) => ({ x: x * w, y: y * h, w: pw * w, h: ph * h, role });
  if (layout === 'hero') {
    const split = 0.64;
    return [
      R(0, 0, 1, split, 'hero'),
      R(0, split, 1 / 3, 1 - split, 'strip'),
      R(1 / 3, split, 1 / 3, 1 - split, 'strip'),
      R(2 / 3, split, 1 / 3, 1 - split, 'strip'),
    ];
  }
  if (layout === 'grid') {
    return [
      R(0, 0, 0.5, 0.5, 'hero'),
      R(0.5, 0, 0.5, 0.5, 'cell'),
      R(0, 0.5, 0.5, 0.5, 'cell'),
      R(0.5, 0.5, 0.5, 0.5, 'cell'),
    ];
  }
  if (layout === 'stack') {
    return [
      R(0, 0, 1, 0.42, 'hero'),
      R(0, 0.42, 1, 0.29, 'band'),
      R(0, 0.71, 1, 0.29, 'band'),
    ];
  }
  return [R(0, 0, 1, 1, 'full')];
}

/** Draws one palm-tree silhouette: a curved trunk and drooping fronds. */
export function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(lean, 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // Trunk: a tapering curved quad.
  ctx.beginPath();
  ctx.moveTo(-s * 0.045, 0);
  ctx.quadraticCurveTo(s * 0.02, -s * 0.5, s * 0.10, -s * 0.92);
  ctx.lineTo(s * 0.17, -s * 0.90);
  ctx.quadraticCurveTo(s * 0.09, -s * 0.48, s * 0.06, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds: seven arcs fanning from the crown, each a tapering leaf that
  // rises then droops toward its tip.
  const crownX = s * 0.13;
  const crownY = -s * 0.92;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.06 + (i / 6) * 0.88);
    const len = s * (0.40 + (i % 2) * 0.07);
    const tipX = crownX + Math.cos(a) * len;
    const tipY = crownY - Math.sin(a) * len * 0.38 + len * 0.42;
    const midX = crownX + Math.cos(a) * len * 0.55;
    const midY = crownY - Math.sin(a) * len * 0.42;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY - s * 0.04, tipX, tipY);
    ctx.quadraticCurveTo(midX + s * 0.015, midY + s * 0.05, crownX, crownY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** A retro striped sun disc with faint rays, drawn in the hero panel. */
export function drawSun(ctx, cx, cy, r, colors, striped) {
  ctx.save();
  // Rays.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = Math.max(2, r * 0.03);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r * 1.15);
    ctx.lineTo(cx + Math.cos(a) * r * 1.9, cy + Math.sin(a) * r * 1.9);
    ctx.stroke();
  }
  // Disc.
  const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.55, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (striped) {
    // Horizontal slats cut across the lower half, widening toward the base.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(20, 8, 31, 0.28)';
    let y = cy + r * 0.08;
    let th = r * 0.05;
    while (y < cy + r) {
      ctx.fillRect(cx - r, y, r * 2, th);
      y += th + r * 0.13;
      th += r * 0.03;
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Halftone dots growing toward one corner of a panel. */
export function drawHalftone(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(10, Math.min(w, h) * 0.045);
  for (let gy = 0; gy * step < h * 0.55; gy++) {
    for (let gx = 0; gx * step < w * 0.5; gx++) {
      const d = Math.hypot(gx / Math.max(1, (w * 0.5) / step), gy / Math.max(1, (h * 0.55) / step));
      const r = Math.max(0.6, step * 0.22 * (1.25 - d));
      ctx.globalAlpha = 0.5 * (1.15 - d);
      ctx.beginPath();
      ctx.arc(x + gx * step, y + gy * step, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A few small birds in the sky of the hero panel. */
export function drawBirds(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.02);
  ctx.lineCap = 'round';
  const spots = [[0.06, 0.05, 0.9], [0.16, 0.11, 0.7], [0.26, 0.05, 1.0], [0.34, 0.12, 0.65]];
  for (const [fx, fy, k] of spots) {
    const bx = x + fx * s;
    const by = y + fy * s;
    const w = s * 0.05 * k;
    ctx.beginPath();
    ctx.moveTo(bx - w, by);
    ctx.quadraticCurveTo(bx - w * 0.4, by - w * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + w * 0.4, by - w * 0.7, bx + w, by);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws one panel: the photo (cover or fit, with zoom and pan), the grade,
 * and the code-drawn poster treatment. `panel` is {photo, zoom, ox, oy, fit}.
 */
export function drawPanel(ctx, rect, img, panel, grade) {
  const { x, y, w, h, role } = rect;
  const def = GRADE_DEFS[grade] || GRADE_DEFS.sunset;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const zoom = panel.zoom || 1;
    if (panel.fit === 'fit') {
      // Show the whole photo: a blurred, darkened cover-fit backdrop fills
      // the panel (the classic poster trick for a portrait in a wide frame),
      // then the full photo sits sharp on top of it.
      const coverScale = Math.max(w / iw, h / ih);
      ctx.filter = def.filter + ' blur(' + Math.round(Math.min(w, h) * 0.045) + 'px) brightness(0.55)';
      ctx.drawImage(img, x + (w - iw * coverScale) / 2, y + (h - ih * coverScale) / 2, iw * coverScale, ih * coverScale);
      ctx.filter = 'none';
      const fitScale = Math.min(w / iw, h / ih) * zoom;
      const dw = iw * fitScale;
      const dh = ih * fitScale;
      const dx = x + (w - dw) / 2 + (panel.ox || 0) * w;
      const dy = y + (h - dh) / 2 + (panel.oy || 0) * h;
      ctx.filter = def.filter;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
    } else {
      const base = Math.max(w / iw, h / ih);
      const s = base * zoom;
      const dw = iw * s;
      const dh = ih * s;
      const dx = x + (w - dw) / 2 + (panel.ox || 0) * w;
      // Very wide panel, photo narrower than the panel: the cover crop is
      // a thin horizontal slice of the photo, so anchor it near the top
      // of the photo (8% down) so the subject's head stays in frame —
      // unless the panel already carries an explicit vertical pan. The
      // nudge is computed from the panel and photo at draw time, so it is
      // right at every export size: a fixed pan that fits one size slides
      // a square photo past the panel edge at another size and leaves a
      // dark strip. The 8% anchor can never do that — the window's top
      // edge is inside the photo by construction.
      let oy = panel.oy || 0;
      if (oy === 0 && w / h > 2 && iw / ih < w / h) {
        const visible = h / dh; // fraction of the photo height on show
        oy = Math.max(0, (0.42 - visible / 2) / visible);
      }
      const dy = y + (h - dh) / 2 + oy * h;
      ctx.filter = def.filter;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
    }
  } else {
    // Empty panel: a painted sky so the poster still looks finished.
    const sky = ctx.createLinearGradient(x, y, x, y + h);
    sky.addColorStop(0, def.sky[0]);
    sky.addColorStop(0.55, def.sky[1]);
    sky.addColorStop(1, def.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
  }
  // Grade tint wash.
  const tint = ctx.createLinearGradient(x, y, x, y + h);
  tint.addColorStop(0, def.tint[0]);
  tint.addColorStop(0.55, def.tint[1]);
  tint.addColorStop(1, def.tint[2]);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  // Vignette.
  const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,20,0.32)');
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);
  // Poster treatment on the hero / full panel.
  if (role === 'hero' || role === 'full') {
    const striped = grade !== 'noir';
    drawSun(ctx, x + w * 0.82, y + h * 0.20, Math.min(w, h) * 0.13, def.sun, striped);
    drawHalftone(ctx, x + w * 0.03, y + h * 0.04, w * 0.5, h * 0.5, 'rgba(255,255,255,0.55)');
    drawBirds(ctx, x + w * 0.05, y + h * 0.05, Math.min(w, h), 'rgba(20,8,31,0.75)');
    const palmH = Math.min(w, h) * 0.36;
    drawPalm(ctx, x + w * 0.05, y + h * 0.99, palmH, 1, 'rgba(16,6,26,0.92)');
    drawPalm(ctx, x + w * 0.95, y + h * 0.99, palmH * 0.8, -1, 'rgba(16,6,26,0.92)');
  }
  ctx.restore();
  // Comic outline: a hard white edge with a dark offset shadow.
  ctx.save();
  ctx.strokeStyle = 'rgba(10,4,20,0.85)';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.012);
  ctx.strokeRect(x + Math.min(w, h) * 0.006, y + Math.min(w, h) * 0.006, w, h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.008);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/** Wraps `text` into at most two lines that fit `maxWidth` at `font`. */
export function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = word;
      if (lines.length === 2) break;
    }
  }
  if (line && lines.length < 2) lines.push(line);
  return lines;
}

/** Draws the kicker and caption with outlined condensed lettering. */
export function drawCaption(ctx, w, h, state) {
  const text = (state.caption || '').trim().toUpperCase();
  const kicker = (state.kicker || '').trim().toUpperCase();
  if (!text && !kicker) return;
  const sizeScale = state.captionSize || 1;
  let size = h * 0.115 * sizeScale;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = (s) => { ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`; };
  setFont(size);
  if (text) {
    const lines = wrapCaption(ctx, text, w * 0.92);
    while (lines.some((l) => ctx.measureText(l).width > w * 0.92) && size > 14) {
      size -= 2;
      setFont(size);
    }
  }
  const lineH = size * 1.04;
  const capLines = text ? wrapCaption(ctx, text, w * 0.92) : [];
  const kickerSize = Math.max(12, size * 0.26);
  const blockH = capLines.length * lineH + (kicker ? kickerSize * 1.9 : 0);
  let top;
  if (state.captionPos === 'top') top = h * 0.045;
  else if (state.captionPos === 'middle') top = h * 0.5 - blockH / 2;
  else top = h - blockH - h * 0.035;
  top += (state.captionY || 0) * h;
  // Legibility scrim behind the lettering.
  const scrim = ctx.createLinearGradient(0, top - lineH * 0.35, 0, top + blockH + lineH * 0.35);
  scrim.addColorStop(0, 'rgba(10,4,20,0)');
  scrim.addColorStop(0.5, 'rgba(10,4,20,0.55)');
  scrim.addColorStop(1, 'rgba(10,4,20,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, top - lineH * 0.35, w, blockH + lineH * 0.7);
  ctx.save();
  ctx.translate(w / 2, top + blockH / 2);
  ctx.rotate(-0.02);
  ctx.translate(-w / 2, -(top + blockH / 2));
  let cy = top;
  if (kicker) {
    ctx.font = `600 ${kickerSize}px Oswald, sans-serif`;
    try { ctx.letterSpacing = '8px'; } catch { /* older canvas: ignore */ }
    ctx.lineWidth = Math.max(2, kickerSize * 0.18);
    ctx.strokeStyle = 'rgba(10,4,20,0.9)';
    ctx.lineJoin = 'round';
    ctx.strokeText(kicker, w / 2, cy + kickerSize);
    ctx.fillStyle = '#ffd23d';
    ctx.fillText(kicker, w / 2, cy + kickerSize);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
    cy += kickerSize * 1.9;
  }
  for (const line of capLines) {
    setFont(size);
    const baseline = cy + size * 0.92;
    ctx.lineWidth = state.outline === false ? 0 : size * 0.17;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = state.captionFill === 'ink' ? '#ffffff' : 'rgba(10,4,20,0.95)';
    if (ctx.lineWidth > 0) ctx.strokeText(line, w / 2, baseline);
    if (state.captionFill === 'white') {
      ctx.fillStyle = '#ffffff';
    } else if (state.captionFill === 'ink') {
      ctx.fillStyle = '#1a0b26';
    } else {
      const g = ctx.createLinearGradient(w / 2 - ctx.measureText(line).width / 2, 0, w / 2 + ctx.measureText(line).width / 2, 0);
      g.addColorStop(0, '#ffd23d');
      g.addColorStop(0.5, '#ff7a1a');
      g.addColorStop(1, '#ff2fb3');
      ctx.fillStyle = g;
    }
    ctx.fillText(line, w / 2, baseline);
    cy += lineH;
  }
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * `photos` is an array of images; `state` carries layout, grade, caption,
 * per-panel crop settings and the one-photo flag.
 */
export function drawCover(canvas, photos, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);
  const panels = layoutPanels(state.layout || 'hero', w, h);
  const fallback = state.onePhoto ? 0 : null;
  panels.forEach((rect, i) => {
    const cfg = (state.panels && state.panels[i]) || {};
    let photoIdx = cfg.photo;
    if (photoIdx === undefined || photoIdx === null) photoIdx = fallback;
    if (photoIdx === null) photoIdx = i % Math.max(1, photos.length);
    const img = photoIdx !== null && photoIdx !== undefined && photos[photoIdx] ? photos[photoIdx] : null;
    drawPanel(ctx, rect, img, {
      zoom: cfg.zoom || 1,
      ox: cfg.ox || 0,
      oy: cfg.oy || 0,
      fit: cfg.fit || 'cover',
    }, state.grade || 'sunset');
  });
  // Poster frame: thick ink edge, thin gold inner rule.
  ctx.save();
  ctx.strokeStyle = '#14081f';
  ctx.lineWidth = Math.max(6, Math.min(w, h) * 0.014);
  ctx.strokeRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255, 210, 61, 0.8)';
  ctx.lineWidth = Math.max(1.5, Math.min(w, h) * 0.003);
  ctx.strokeRect(Math.min(w, h) * 0.012, Math.min(w, h) * 0.012, w - Math.min(w, h) * 0.024, h - Math.min(w, h) * 0.024);
  ctx.restore();
  drawCaption(ctx, w, h, state);
}
