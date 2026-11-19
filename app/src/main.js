// Sunset Cover editor: wires the controls to the drawing engine, loads photos
// from the machine (FileReader / object URLs — nothing is uploaded), and
// exports the cover as a PNG in the three post sizes.
import { drawCover, panelCount, layoutPanels, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const $ = (id) => document.getElementById(id);
const statusEl = $('status');

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: '1080x1080',
  caption: 'SUNSET HEIST',
  kicker: '',
  captionSize: 1,
  captionPos: 'bottom',
  captionY: 0,
  captionFill: 'gradient',
  outline: true,
  onePhoto: false,
  panels: [
    { photo: 1, zoom: 1, ox: 0, oy: 0.28, fit: 'cover' },
    { photo: 0, zoom: 1, ox: 0, oy: 0, fit: 'cover' },
    { photo: 1, zoom: 1, ox: 0, oy: 0, fit: 'cover' },
    { photo: 0, zoom: 1, ox: 0, oy: 0, fit: 'cover' },
  ],
};

let photos = []; // HTMLImageElements, in load order
let selectedPanel = 0;
let fontsReady = false;

function sizeDims(size) {
  const [w, h] = (size || state.size).split('x').map(Number);
  return { w, h };
}

/** Sizes the preview canvas to the chosen export aspect and redraws. */
export function redraw() {
  const { w, h } = sizeDims();
  const scale = 900 / Math.max(w, h);
  const pw = Math.round(w * scale);
  const ph = Math.round(h * scale);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  drawCover(canvas, photos, state);
  syncPanelControls();
}

function setStatus(text) {
  statusEl.textContent = text;
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

async function loadSamples() {
  try {
    const [pier, boulevard] = await Promise.all([
      loadImage('samples/pier.jpg'),
      loadImage('samples/boulevard.jpg'),
    ]);
    photos = [pier, boulevard];
    renderThumbs();
    redraw();
  } catch (err) {
    setStatus('Sample photos could not be loaded — add your own photo to begin.');
  }
}

function renderThumbs() {
  const box = $('thumbs');
  box.textContent = '';
  photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = 'Photo ' + (i + 1);
    thumb.title = 'Photo ' + (i + 1) + ' — click to put it in the selected panel';
    thumb.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      renderThumbs();
      redraw();
    });
    if (state.panels[selectedPanel] && state.panels[selectedPanel].photo === i) thumb.classList.add('sel');
    box.appendChild(thumb);
  });
  const sel = $('panelPhoto');
  sel.textContent = '';
  const empty = document.createElement('option');
  empty.value = '-1';
  empty.textContent = 'Empty panel (painted sky)';
  sel.appendChild(empty);
  photos.forEach((img, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = 'Photo ' + (i + 1);
    sel.appendChild(opt);
  });
  const cur = state.panels[selectedPanel] ? state.panels[selectedPanel].photo : -1;
  sel.value = cur === null || cur === undefined ? '-1' : String(cur);
}

function syncPanelControls() {
  const panel = state.panels[selectedPanel] || { zoom: 1, ox: 0, oy: 0, fit: 'cover', photo: -1 };
  $('zoom').value = String(panel.zoom || 1);
  $('ox').value = String(panel.ox || 0);
  $('oy').value = String(panel.oy || 0);
  $('zoomVal').textContent = (panel.zoom || 1).toFixed(2) + '×';
  $('oxVal').textContent = String(panel.ox || 0);
  $('oyVal').textContent = String(panel.oy || 0);
  document.querySelectorAll('#fitMode button').forEach((b) => {
    b.classList.toggle('on', b.dataset.fit === (panel.fit || 'cover'));
  });
  const sel = $('panelPhoto');
  if (sel.options.length) sel.value = panel.photo === null || panel.photo === undefined ? '-1' : String(panel.photo);
  document.querySelectorAll('#thumbs img').forEach((img, i) => {
    img.classList.toggle('sel', panel.photo === i);
  });
}

function segWire(id, attr, apply) {
  $(id).addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-' + attr + ']');
    if (!btn) return;
    $(id).querySelectorAll('button').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    apply(btn.dataset[attr]);
  });
}

segWire('layouts', 'layout', (layout) => {
  state.layout = layout;
  selectedPanel = 0;
  redraw();
});
segWire('grades', 'grade', (grade) => {
  state.grade = grade;
  redraw();
});
segWire('sizes', 'size', (size) => {
  state.size = size;
  redraw();
});
segWire('fitMode', 'fit', (fit) => {
  state.panels[selectedPanel].fit = fit;
  redraw();
});

$('onePhoto').addEventListener('change', (e) => {
  state.onePhoto = e.target.checked;
  redraw();
});
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('kicker').addEventListener('input', (e) => { state.kicker = e.target.value; redraw(); });
$('capSize').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value);
  $('capSizeVal').textContent = Math.round(state.captionSize * 100) + '%';
  redraw();
});
$('capPos').addEventListener('change', (e) => { state.captionPos = e.target.value; redraw(); });
$('capFill').addEventListener('change', (e) => { state.captionFill = e.target.value; redraw(); });
$('capOutline').addEventListener('change', (e) => { state.outline = e.target.checked; redraw(); });
$('zoom').addEventListener('input', (e) => { state.panels[selectedPanel].zoom = Number(e.target.value); redraw(); });
$('ox').addEventListener('input', (e) => { state.panels[selectedPanel].ox = Number(e.target.value); redraw(); });
$('oy').addEventListener('input', (e) => { state.panels[selectedPanel].oy = Number(e.target.value); redraw(); });
$('panelPhoto').addEventListener('change', (e) => {
  const v = Number(e.target.value);
  state.panels[selectedPanel].photo = v < 0 ? null : v;
  redraw();
});
$('panelCenter').addEventListener('click', () => {
  const p = state.panels[selectedPanel];
  p.zoom = 1; p.ox = 0; p.oy = 0;
  redraw();
});
$('samples').addEventListener('click', () => { loadSamples(); setStatus('Sample photos loaded.'); });

$('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  for (const file of files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      photos.push(img);
    } catch {
      setStatus('Could not read ' + file.name + ' — try another image.');
    }
  }
  if (photos.length) {
    const last = photos.length - 1;
    if (!state.onePhoto) state.panels[selectedPanel].photo = last;
    renderThumbs();
    redraw();
    setStatus(files.length + ' photo' + (files.length > 1 ? 's' : '') + ' loaded — click a panel, then crop it.');
  }
  e.target.value = '';
});

// Click a panel to select it; drag inside it to pan the photo.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const hit = panels.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit >= 0) {
    selectedPanel = hit;
    const panel = state.panels[selectedPanel];
    drag = { x: p.x, y: p.y, ox: panel.ox || 0, oy: panel.oy || 0, rect: panels[hit] };
    canvas.setPointerCapture(e.pointerId);
    syncPanelControls();
    renderThumbs();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[selectedPanel];
  panel.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (p.x - drag.x) / drag.rect.w));
  panel.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (p.y - drag.y) / drag.rect.h));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

/** Renders the cover at exact export size and returns a PNG data URL. */
export function exportPNG(w, h) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, photos, state);
    off.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, width: w, height: h });
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}
window.__exportPNG = exportPNG;

$('export').addEventListener('click', async () => {
  const { w, h } = sizeDims();
  setStatus('Exporting ' + w + ' × ' + h + '…');
  const { dataUrl } = await exportPNG(w, h);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'sunset-cover-' + w + 'x' + h + '.png';
  a.click();
  setStatus('Saved sunset-cover-' + w + 'x' + h + '.png');
});

// Fonts first: Anton is the lettering, so wait for it before the first paint.
document.fonts.ready.then(() => {
  fontsReady = true;
  redraw();
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, {
    async applyShotScene(scene) {
      if (scene.layout && LAYOUTS.includes(scene.layout)) state.layout = scene.layout;
      if (scene.grade && GRADES.includes(scene.grade)) state.grade = scene.grade;
      if (scene.caption !== undefined) { state.caption = scene.caption; $('caption').value = scene.caption; }
      if (scene.kicker !== undefined) { state.kicker = scene.kicker; $('kicker').value = scene.kicker; }
      if (scene.size && SIZES.includes(scene.size)) state.size = scene.size;
      if (scene.onePhoto !== undefined) { state.onePhoto = scene.onePhoto; $('onePhoto').checked = scene.onePhoto; }
      if (scene.panels) state.panels = scene.panels;
      document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
      document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
      document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
      if (scene.photoNames) {
        photos = [];
        for (const name of scene.photoNames) {
          try { photos.push(await loadImage('samples/' + name + '.jpg')); } catch { /* keep going */ }
        }
        renderThumbs();
      }
      redraw();
    },
  });
} else {
  loadSamples();
}
