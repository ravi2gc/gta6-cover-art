// VICE GOLD — the studio: state, the canvas renderer (preview and export
// share one renderPoster), and the editor wiring. Works fully offline.
import { GRADES, gradeById } from './grades.js';
import { LAYOUTS, layoutById, layoutPanels } from './frames.js';
import { FACE_BOXES, DEFAULT_FACE, faceBoxFor, faceAwareCrop, applyCropAdjust } from './faces.js';
import { readShotParams, DEFAULT_CALLOUTS } from './shots.js';

export const SAMPLES = [
  { file: 'sofia.jpg', name: 'Sofia', role: 'THE FIXER' },
  { file: 'dante.jpg', name: 'Dante', role: 'THE DRIVER' },
  { file: 'milo.jpg', name: 'Milo', role: 'THE RUNNER' },
  { file: 'duo-gold.jpg', name: 'Duo Gold', role: 'THE PARTNERS' },
  { file: 'boulevard.jpg', name: 'Boulevard', role: 'THE BOULEVARD' },
  { file: 'pier.jpg', name: 'Pier', role: 'THE PIER' },
];

export const SIZES = [
  { id: '1080x1080', label: 'Square · 1080 × 1080' },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350' },
  { id: '1920x1080', label: 'Wide · 1920 × 1080' },
];

const state = {
  layout: 'hero',
  grade: 'golden-hour',
  title: 'VICE GOLD',
  subtitle: 'a golden hour story',
  size: '1080x1080',
  photos: SAMPLES.map((s) => ({ ...s, img: null, face: faceBoxFor(s.file) })),
  crops: {}, // `${layout}:${panel}` -> { photo, zoom, panX, panY, rot }
  selected: 0,
  callouts: [],
  showSeal: true,
  showStars: true,
  billing: 'A GOLDEN HOUR PICTURE  ·  SOFIA MARLOWE  ·  DANTE REYES  ·  MILO CRUZ',
};

function cropKey(layout, i) { return `${layout}:${i}`; }

export function getCrop(layout, i) {
  const key = cropKey(layout, i);
  if (!state.crops[key]) {
    state.crops[key] = { photo: i % state.photos.length, zoom: 1, panX: 0, panY: 0, rot: 0 };
  }
  return state.crops[key];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function ensurePhoto(p) {
  if (p.img) return p.img;
  const src = p.dataUrl || `samples/${p.file}`;
  p.img = await loadImage(src);
  return p.img;
}

async function ensureNeeded() {
  const { panels } = layoutPanels(state.layout, 100, 100);
  const jobs = panels.map((_, i) => ensurePhoto(state.photos[getCrop(state.layout, i).photo % state.photos.length]));
  if (layoutById(state.layout).castStrip) {
    for (const idx of [1, 2, 3]) jobs.push(ensurePhoto(state.photos[idx % state.photos.length]));
  }
  await Promise.all(jobs);
}

// ---------- text helpers ----------

function fitFont(ctx, text, startPx, maxW, family, weight = 700) {
  let fs = startPx;
  ctx.font = `${weight} ${fs}px ${family}`;
  while (fs > 14 && ctx.measureText(text).width > maxW) {
    fs -= 2;
    ctx.font = `${weight} ${fs}px ${family}`;
  }
  return fs;
}

// Retro-chrome 3D gold title: stacked dark offsets, then a gold gradient
// fill with a thin dark outline.
function drawChromeTitle(ctx, text, cx, cy, size, maxW, grade, align = 'center') {
  const fs = fitFont(ctx, text.toUpperCase(), size, maxW, 'Oswald, sans-serif');
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const x = align === 'center' ? cx : cx;
  const k = fs / 100;
  ctx.fillStyle = '#2A0A1E';
  for (const [dx, dy] of [[0, 5], [0, 3.4], [2.4, 4.4], [-2.4, 4.4], [0, 1.8]]) {
    ctx.fillText(text.toUpperCase(), x + dx * k, cy + dy * k);
  }
  const g = ctx.createLinearGradient(0, cy - fs * 0.55, 0, cy + fs * 0.55);
  g.addColorStop(0, grade.title[0]);
  g.addColorStop(0.52, '#FFF6CF');
  g.addColorStop(1, grade.title[1]);
  ctx.fillStyle = g;
  ctx.fillText(text.toUpperCase(), x, cy);
  ctx.lineWidth = Math.max(1, fs * 0.022);
  ctx.strokeStyle = grade.titleStroke;
  ctx.strokeText(text.toUpperCase(), x, cy);
  return fs;
}

function drawStars(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const x = cx + (i - 2) * r * 2.6;
    drawStar(ctx, x, cy, r);
  }
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rr;
    const py = y + Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------- panels ----------

function clipPanel(ctx, p) {
  ctx.beginPath();
  if (p.slant) {
    ctx.moveTo(p.x + p.slant, p.y);
    ctx.lineTo(p.x + p.w + p.slant, p.y);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.lineTo(p.x, p.y + p.h);
    ctx.closePath();
  } else {
    ctx.rect(p.x, p.y, p.w, p.h);
  }
  ctx.clip();
}

function drawPanel(ctx, p, photo, crop, grade, biasY) {
  const img = photo.img;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const slantInset = p.slant ? Math.abs(p.slant) / p.w : 0;
  const base = faceAwareCrop(iw, ih, p.w, p.h, photo.face, biasY, slantInset);
  const src = applyCropAdjust(base, crop.zoom, crop.panX, crop.panY, photo.face);
  ctx.save();
  clipPanel(ctx, p);
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const rot = (crop.rot * Math.PI) / 180;
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const k = 1 + 0.5 * Math.abs(Math.sin(rot));
  const dw = p.w * k;
  const dh = p.h * k;
  ctx.filter = grade.filter;
  ctx.drawImage(img, src.sx * iw, src.sy * ih, src.sw * iw, src.sh * ih, -dw / 2, -dh / 2, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
  // Grade wash + vignette, clipped to the panel.
  ctx.save();
  clipPanel(ctx, p);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  const vg = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
  vg.addColorStop(0, grade.vignette[0]);
  vg.addColorStop(1, grade.vignette[1]);
  ctx.fillStyle = vg;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.restore();
  // Frame: gold outer line + thin dark inner line.
  ctx.save();
  clipPanel(ctx, p);
  ctx.restore();
  ctx.beginPath();
  if (p.slant) {
    ctx.moveTo(p.x + p.slant, p.y);
    ctx.lineTo(p.x + p.w + p.slant, p.y);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.lineTo(p.x, p.y + p.h);
    ctx.closePath();
  } else {
    ctx.rect(p.x, p.y, p.w, p.h);
  }
  ctx.lineWidth = Math.max(2, Math.min(p.w, p.h) * 0.012);
  ctx.strokeStyle = '#F2C14E';
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(20,8,16,0.85)';
  ctx.stroke();
}

// Small gold role tag, bottom-left inside a panel.
function drawRoleTag(ctx, p, text, H) {
  const fs = Math.max(11, H * 0.016);
  ctx.font = `700 ${fs}px Oswald, sans-serif`;
  const pad = fs * 0.55;
  const w = ctx.measureText(text).width + pad * 2;
  const h = fs * 1.7;
  const x = p.x + Math.max(6, p.w * 0.03);
  const y = p.y + p.h - h - Math.max(6, p.h * 0.03);
  ctx.fillStyle = 'rgba(20,8,16,0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#F2C14E';
  ctx.fillRect(x, y, 3, h);
  ctx.fillStyle = '#F7EAD0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad + 3, y + h / 2 + 1);
}

// ---------- the poster ----------

export function renderPoster(ctx, W, H, st = state) {
  const grade = gradeById(st.grade);
  const { layout, panels, titleZone, castStrip, biasY } = layoutPanels(st.layout, W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#150D19';
  ctx.fillRect(0, 0, W, H);

  // Panels.
  panels.forEach((p, i) => {
    const crop = getCrop(st.layout, i);
    const photo = st.photos[crop.photo % st.photos.length];
    if (!photo.img) return;
    drawPanel(ctx, p, photo, crop, grade, st.layout === 'hero' ? biasY : biasY);
    if (st.layout !== 'hero') drawRoleTag(ctx, p, photo.role, H);
  });

  // Outer gold frame.
  const fi = Math.max(4, W * 0.008);
  ctx.lineWidth = Math.max(2, W * 0.0035);
  ctx.strokeStyle = '#E9B64A';
  ctx.strokeRect(fi, fi, W - 2 * fi, H - 2 * fi);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(247,234,208,0.5)';
  ctx.strokeRect(fi + 5, fi + 5, W - 2 * fi - 10, H - 2 * fi - 10);

  // Title block.
  if (titleZone === 'top') {
    drawChromeTitle(ctx, st.title, W / 2, H * 0.088, H * 0.105, W * 0.86, grade);
    ctx.font = `700 ${Math.max(16, H * 0.042)}px "Dancing Script", cursive`;
    ctx.fillStyle = '#F7EAD0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.subtitle, W / 2, H * 0.148);
  } else if (titleZone === 'band') {
    drawChromeTitle(ctx, st.title, W / 2, H * 0.798, H * 0.075, W * 0.9, grade);
    ctx.font = `700 ${Math.max(15, H * 0.036)}px "Dancing Script", cursive`;
    ctx.fillStyle = '#F7EAD0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.subtitle, W / 2, H * 0.862);
    if (st.showStars) drawStars(ctx, W / 2, H * 0.895, Math.max(5, H * 0.011), '#E9B64A');
  } else if (titleZone === 'bottom-left') {
    // Scrim so the title reads over any photo.
    const sc = ctx.createLinearGradient(0, H * 0.58, 0, H);
    sc.addColorStop(0, 'rgba(12,4,12,0)');
    sc.addColorStop(1, 'rgba(12,4,12,0.78)');
    ctx.fillStyle = sc;
    ctx.fillRect(0, H * 0.58, W, H * 0.42);
    drawStars(ctx, W * 0.045 + 4 * Math.max(5, H * 0.011) * 1.3, H * 0.775, Math.max(5, H * 0.011), '#E9B64A');
    drawChromeTitle(ctx, st.title, W * 0.045, H * 0.845, H * 0.105, W * 0.54, grade, 'left');
    ctx.font = `700 ${Math.max(16, H * 0.042)}px "Dancing Script", cursive`;
    ctx.fillStyle = '#F7EAD0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.subtitle, W * 0.048, H * 0.918);
  }

  // Hero pop-out: the cast strip. Three small portraits with drop shadows
  // overlapping the hero photo at the lower right, gold-framed.
  if (castStrip) {
    const tw = W * 0.115;
    const th = H * 0.185;
    const gap = W * 0.014;
    const total = 3 * tw + 2 * gap;
    let x = W - total - W * 0.045;
    const y = H * 0.735;
    for (const idx of [1, 2, 3]) {
      const photo = state.photos[idx % state.photos.length];
      if (photo.img) {
        const tp = { x, y, w: tw, h: th, slant: 0 };
        const tCrop = { photo: idx, zoom: 1, panX: 0, panY: 0, rot: 0 };
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = H * 0.012;
        ctx.shadowOffsetY = H * 0.006;
        ctx.fillStyle = '#F2C14E';
        ctx.fillRect(x - 3, y - 3, tw + 6, th + 6);
        ctx.restore();
        drawPanel(ctx, tp, photo, tCrop, grade, 0.5);
        drawRoleTag(ctx, tp, photo.role, H);
      }
      x += tw + gap;
    }
  }

  // Seal / stamp.
  if (st.showSeal) {
    const sx = W * 0.935;
    const sy = titleZone === 'band' ? H * 0.80 : H * 0.085;
    const r = Math.max(18, H * 0.046);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(21,13,25,0.88)';
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.strokeStyle = '#E9B64A';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.78, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(233,182,74,0.8)';
    ctx.stroke();
    ctx.fillStyle = '#F2C14E';
    ctx.font = `700 ${r * 0.62}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VG', sx, sy + 1);
    ctx.restore();
  }

  // Callouts with leader lines.
  for (const c of st.callouts) {
    const ax = c.ax * W;
    const ay = c.ay * H;
    const fs = Math.max(11, H * 0.02);
    ctx.font = `700 ${fs}px Oswald, sans-serif`;
    const tw = ctx.measureText(c.text).width + fs * 1.1;
    const th = fs * 1.9;
    const lx = c.tx * W;
    const ly = c.ty * H;
    ctx.strokeStyle = '#F2C14E';
    ctx.lineWidth = Math.max(1.5, H * 0.0018);
    ctx.beginPath();
    ctx.moveTo(lx + tw / 2, ly + th / 2);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ax, ay, Math.max(3, H * 0.005), 0, Math.PI * 2);
    ctx.fillStyle = '#F2C14E';
    ctx.fill();
    ctx.fillStyle = '#F2C14E';
    ctx.fillRect(lx, ly, tw, th);
    ctx.fillStyle = '#1A0E18';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.text, lx + fs * 0.55, ly + th / 2 + 1);
  }

  // Billing block — kept well clear of the bottom edge.
  const ruleY = H * 0.942;
  ctx.strokeStyle = 'rgba(233,182,74,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.07, ruleY);
  ctx.lineTo(W * 0.93, ruleY);
  ctx.stroke();
  const bfs = fitFont(ctx, st.billing, H * 0.0175, W * 0.88, 'Oswald, sans-serif');
  try { ctx.letterSpacing = `${Math.max(1, H * 0.0015)}px`; } catch { /* older canvas */ }
  ctx.fillStyle = '#F7EAD0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(st.billing, W / 2, H * 0.962);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

// ---------- export ----------

export async function exportPNG() {
  const [w, h] = state.size.split('x').map(Number);
  await ensureNeeded();
  await document.fonts.ready;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  renderPoster(c.getContext('2d'), w, h, state);
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-gold-${state.layout}-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve({ w, h, bytes: blob ? blob.size : 0 });
    }, 'image/png');
  });
}

// ---------- editor ----------

const $ = (id) => document.getElementById(id);

function render() {
  const canvas = $('poster');
  if (!canvas) return;
  const [w, h] = state.size.split('x').map(Number);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  renderPoster(ctx, w, h, state);
  syncPanelControls();
}

function syncPanelControls() {
  const crop = getCrop(state.layout, state.selected);
  const set = (id, v) => { const el = $(id); if (el) el.value = v; };
  set('zoom', crop.zoom);
  set('rotate', crop.rot);
  set('panx', crop.panX);
  set('pany', crop.panY);
  const label = $('panel-label');
  if (label) {
    const { panels } = layoutPanels(state.layout, 100, 100);
    label.textContent = `Panel ${state.selected + 1} of ${panels.length} · ${state.photos[crop.photo % state.photos.length].name}`;
  }
}

function refreshTraySelection() {
  document.querySelectorAll('#tray .thumb').forEach((el, i) => {
    el.classList.toggle('active', i === getCrop(state.layout, state.selected).photo % state.photos.length);
  });
}

function buildControls() {
  const layoutBox = $('layouts');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.className = 'layout-btn';
    b.textContent = l.name;
    b.dataset.id = l.id;
    b.onclick = () => {
      state.layout = l.id;
      state.selected = 0;
      document.querySelectorAll('.layout-btn').forEach((x) => x.classList.toggle('active', x.dataset.id === l.id));
      ensureNeeded().then(render);
      refreshTraySelection();
    };
    layoutBox.appendChild(b);
  });
  const gradeBox = $('grades');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.className = 'grade-btn';
    b.title = g.name;
    b.dataset.id = g.id;
    b.innerHTML = `<span class="sw" style="background:linear-gradient(135deg, ${g.title[0]}, ${g.title[1]})"></span>${g.name}`;
    b.onclick = () => {
      state.grade = g.id;
      document.querySelectorAll('.grade-btn').forEach((x) => x.classList.toggle('active', x.dataset.id === g.id));
      render();
    };
    gradeBox.appendChild(b);
  });
  const tray = $('tray');
  state.photos.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'thumb';
    d.innerHTML = `<img src="samples/${p.file}" alt="${p.name}"><span>${p.name} · ${p.role}</span>`;
    d.onclick = () => {
      const crop = getCrop(state.layout, state.selected);
      crop.photo = i;
      crop.zoom = 1; crop.panX = 0; crop.panY = 0; crop.rot = 0; // face-aware auto-fill
      ensureNeeded().then(render);
      refreshTraySelection();
    };
    tray.appendChild(d);
  });
}

function bindEditor() {
  $('title-input').addEventListener('input', (e) => { state.title = e.target.value || 'VICE GOLD'; render(); });
  $('subtitle-input').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('billing-input').addEventListener('input', (e) => { state.billing = e.target.value; render(); });
  $('size-select').addEventListener('change', (e) => { state.size = e.target.value; render(); });
  $('seal-toggle').addEventListener('change', (e) => { state.showSeal = e.target.checked; render(); });
  $('stars-toggle').addEventListener('change', (e) => { state.showStars = e.target.checked; render(); });
  const bindSlider = (id, fn) => $(id).addEventListener('input', (e) => {
    fn(parseFloat(e.target.value));
    render();
  });
  bindSlider('zoom', (v) => { getCrop(state.layout, state.selected).zoom = v; });
  bindSlider('rotate', (v) => { getCrop(state.layout, state.selected).rot = v; });
  bindSlider('panx', (v) => { getCrop(state.layout, state.selected).panX = v; });
  bindSlider('pany', (v) => { getCrop(state.layout, state.selected).panY = v; });
  $('autofill').onclick = () => {
    const c = getCrop(state.layout, state.selected);
    c.zoom = 1; c.panX = 0; c.panY = 0; c.rot = 0;
    render();
  };
  $('add-callout').onclick = () => {
    state.callouts.push({ ax: 0.5, ay: 0.4, tx: 0.1, ty: 0.12, text: 'NEW CALLOUT' });
    render();
  };
  $('clear-callouts').onclick = () => { state.callouts = []; render(); };
  $('export-btn').onclick = () => exportPNG();
  $('upload').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) addUpload(f);
  });
  const dz = $('canvas-wrap');
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dropping'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dropping'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('dropping');
    const f = e.dataTransfer.files[0];
    if (f) addUpload(f);
  });
  bindCanvasPointer();
}

function addUpload(file) {
  const url = URL.createObjectURL(file);
  const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') || 'Uploaded';
  const p = { file: null, dataUrl: url, name: name.slice(0, 14), role: 'YOUR PHOTO', img: null, face: DEFAULT_FACE };
  state.photos.push(p);
  const i = state.photos.length - 1;
  const tray = $('tray');
  const d = document.createElement('div');
  d.className = 'thumb';
  d.innerHTML = `<img src="${url}" alt="${p.name}"><span>${p.name} · YOUR PHOTO</span>`;
  d.onclick = () => {
    const crop = getCrop(state.layout, state.selected);
    crop.photo = i; crop.zoom = 1; crop.panX = 0; crop.panY = 0; crop.rot = 0;
    ensureNeeded().then(render);
    refreshTraySelection();
  };
  tray.appendChild(d);
  const crop = getCrop(state.layout, state.selected);
  crop.photo = i; crop.zoom = 1; crop.panX = 0; crop.panY = 0; crop.rot = 0;
  ensureNeeded().then(render);
  refreshTraySelection();
}

function canvasPoint(e) {
  const canvas = $('poster');
  const r = canvas.getBoundingClientRect();
  const [w, h] = state.size.split('x').map(Number);
  return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h, W: w, H: h };
}

function bindCanvasPointer() {
  const canvas = $('poster');
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const { x, y, W, H } = canvasPoint(e);
    // Callout labels first.
    for (let i = state.callouts.length - 1; i >= 0; i--) {
      const c = state.callouts[i];
      const fs = Math.max(11, H * 0.02);
      const ctx = canvas.getContext('2d');
      ctx.font = `700 ${fs}px Oswald, sans-serif`;
      const tw = ctx.measureText(c.text).width + fs * 1.1;
      const th = fs * 1.9;
      if (x >= c.tx * W && x <= c.tx * W + tw && y >= c.ty * H && y <= c.ty * H + th) {
        drag = { kind: 'callout', i, dx: x - c.tx * W, dy: y - c.ty * H };
        canvas.setPointerCapture(e.pointerId);
        return;
      }
    }
    // Then panels.
    const { panels } = layoutPanels(state.layout, W, H);
    for (let i = panels.length - 1; i >= 0; i--) {
      const p = panels[i];
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
        state.selected = i;
        drag = { kind: 'pan', x, y };
        canvas.setPointerCapture(e.pointerId);
        render();
        refreshTraySelection();
        return;
      }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { x, y, W, H } = canvasPoint(e);
    if (drag.kind === 'callout') {
      const c = state.callouts[drag.i];
      c.tx = (x - drag.dx) / W;
      c.ty = (y - drag.dy) / H;
    } else if (drag.kind === 'pan') {
      const crop = getCrop(state.layout, state.selected);
      const { panels } = layoutPanels(state.layout, W, H);
      const p = panels[state.selected];
      crop.panX -= (x - drag.x) / p.w;
      crop.panY -= (y - drag.y) / p.h;
      crop.panX = Math.max(-0.4, Math.min(0.4, crop.panX));
      crop.panY = Math.max(-0.4, Math.min(0.4, crop.panY));
      drag.x = x;
      drag.y = y;
    }
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const crop = getCrop(state.layout, state.selected);
    crop.zoom = Math.max(1, Math.min(2.5, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    render();
  }, { passive: false });
}

// ---------- boot ----------

async function boot() {
  const preset = readShotParams();
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  state.size = preset.size;
  if (preset.callouts) state.callouts = DEFAULT_CALLOUTS.map((c) => ({ ...c }));
  const coverMode = preset.shot === 'cover';
  if (coverMode) document.body.classList.add('cover-mode');

  if (!coverMode) {
    buildControls();
    bindEditor();
    $('title-input').value = state.title;
    $('subtitle-input').value = state.subtitle;
    $('billing-input').value = state.billing;
    $('size-select').value = state.size;
    document.querySelector(`.layout-btn[data-id="${state.layout}"]`)?.classList.add('active');
    document.querySelector(`.grade-btn[data-id="${state.grade}"]`)?.classList.add('active');
  }

  try {
    await document.fonts.load('700 100px Oswald');
    await document.fonts.load('700 60px "Dancing Script"');
  } catch { /* fonts fall back to sans-serif */ }
  await ensureNeeded();
  render();
  refreshTraySelection();
  await document.fonts.ready;
  render();
  window.__viceGold = { state, renderPoster, exportPNG, render };
  window.__shotReady = true;
}

document.addEventListener('DOMContentLoaded', boot);
