// Wires the Neon Vice Studio editor: photo upload and samples, the eight
// layouts and grades, caption and callout editing, per-panel crop, and PNG
// export in the three post sizes. A `?shot=` query sets up a fixed scene for
// a screenshot instead (see ./shots.js).
import { LAYOUTS } from './layouts.js';
import { GRADES } from './grades.js';
import { drawCover, panelAt, calloutAt } from './render.js';
import { parseShot, sampleNames, sampleFace } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const SIZES = ['1080x1080', '1080x1350', '1920x1080'];

const state = {
  layout: 'castgrid',
  grade: 'sunset',
  title: 'NEON VICE',
  subtitle: 'A LEONIDA STORY',
  photos: [],
  panels: Array.from({ length: 6 }, (_, i) => ({ photo: i, zoom: 1, ox: 0, oy: 0, rot: 0 })),
  callouts: [],
  size: '1080x1080',
  selected: 0,
  picked: 0,
};

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos.push({ img, name, sample: true, face: sampleFace(name) });
  return state.photos.length - 1;
}

function refreshThumbs() {
  const box = document.getElementById('thumbs');
  box.innerHTML = '';
  state.photos.forEach((p, i) => {
    const thumb = document.createElement('img');
    thumb.src = p.img.src;
    thumb.alt = p.name;
    thumb.title = p.name;
    if (p.sample) thumb.classList.add('sample');
    if (i === state.picked) thumb.classList.add('picked');
    thumb.addEventListener('click', () => {
      state.picked = i;
      state.panels[state.selected].photo = i;
      refreshThumbs();
      redraw();
    });
    box.appendChild(thumb);
  });
}

function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  LAYOUTS.forEach((l) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layout-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(l.id === state.layout));
    btn.innerHTML = `<span class="mini"></span>${l.name}`;
    btn.addEventListener('click', () => {
      state.layout = l.id;
      layoutBox.querySelectorAll('.layout-btn').forEach((b) => b.setAttribute('aria-checked', 'false'));
      btn.setAttribute('aria-checked', 'true');
      redraw();
    });
    layoutBox.appendChild(btn);
  });
  const gradeBox = document.getElementById('grades');
  GRADES.forEach((g) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(g.id === state.grade));
    btn.innerHTML = `<span class="swatch" style="background:${g.swatch}"></span>${g.name}`;
    btn.addEventListener('click', () => {
      state.grade = g.id;
      gradeBox.querySelectorAll('.grade-btn').forEach((b) => b.setAttribute('aria-checked', 'false'));
      btn.setAttribute('aria-checked', 'true');
      redraw();
    });
    gradeBox.appendChild(btn);
  });
  document.querySelectorAll('#sizes button').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.size === state.size));
    btn.addEventListener('click', () => {
      setSize(btn.dataset.size);
      document.querySelectorAll('#sizes button').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
    });
  });
}

function setSize(size) {
  state.size = size;
  const [w, h] = size.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  redraw();
}

function syncCropControls() {
  const crop = state.panels[state.selected];
  document.getElementById('zoom').value = crop.zoom;
  document.getElementById('rotate').value = crop.rot;
}

function refreshCalloutList() {
  const list = document.getElementById('calloutList');
  list.innerHTML = '';
  state.callouts.forEach((c, i) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = c.text;
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = 'Remove';
    del.addEventListener('click', () => {
      state.callouts.splice(i, 1);
      refreshCalloutList();
      redraw();
    });
    li.append(label, del);
    list.appendChild(li);
  });
}

function addCallout(text) {
  const clean = text.trim();
  if (!clean) return;
  // Anchor at the middle of the cover, label just above it; the user can
  // drag the label (or its dot) to the feature it should point at.
  const anchor = { ax: 0.5, ay: 0.45 };
  state.callouts.push({ text: clean, ax: anchor.ax, ay: anchor.ay, lx: anchor.ax, ly: Math.max(0.06, anchor.ay - 0.22) });
  refreshCalloutList();
  redraw();
}

/** Pointer position on the canvas in canvas pixels. */
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const ci = calloutAt(state, canvas.width, canvas.height, p.x, p.y);
  if (ci >= 0) {
    drag = { kind: 'callout', index: ci };
  } else {
    const pi = panelAt(state, canvas.width, canvas.height, p.x, p.y);
    if (pi >= 0) {
      state.selected = pi;
      syncCropControls();
      drag = { kind: 'pan', index: pi, last: p };
      redraw();
    }
  }
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  if (drag.kind === 'pan') {
    const crop = state.panels[drag.index];
    const rect = { w: canvas.width, h: canvas.height };
    crop.ox += (p.x - drag.last.x) / rect.w;
    crop.oy += (p.y - drag.last.y) / rect.h;
    crop.ox = Math.max(-0.5, Math.min(0.5, crop.ox));
    crop.oy = Math.max(-0.5, Math.min(0.5, crop.oy));
    drag.last = p;
    redraw();
  } else if (drag.kind === 'callout') {
    const c = state.callouts[drag.index];
    c.lx = Math.max(0.02, Math.min(0.98, p.x / canvas.width));
    c.ly = Math.max(0.02, Math.min(0.98, p.y / canvas.height));
    redraw();
  }
});
canvas.addEventListener('pointerup', () => { drag = null; });

document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('rotate').addEventListener('input', (e) => {
  state.panels[state.selected].rot = Number(e.target.value);
  redraw();
});

document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('addCallout').addEventListener('click', () => {
  const input = document.getElementById('calloutText');
  addCallout(input.value);
  input.value = '';
});
document.getElementById('calloutText').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addCallout(e.target.value);
    e.target.value = '';
  }
});

async function takeFiles(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push({ img, name: file.name.replace(/\.[^.]+$/, ''), sample: false });
    added++;
  }
  if (added) {
    state.picked = state.photos.length - 1;
    state.panels[state.selected].photo = state.picked;
    refreshThumbs();
    redraw();
    statusEl.textContent = `${added} photo${added > 1 ? 's' : ''} added — click a panel to place one.`;
  }
}

const dropzone = document.getElementById('dropzone');
dropzone.addEventListener('click', () => document.getElementById('upload').click());
document.getElementById('upload').addEventListener('change', (e) => takeFiles([...e.target.files]));
['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
  e.preventDefault();
  dropzone.classList.add('over');
}));
['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
  e.preventDefault();
  dropzone.classList.remove('over');
}));
dropzone.addEventListener('drop', (e) => takeFiles([...e.dataTransfer.files]));

/** Renders the current state at the chosen export size onto a fresh canvas. */
function renderExport() {
  const [w, h] = state.size.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  return off;
}

document.getElementById('exportPng').addEventListener('click', () => {
  renderExport().toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-vice-${state.size}.png`;
    a.click();
    statusEl.textContent = `Saved neon-vice-${state.size}.png`;
  }, 'image/png');
});
document.getElementById('copyPng').addEventListener('click', async () => {
  try {
    const blob = await new Promise((resolve) => renderExport().toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    statusEl.textContent = 'Cover copied to the clipboard.';
  } catch {
    statusEl.textContent = 'Copy needs clipboard permission — use Download PNG instead.';
  }
});

/** Loads the bundled fonts, then paints; shots wait on this before signalling ready. */
async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('900 100px ViceCondensed'),
      document.fonts.load('700 40px ViceBold'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fall back to system fonts if the bundled ones cannot load.
  }
}

async function boot() {
  buildPickers();
  const query = new URLSearchParams(location.search);
  await fontsReady();
  if (query.has('shot')) {
    const scene = parseShot(query);
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    state.callouts = scene.callouts;
    state.size = `${scene.width}x${scene.height}`;
    canvas.width = scene.width;
    canvas.height = scene.height;
    for (const name of scene.photos) await addSample(name);
    state.panels.forEach((p, i) => { p.photo = i % state.photos.length; });
    document.getElementById('title').value = state.title;
    document.getElementById('subtitle').value = state.subtitle;
    refreshThumbs();
    redraw();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    return;
  }
  for (const name of sampleNames()) await addSample(name);
  state.panels.forEach((p, i) => { p.photo = i % state.photos.length; });
  refreshThumbs();
  syncCropControls();
  redraw();
}

boot();
