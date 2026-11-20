// Palm Fever editor: wires the controls to the cover renderer, loads the sample
// cast on start, and exports exact-size PNGs. Photos are read on this machine only.

import { LAYOUTS, GRADES, SIZES, drawCover, renderCoverToCanvas } from './cover.js';

const SAMPLES = [
  { file: 'driver.jpg', label: 'THE DRIVER', panY: 0 },
  { file: 'insider.jpg', label: 'THE INSIDER', panY: 0.35 },
  { file: 'boss.jpg', label: 'THE BOSS', panY: 0.12 },
  { file: 'rider.jpg', label: 'THE RIDER', panY: -0.05 },
  { file: 'fixer.jpg', label: 'THE FIXER', panY: 0.3 },
  { file: 'courier.jpg', label: 'THE COURIER', panY: 0.12 },
];

const DEFAULT_LABELS = ['THE DRIVER', 'THE INSIDER', 'THE BOSS', 'THE RIDER', 'THE FIXER', 'THE COURIER'];

const state = {
  layout: 'cast',
  grade: 'sunset',
  size: '1920x1080',
  title: 'PALM FEVER',
  subtitle: 'chasing the last light',
  tagline: 'SIX STRANGERS · ONE COAST · NO WAY BACK',
  quote: 'SUNSET CINEMA AT ITS WILDEST',
  quoteSource: 'THE COASTAL TIMES',
  panels: DEFAULT_LABELS.map((label) => ({ img: null, label, zoom: 1.15, panX: 0, panY: 0, fit: 'fill' })),
};

let selected = 0;
let lastRects = [];
let fontsReady = false;

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads the three local OFL fonts before the first paint so lettering is real. */
async function loadFonts() {
  try {
    const anton = new FontFace('Anton', 'url(./fonts/Anton.woff2)', { weight: '400' });
    const pacifico = new FontFace('Pacifico', 'url(./fonts/Pacifico.woff2)', { weight: '400' });
    const oswald = new FontFace('Oswald', 'url(./fonts/Oswald.woff2)', { weight: '100 700' });
    const loaded = await Promise.all([anton.load(), pacifico.load(), oswald.load()]);
    loaded.forEach((f) => document.fonts.add(f));
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('60px Pacifico'),
      document.fonts.load('700 30px Oswald'),
    ]);
    fontsReady = true;
  } catch (err) {
    status.textContent = 'Fonts did not load; the poster still draws with fallback type.';
  }
}

function sizeOf() {
  return SIZES.find((s) => s.id === state.size) || SIZES[0];
}

function redraw() {
  const size = sizeOf();
  canvas.width = size.w;
  canvas.height = size.h;
  const out = drawCover(canvas, state);
  lastRects = out.rects;
  renderPanelList();
}

function renderPanelList() {
  const list = document.getElementById('panelList');
  const layout = LAYOUTS.find((l) => l.id === state.layout);
  list.innerHTML = '';
  state.panels.slice(0, layout.panels).forEach((panel, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'panel-chip' + (i === selected ? ' selected' : '');
    chip.textContent = `${i + 1} · ${panel.label}${panel.img ? '' : ' · empty'}`;
    chip.addEventListener('click', () => selectPanel(i));
    list.appendChild(chip);
  });
}

function selectPanel(i) {
  const layout = LAYOUTS.find((l) => l.id === state.layout);
  selected = Math.max(0, Math.min(i, layout.panels - 1));
  const panel = state.panels[selected];
  document.getElementById('panelLabel').value = panel.label;
  document.getElementById('panelZoom').value = panel.zoom;
  document.getElementById('panelPanX').value = panel.panX;
  document.getElementById('panelPanY').value = panel.panY;
  document.getElementById('panelFit').value = panel.fit;
  document.getElementById('selectedPanelLabel').textContent = `Selected panel: ${selected + 1} · ${panel.label}`;
  redraw();
}

function buildChoiceButtons(el, items, current, onPick) {
  el.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice' + (item.id === current ? ' active' : '');
    b.textContent = item.name;
    b.addEventListener('click', () => {
      onPick(item.id);
      buildChoiceButtons(el, items, item.id, onPick);
      redraw();
    });
    el.appendChild(b);
  });
}

function refreshLayoutButtons() {
  buildChoiceButtons(document.getElementById('layoutButtons'), LAYOUTS, state.layout, (id) => {
    state.layout = id;
    selected = 0;
    selectPanel(0);
  });
}

function refreshGradeButtons() {
  buildChoiceButtons(document.getElementById('gradeButtons'), GRADES, state.grade, (id) => { state.grade = id; });
}

/** Fills the panels with the sample cast, in role order. */
async function loadSamples() {
  status.textContent = 'Loading the sample cast…';
  for (let i = 0; i < SAMPLES.length; i++) {
    try {
      state.panels[i].img = await loadImage(`./samples/${SAMPLES[i].file}`);
      state.panels[i].label = SAMPLES[i].label;
      // Frame each portrait so its face survives the wide-panel crop.
      state.panels[i].panY = SAMPLES[i].panY;
    } catch { /* a missing sample leaves its panel empty */ }
  }
  selectPanel(0);
  status.textContent = 'Sample cast loaded — pick a layout, a grade, then export.';
}

function buildSampleStrip() {
  const strip = document.getElementById('sampleStrip');
  SAMPLES.forEach((sample) => {
    const img = document.createElement('img');
    img.src = `./samples/${sample.file}`;
    img.alt = sample.label;
    img.title = `${sample.label} — click to put in the selected panel`;
    img.addEventListener('click', async () => {
      state.panels[selected].img = await loadImage(`./samples/${sample.file}`);
      state.panels[selected].label = sample.label;
      state.panels[selected].panY = sample.panY;
      document.getElementById('panelLabel').value = sample.label;
      document.getElementById('panelPanY').value = sample.panY;
      redraw();
    });
    strip.appendChild(img);
  });
  // The two starter photos are free extras: pier and boulevard.
  ['pier.jpg', 'boulevard.jpg'].forEach((file) => {
    const img = document.createElement('img');
    img.src = `./samples/${file}`;
    img.alt = file;
    img.title = `${file} — click to put in the selected panel`;
    img.addEventListener('click', async () => {
      state.panels[selected].img = await loadImage(`./samples/${file}`);
      redraw();
    });
    strip.appendChild(img);
  });
}

function exportPng(w, h, filename) {
  const out = renderCoverToCanvas(w, h, state);
  out.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — the canvas was empty.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved ${filename} (${w} × ${h}).`;
  }, 'image/png');
  window.__lastExport = { w, h, filename };
}

function bindControls() {
  document.getElementById('uploadPhotos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (let i = 0; i < files.length; i++) {
      const img = await loadImage(URL.createObjectURL(files[i]));
      const target = i === 0 ? selected : (selected + i) % state.panels.length;
      state.panels[target].img = img;
    }
    redraw();
    status.textContent = `${files.length} photo${files.length === 1 ? '' : 's'} loaded.`;
  });

  document.getElementById('fillAll').addEventListener('click', () => {
    document.getElementById('panelPhotoInput').dataset.mode = 'all';
    document.getElementById('panelPhotoInput').click();
  });
  document.getElementById('panelPhoto').addEventListener('click', () => {
    document.getElementById('panelPhotoInput').dataset.mode = 'one';
    document.getElementById('panelPhotoInput').click();
  });
  document.getElementById('panelPhotoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = await loadImage(URL.createObjectURL(file));
    if (e.target.dataset.mode === 'all') {
      state.panels.forEach((p) => { p.img = img; });
      status.textContent = 'One photo now fills every panel — give each panel its own photo to tell the story.';
    } else {
      state.panels[selected].img = img;
    }
    redraw();
  });

  document.getElementById('loadSamples').addEventListener('click', loadSamples);

  document.getElementById('panelLabel').addEventListener('input', (e) => {
    state.panels[selected].label = e.target.value.toUpperCase();
    document.getElementById('selectedPanelLabel').textContent = `Selected panel: ${selected + 1} · ${state.panels[selected].label}`;
    redraw();
  });
  document.getElementById('panelZoom').addEventListener('input', (e) => { state.panels[selected].zoom = Number(e.target.value); redraw(); });
  document.getElementById('panelPanX').addEventListener('input', (e) => { state.panels[selected].panX = Number(e.target.value); redraw(); });
  document.getElementById('panelPanY').addEventListener('input', (e) => { state.panels[selected].panY = Number(e.target.value); redraw(); });
  document.getElementById('panelFit').addEventListener('change', (e) => { state.panels[selected].fit = e.target.value; redraw(); });

  document.getElementById('titleInput').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  document.getElementById('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  document.getElementById('taglineInput').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
  document.getElementById('quoteInput').addEventListener('input', (e) => { state.quote = e.target.value; redraw(); });
  document.getElementById('quoteSourceInput').addEventListener('input', (e) => { state.quoteSource = e.target.value; redraw(); });

  document.getElementById('sizeSelect').addEventListener('change', (e) => { state.size = e.target.value; redraw(); });
  document.getElementById('exportPng').addEventListener('click', () => {
    const s = sizeOf();
    exportPng(s.w, s.h, `palm-fever-${s.id}.png`);
  });
  document.getElementById('exportSquare').addEventListener('click', () => exportPng(1080, 1080, 'palm-fever-1080x1080.png'));
  document.getElementById('exportPortrait').addEventListener('click', () => exportPng(1080, 1350, 'palm-fever-1080x1350.png'));
  document.getElementById('exportWide').addEventListener('click', () => exportPng(1920, 1080, 'palm-fever-1920x1080.png'));

  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    const hit = lastRects.findIndex((rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
    if (hit >= 0) selectPanel(hit);
  });
}

/** Applies ?layout= ?grade= ?size= ?title= for screenshots and deep links. */
function applyQuery() {
  const q = new URLSearchParams(location.search);
  if (q.get('layout')) state.layout = q.get('layout');
  if (q.get('grade')) state.grade = q.get('grade');
  if (q.get('size')) state.size = q.get('size');
  if (q.get('title')) { state.title = q.get('title'); document.getElementById('titleInput').value = q.get('title'); }
  if (q.get('subtitle')) { state.subtitle = q.get('subtitle'); document.getElementById('subtitleInput').value = q.get('subtitle'); }
  if (q.get('size')) document.getElementById('sizeSelect').value = q.get('size');
}

applyQuery();
refreshLayoutButtons();
refreshGradeButtons();
buildSampleStrip();
bindControls();
await loadFonts();
await loadSamples();
window.__palmFever = { state, redraw, exportPng, loadSamples, selectPanel, fontsReady: () => fontsReady };
window.__shotReady = true;
