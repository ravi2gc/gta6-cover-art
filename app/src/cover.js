// Palm Fever cover renderer: draws the whole multi-panel poster onto any canvas
// at any export size. All art is code-drawn (striped retro sun, palm silhouettes,
// halftone dots, birds, barcode, gold seal) — no Rockstar logo, artwork or font.
// Fonts are the local OFL files under app/fonts (Anton, Pacifico, Oswald).

export const LAYOUTS = [
  { id: 'cast', name: 'Cast grid · 6 panels', panels: 6 },
  { id: 'collage', name: 'Collage · big portrait', panels: 4 },
  { id: 'grid', name: 'Grid · 2 × 2', panels: 4 },
  { id: 'stack', name: 'Stack · 3 panels', panels: 3 },
  { id: 'hero', name: 'Hero · full bleed', panels: 1 },
];

export const GRADES = [
  { id: 'sunset', name: 'Vice City Sunset', filter: 'saturate(1.35) contrast(1.08) sepia(0.22)', tint: ['#ff9a3d', '#ff4d8d'], tintAlpha: 0.20, blend: 'overlay' },
  { id: 'neon', name: 'Neon Nights', filter: 'saturate(1.55) contrast(1.12) hue-rotate(-18deg)', tint: ['#ff2fb3', '#7b2ff7'], tintAlpha: 0.22, blend: 'overlay' },
  { id: 'golden', name: 'Golden Hour', filter: 'saturate(1.25) contrast(1.05) sepia(0.38) brightness(1.04)', tint: ['#ffc93d', '#ff7a3d'], tintAlpha: 0.18, blend: 'soft-light' },
  { id: 'noir', name: 'Noir', filter: 'grayscale(1) contrast(1.22) brightness(1.02)', tint: ['#8a7bd8', '#1c0b2e'], tintAlpha: 0.16, blend: 'overlay' },
  { id: 'dusk', name: 'Palm Dusk', filter: 'saturate(1.2) contrast(1.1) hue-rotate(12deg)', tint: ['#7b2ff7', '#ff4d8d'], tintAlpha: 0.24, blend: 'overlay' },
  { id: 'magenta', name: 'Magenta Rush', filter: 'saturate(1.65) contrast(1.1) hue-rotate(-28deg)', tint: ['#ff2f92', '#ff7a3d'], tintAlpha: 0.20, blend: 'overlay' },
];

export const SIZES = [
  { id: '1920x1080', w: 1920, h: 1080, name: '1920 × 1080 · landscape' },
  { id: '1080x1080', w: 1080, h: 1080, name: '1080 × 1080 · square' },
  { id: '1080x1350', w: 1080, h: 1350, name: '1080 × 1350 · portrait' },
];

const INK = '#1c0b2e';
const GOLD = '#f7c948';
const PINK = '#ff4d8d';
const CREAM = '#fff6e8';

/** Panel rectangles for a layout, in pixels, inside the poster frame. */
export function layoutRects(layoutId, W, H) {
  const frame = W * 0.014;
  const gap = W * 0.007;
  const topH = H * 0.062;
  const footH = H * 0.052;
  const ax = frame + gap;
  const ay = topH + gap * 0.6;
  const aw = W - 2 * (frame + gap);
  const ah = H - topH - footH - gap;
  const cell = (fx, fy, fw, fh) => ({ x: ax + fx * aw, y: ay + fy * ah, w: fw * aw, h: fh * ah });
  const g = gap / aw;
  const gy = gap / ah;
  if (layoutId === 'cast') {
    const cw = (1 - 2 * g) / 3;
    const rh = (1 - gy) / 2;
    return [
      cell(0, 0, cw, rh), cell(cw + g, 0, cw, rh), cell(2 * (cw + g), 0, cw, rh),
      cell(0, rh + gy, cw, rh), cell(cw + g, rh + gy, cw, rh), cell(2 * (cw + g), rh + gy, cw, rh),
    ];
  }
  if (layoutId === 'collage') {
    const lw = 0.52 - g / 2;
    const rw = 1 - lw - g;
    const rh = 0.52 - gy / 2;
    return [
      cell(0, 0, lw, 1),
      cell(lw + g, 0, rw, rh),
      cell(lw + g, rh + gy, rw / 2 - g / 2, 1 - rh - gy),
      cell(lw + g + rw / 2 + g / 2, rh + gy, rw / 2 - g / 2, 1 - rh - gy),
    ];
  }
  if (layoutId === 'grid') {
    const cw = (1 - g) / 2;
    const rh = (1 - gy) / 2;
    return [cell(0, 0, cw, rh), cell(cw + g, 0, cw, rh), cell(0, rh + gy, cw, rh), cell(cw + g, rh + gy, cw, rh)];
  }
  if (layoutId === 'stack') {
    const rh = (1 - 2 * gy) / 3;
    return [cell(0, 0, 1, rh), cell(0, rh + gy, 1, rh), cell(0, 2 * (rh + gy), 1, rh)];
  }
  return [cell(0, 0, 1, 1)]; // hero
}

/** Where the big title block sits for a layout (fraction of the panel area). */
function titleZone(layoutId, area) {
  if (layoutId === 'cast') return { cx: area.x + area.w / 2, cy: area.y + area.h * 0.52, maxW: area.w * 0.99 };
  if (layoutId === 'collage') return { cx: area.x + area.w / 2, cy: area.y + area.h * 0.58, maxW: area.w * 0.98 };
  if (layoutId === 'grid') return { cx: area.x + area.w / 2, cy: area.y + area.h * 0.55, maxW: area.w * 0.99 };
  if (layoutId === 'stack') return { cx: area.x + area.w / 2, cy: area.y + area.h * 0.62, maxW: area.w * 0.98 };
  return { cx: area.x + area.w / 2, cy: area.y + area.h * 0.72, maxW: area.w * 0.97 }; // hero
}

function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

function drawPanelPhoto(ctx, rect, panel, grade, forceWhole = false) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!panel || !panel.img) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#3d1a5e');
    g.addColorStop(1, '#12041f');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    drawRetroSun(ctx, rect.x + rect.w * 0.5, rect.y + rect.h * 0.42, Math.min(rect.w, rect.h) * 0.26, 0.5);
    ctx.fillStyle = 'rgba(255,246,232,0.85)';
    ctx.font = `700 ${Math.max(14, rect.h * 0.05)}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.78);
  } else {
    const img = panel.img;
    const zoom = panel.zoom || 1;
    // Show-whole (and the stack layout, whose strips are far wider than any
    // portrait): a blurred cover of the same photo backs the whole photo.
    const whole = forceWhole || panel.fit === 'whole';
    if (whole) {
      const cover = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
      ctx.filter = `${grade.filter} blur(${Math.max(12, rect.h * 0.06)}px) brightness(0.55)`;
      ctx.drawImage(img, rect.x + (rect.w - img.naturalWidth * cover) / 2, rect.y + (rect.h - img.naturalHeight * cover) / 2, img.naturalWidth * cover, img.naturalHeight * cover);
      ctx.filter = 'none';
    }
    const base = whole
      ? Math.min(rect.w / img.naturalWidth, rect.h / img.naturalHeight)
      : Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const s = whole ? base : base * zoom;
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    const dx = rect.x + (rect.w - dw) / 2 + (panel.panX || 0) * rect.w * 0.5;
    const dy = rect.y + (rect.h - dh) / 2 + (panel.panY || 0) * rect.h * 0.5;
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    // Warm grade tint, clipped to this panel so every panel grades the same.
    const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    tint.addColorStop(0, grade.tint[0]);
    tint.addColorStop(1, grade.tint[1]);
    ctx.globalAlpha = grade.tintAlpha;
    ctx.globalCompositeOperation = grade.blend;
    ctx.fillStyle = tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // Vignette so faces sit in the light and edges fall away.
    const v = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(20,4,32,0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
  // Gold comic frame around every panel.
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  ctx.strokeStyle = GOLD;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.lineWidth = Math.max(1, rect.w * 0.0015);
  ctx.strokeStyle = 'rgba(28,11,46,0.9)';
  ctx.strokeRect(rect.x + ctx.lineWidth * 2, rect.y + ctx.lineWidth * 2, rect.w - ctx.lineWidth * 4, rect.h - ctx.lineWidth * 4);
}

function drawRoleLabel(ctx, rect, label) {
  if (!label) return;
  const fs = Math.max(13, Math.min(rect.h * 0.062, rect.w * 0.11));
  ctx.save();
  ctx.font = `700 ${fs}px Oswald, sans-serif`;
  const tw = ctx.measureText(label.toUpperCase()).width;
  const padX = fs * 0.55;
  const padY = fs * 0.32;
  const w = tw + padX * 2 + fs * 0.35;
  const h = fs + padY * 2;
  const x = rect.x + rect.w * 0.02;
  const y = rect.y + rect.h - h - rect.h * 0.035;
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.16, 1, 0, 0);
  ctx.fillStyle = 'rgba(10,2,18,0.92)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = PINK;
  ctx.fillRect(0, 0, fs * 0.22, h);
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), fs * 0.35 + padX * 0.5, h / 2 + fs * 0.04);
  ctx.restore();
}

/** Striped retro sun: a circle cut by horizontal gaps, drawn in code. */
export function drawRetroSun(ctx, cx, cy, r, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#ffe95c');
  g.addColorStop(0.5, '#ff7a3d');
  g.addColorStop(1, '#ff4d8d');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Cut the lower half into stripes.
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.05;
  let h = r * 0.06;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, h);
    y += h * 2.4;
    h *= 1.25;
  }
  ctx.restore();
}

/** A palm silhouette: curved trunk plus five drooping fronds. */
export function drawPalm(ctx, x, y, s, color = '#12041f') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -55, 26, -95);
  ctx.stroke();
  ctx.lineWidth = 5;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.08 + i * 0.21);
    const tx = 26 + Math.cos(a) * 52;
    const ty = -95 + Math.sin(a) * 34 + (i === 2 ? -16 : 6);
    ctx.beginPath();
    ctx.moveTo(26, -95);
    ctx.quadraticCurveTo(26 + Math.cos(a) * 30, -95 + Math.sin(a) * 30 - 12, tx, ty);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBirds(ctx, x, y, s, color = 'rgba(28,11,46,0.85)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const bx = x + i * s * 1.1;
    const by = y + (i % 2) * s * 0.35;
    ctx.beginPath();
    ctx.moveTo(bx - s * 0.28, by);
    ctx.quadraticCurveTo(bx - s * 0.1, by - s * 0.22, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.1, by - s * 0.22, bx + s * 0.28, by);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHalftone(ctx, x, y, w, h, color = 'rgba(255,77,141,0.5)') {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(10, w / 9);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 9; c++) {
      const rad = Math.max(1.5, step * 0.22 * (1 - r * 0.2));
      ctx.beginPath();
      ctx.arc(x + c * step, y + r * step, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 6, y - 4, w + 12, h + 16);
  ctx.fillStyle = '#111111';
  let px = x;
  let seed = 1234567;
  while (px < x + w - 3) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const bw = 1 + (seed % 4);
    if (seed % 3 !== 0) ctx.fillRect(px, y, bw, h);
    px += bw + 1 + (seed % 3);
  }
  ctx.font = `400 ${Math.max(8, h * 0.24)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0 02113 122820', x + w / 2, y + h + 8);
  ctx.restore();
}

function drawGoldSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = r * 0.25;
  ctx.shadowOffsetY = r * 0.08;
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = '#8a5a00';
  ctx.lineWidth = Math.max(2, r * 0.04);
  ctx.beginPath();
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.86;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.fillStyle = '#f2b705';
  ctx.fill();
  ctx.strokeStyle = '#8a5a00';
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${r * 0.21}px Oswald, sans-serif`;
  ctx.fillText('ORIGINAL', 0, -r * 0.26);
  ctx.fillText('COVER ART', 0, -r * 0.02);
  ctx.font = `${r * 0.22}px Oswald, sans-serif`;
  ctx.fillText('★ ★ ★', 0, r * 0.3);
  ctx.restore();
}

/** Measures the title size that fits, leaving room for its thick dark outline. */
function fitTitleSize(ctx, text, maxW, maxH) {
  let size = maxH;
  ctx.font = `${size}px Anton, sans-serif`;
  // The outline adds ~11% of the size on each side, so fit the fill to 88%.
  while (ctx.measureText(text).width > maxW * 0.88 && size > 24) {
    size *= 0.94;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

/** The massive striped-gradient title, drawn via an offscreen text layer. */
function drawStripedTitle(ctx, text, cx, cy, maxW, maxH, size) {
  const off = document.createElement('canvas');
  const scale = 2; // supersample the lettering, then draw it back at size
  off.width = Math.ceil(maxW * scale);
  off.height = Math.ceil(maxH * scale);
  const o = off.getContext('2d');
  o.textAlign = 'center';
  o.textBaseline = 'middle';
  o.font = `${size * scale}px Anton, sans-serif`;
  // Vertical sunset gradient across the letters.
  const g = o.createLinearGradient(0, (maxH / 2 - size / 2) * scale, 0, (maxH / 2 + size / 2) * scale);
  g.addColorStop(0, '#fff3a3');
  g.addColorStop(0.28, '#ffd23d');
  g.addColorStop(0.5, '#ff8a3d');
  g.addColorStop(0.72, '#ff4d8d');
  g.addColorStop(1, '#a93df0');
  o.fillStyle = g;
  o.fillText(text, off.width / 2, off.height / 2);
  // Horizontal dark bands cut the letters into retro stripes.
  o.globalCompositeOperation = 'source-atop';
  o.fillStyle = 'rgba(28,11,46,0.55)';
  const band = size * scale * 0.055;
  for (let y = (maxH / 2 - size / 2) * scale + size * scale * 0.18; y < (maxH / 2 + size / 2) * scale; y += size * scale * 0.22) {
    o.fillRect(0, y, off.width, band);
  }
  o.globalCompositeOperation = 'source-over';
  // Back on the poster: thick dark outline, then the striped fill, then a shine.
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = size * 0.11;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.05;
  ctx.strokeText(text, cx, cy);
  ctx.shadowColor = 'transparent';
  ctx.drawImage(off, cx - maxW / 2, cy - maxH / 2, maxW, maxH);
  ctx.restore();
}

function drawScriptSubtitle(ctx, text, cx, y, size) {
  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate(-0.06);
  ctx.font = `${size}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#ff2fb3';
  ctx.shadowBlur = size * 0.35;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.09;
  ctx.strokeText(text, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ff5fb0';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawTaglineBar(ctx, text, cx, y, maxW) {
  ctx.save();
  let fs = Math.max(14, maxW * 0.021);
  ctx.font = `600 ${fs}px Oswald, sans-serif`;
  try { ctx.letterSpacing = `${fs * 0.14}px`; } catch { /* older canvas: no letter-spacing */ }
  // Measure with the letter-spacing on, and shrink until the ribbon fits.
  while (ctx.measureText(text).width > maxW * 0.82 && fs > 12) {
    fs *= 0.94;
    ctx.font = `600 ${fs}px Oswald, sans-serif`;
    try { ctx.letterSpacing = `${fs * 0.14}px`; } catch { /* ignore */ }
  }
  const w = Math.min(maxW * 0.92, ctx.measureText(text).width + fs * 2.6);
  const h = fs * 2.1;
  ctx.fillStyle = 'rgba(10,2,18,0.94)';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + h * 0.4, y - h / 2);
  ctx.lineTo(cx + w / 2 - h * 0.4, y - h / 2);
  ctx.lineTo(cx + w / 2, y);
  ctx.lineTo(cx + w / 2 - h * 0.4, y + h / 2);
  ctx.lineTo(cx - w / 2 + h * 0.4, y + h / 2);
  ctx.lineTo(cx - w / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(1.5, fs * 0.07);
  ctx.stroke();
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${fs * 0.14}px`; } catch { /* older canvas: no letter-spacing */ }
  ctx.fillText(text, cx, y + fs * 0.05);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  ctx.restore();
  return h;
}

/** Draws the full poster. Returns the panel rects (for click selection). */
export function drawCover(canvas, state) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const layout = LAYOUTS.find((l) => l.id === state.layout) || LAYOUTS[0];

  // Deep purple poster ground.
  const ground = ctx.createLinearGradient(0, 0, W, H);
  ground.addColorStop(0, '#2a0f45');
  ground.addColorStop(1, '#160627');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, W, H);

  const frame = W * 0.014;
  const gap = W * 0.007;
  const topH = H * 0.062;
  const footH = H * 0.052;
  const area = { x: frame + gap, y: topH + gap * 0.6, w: W - 2 * (frame + gap), h: H - topH - footH - gap };

  // Quote strip.
  ctx.save();
  ctx.textBaseline = 'middle';
  const qfs = Math.max(13, H * 0.021);
  ctx.font = `600 ${qfs}px Oswald, sans-serif`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'left';
  const stars = '★★★★★';
  ctx.fillText(stars, frame + gap, topH * 0.52);
  const starsW = ctx.measureText(stars).width;
  ctx.fillStyle = CREAM;
  ctx.fillText(`"${(state.quote || '').toUpperCase()}"`, frame + gap + starsW + qfs * 0.8, topH * 0.52);
  const qw = ctx.measureText(`"${(state.quote || '').toUpperCase()}"`).width;
  ctx.fillStyle = 'rgba(255,246,232,0.65)';
  ctx.font = `500 ${qfs * 0.82}px Oswald, sans-serif`;
  ctx.fillText(`— ${(state.quoteSource || '').toUpperCase()}`, frame + gap + starsW + qfs * 0.8 + qw + qfs * 0.6, topH * 0.52);
  // VOL badge.
  const vol = 'VOL. 1';
  ctx.font = `700 ${qfs * 0.95}px Oswald, sans-serif`;
  const vw = ctx.measureText(vol).width + qfs * 1.4;
  ctx.fillStyle = GOLD;
  ctx.fillRect(W - frame - gap - vw, topH * 0.14, vw, topH * 0.72);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.fillText(vol, W - frame - gap - vw / 2, topH * 0.52);
  ctx.restore();

  // Panels.
  const rects = layoutRects(state.layout, W, H);
  rects.forEach((rect, i) => {
    drawPanelPhoto(ctx, rect, state.panels[i], grade, state.layout === 'stack');
  });
  // Halftone corner over the first panel, like a printed poster.
  if (layout.id !== 'hero') drawHalftone(ctx, rects[0].x + rects[0].w * 0.03, rects[0].y + rects[0].h * 0.04, rects[0].w * 0.22, rects[0].h * 0.2);

  // Hero-only sky art: retro sun, palms and birds over the full-bleed photo.
  if (layout.id === 'hero') {
    drawRetroSun(ctx, area.x + area.w * 0.82, area.y + area.h * 0.20, Math.min(area.w, area.h) * 0.13, 0.9);
    drawBirds(ctx, area.x + area.w * 0.12, area.y + area.h * 0.10, area.w * 0.03);
    drawPalm(ctx, area.x + area.w * 0.02, area.y + area.h * 0.99, area.w * 0.0011);
    drawPalm(ctx, area.x + area.w * 0.94, area.y + area.h * 0.99, area.w * 0.0009);
  }

  // Role labels sit above the title block, so a chip is never buried by it.
  // (Drawn after the title; see below.)

  // Title block overlapping the panels. Size it first, then clamp its centre
  // so the subtitle and tagline never spill into the footer.
  const zone = titleZone(state.layout, area);
  // The collage's small bottom panels leave little room: keep its title smaller.
  const titleH = state.layout === 'collage'
    ? Math.min(H * 0.20, area.h * 0.32)
    : Math.min(H * 0.24, area.h * 0.38);
  const titleText = (state.title || 'PALM FEVER').toUpperCase();
  const titleSize = fitTitleSize(ctx, titleText, zone.maxW, titleH);
  const titleCy = Math.min(zone.cy, area.y + area.h - titleSize * 1.18);
  drawStripedTitle(ctx, titleText, zone.cx, titleCy, zone.maxW, titleH, titleSize);
  drawScriptSubtitle(ctx, state.subtitle || '', zone.cx + zone.maxW * 0.08, titleCy + titleSize * 0.62, Math.max(20, titleSize * 0.42));
  drawTaglineBar(ctx, (state.tagline || '').toUpperCase(), zone.cx, titleCy + titleSize * 0.98, zone.maxW);

  // Role labels on every panel, on top of the title block.
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    if (panel && panel.label) drawRoleLabel(ctx, rect, panel.label);
  });

  // Gold seal, overlapping the last panel's corner.
  const last = rects[rects.length - 1];
  const sealR = Math.max(34, W * 0.048);
  drawGoldSeal(ctx, last.x + last.w - sealR * 0.55, last.y + last.h - sealR * 0.35, sealR);

  // Footer: coming soon, production line, barcode.
  ctx.save();
  const fy = H - footH * 0.52;
  ctx.textBaseline = 'middle';
  const ffs = Math.max(12, H * 0.019);
  ctx.font = `700 ${ffs}px Oswald, sans-serif`;
  ctx.fillStyle = PINK;
  ctx.textAlign = 'left';
  ctx.fillText('COMING SOON', frame + gap, fy);
  const soonW = ctx.measureText('COMING SOON').width;
  const barcodeW = W * 0.085;
  const barcodeX = W - frame - gap - barcodeW;
  // Shrink the production line until it fits between the two ends.
  const prod = 'A SUNSET PICTURES PRODUCTION  ·  STARRING YOU  ·  SHOT ON YOUR OWN CAMERA';
  let pfs = ffs * 0.85;
  ctx.font = `500 ${pfs}px Oswald, sans-serif`;
  const avail = (barcodeX - W * 0.02) - (frame + gap + soonW + W * 0.02);
  while (ctx.measureText(prod).width > avail && pfs > 9) {
    pfs *= 0.95;
    ctx.font = `500 ${pfs}px Oswald, sans-serif`;
  }
  ctx.fillStyle = 'rgba(255,246,232,0.8)';
  ctx.textAlign = 'center';
  ctx.fillText(prod, (frame + gap + soonW + barcodeX) / 2, fy);
  const bh = footH * 0.30;
  drawBarcode(ctx, barcodeX, fy - bh / 2 - 7, barcodeW, bh);
  ctx.restore();

  // Outer frame.
  ctx.lineWidth = frame * 0.55;
  ctx.strokeStyle = '#0e0218';
  ctx.strokeRect(frame * 0.28, frame * 0.28, W - frame * 0.56, H - frame * 0.56);
  ctx.lineWidth = Math.max(1, W * 0.001);
  ctx.strokeStyle = 'rgba(247,201,72,0.7)';
  ctx.strokeRect(frame * 0.62, frame * 0.62, W - frame * 1.24, H - frame * 1.24);

  return { rects, area, titleZone: zone };
}

/** Renders the poster at exact export size on a fresh canvas. */
export function renderCoverToCanvas(w, h, state) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return canvas;
}
