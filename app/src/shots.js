// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone. `photo` picks sample photos
// (comma-separated, e.g. photo=boulevard,pier), `layout`, `grade`, `caption`,
// `kicker` and `size` set the scene. window.__shotReady is set once painted.
export async function runShot(shot, query, hooks) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photoParam = query.get('photo');
  const scene = {
    layout: query.get('layout') || undefined,
    grade: query.get('grade') || undefined,
    caption: query.get('caption') ?? undefined,
    kicker: query.get('kicker') ?? undefined,
    size: query.get('size') || undefined,
    photoNames: photoParam ? photoParam.split(',').map((s) => s.trim()).filter(Boolean) : ['pier', 'boulevard'],
    onePhoto: query.get('onePhoto') === '1' ? true : undefined,
  };
  // Panel photo map: first sample goes to the hero, then alternate.
  // Framing: a portrait photo in the wide hero panel of a landscape cover
  // is shown whole (blurred-backdrop fit) so its subject keeps its head;
  // cover-cropped strip panels are nudged down so faces stay in frame.
  // The 3-panel stack is the exception: its bands are far wider than tall
  // (aspect ~2 or more in every export size), so showing a portrait photo
  // whole leaves a thin strip in the middle of a blurred backdrop. Stack
  // bands are cover-cropped to fill the band like a poster panel; the
  // head-preserving nudge for them lives in drawPanel (cover.js), which
  // anchors a very wide band's crop near the top of the photo — a fixed
  // pan set here cannot be right at every export size, since the same
  // panels are exported at 1080x1080, 1080x1350 and 1920x1080 and a pan
  // that fits one size slides a square photo past the panel edge at
  // another. "Show whole photo" in the editor still offers the fit
  // treatment as an explicit choice for any panel.
  const panels = [];
  const count = scene.layout === 'stack' ? 3 : scene.layout === 'full' ? 1 : 4;
  const wideHero = scene.layout === 'hero' && scene.size === '1920x1080';
  // Hero panel aspect for this export size: a wide hero panel crops a
  // portrait photo hard, so nudge it down to keep the subject's head in
  // frame (only where the panel is wider than it is tall).
  const dims = (scene.size || '1080x1080').split('x').map(Number);
  const heroAspect = scene.layout === 'hero' ? dims[0] / (0.64 * dims[1]) : 0;
  const heroOy = scene.layout === 'hero' && !wideHero && heroAspect > 1.2 ? 0.28 : 0;
  for (let i = 0; i < count; i++) {
    const idx = i % 2 === 0 ? 0 : (scene.photoNames.length > 1 ? 1 : 0);
    // In a wide hero, a portrait photo is shown whole (blurred-backdrop
    // fit) so no subject loses its head to the crop; every other panel,
    // stack bands included, keeps the cover crop. Stack bands carry no
    // pan here (oy 0): drawPanel anchors a very wide band's crop near the
    // top of the photo itself.
    const fitWhole = wideHero && idx === 0;
    panels.push({
      photo: idx,
      zoom: 1,
      ox: 0,
      oy: i === 0 ? heroOy : (wideHero && !fitWhole ? 0.2 : 0),
      fit: fitWhole ? 'fit' : 'cover',
    });
  }
  scene.panels = panels;
  await hooks.applyShotScene(scene);
  try { await document.fonts.ready; } catch { /* fonts are best-effort here */ }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
