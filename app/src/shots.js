// Fixed scenes for screenshots: ?shot=cover renders one exported cover full
// screen, ?shot=editor shows the editor with a photo loaded. Every value comes
// from the query string so each screenshot is reproducible from its URL.
// window.__shotReady is set once the scene has painted.
// The bundled sample photos, each with the vertical span of its subject's
// face as fractions of the photo height (hair/hat top to chin), measured
// from the shipped files. The renderer centres the crop window on that span,
// so a wide panel never beheads its subject. Faces sit at very different
// heights across the samples (boulevard's at ~0.07–0.28, duo's at
// ~0.32–0.50), so no single generic bias can frame them all — the span is
// the fix. User uploads have no measured span and keep the mild bias.
const SAMPLES = [
  { name: 'lena', face: [0.10, 0.48] },
  { name: 'marcus', face: [0.18, 0.39] },
  { name: 'duo', face: [0.32, 0.50] },
  { name: 'rico', face: [0.20, 0.35] },
  { name: 'boulevard', face: [0.07, 0.28] },
  { name: 'pier', face: [0.04, 0.24] },
];

const SAMPLE_NAMES = SAMPLES.map((s) => s.name);

const DEFAULT_CALLOUTS = [
  { text: 'The Getaway', ax: 0.68, ay: 0.32, lx: 0.82, ly: 0.14 },
  { text: 'Palm Row', ax: 0.20, ay: 0.58, lx: 0.13, ly: 0.74 },
  { text: 'Neon Nights', ax: 0.46, ay: 0.16, lx: 0.46, ly: 0.05 },
];

/** Parses the screenshot query into a complete scene description. */
export function parseShot(query) {
  const shot = query.get('shot') ?? 'cover';
  const size = (query.get('size') ?? '1920x1080').split('x').map(Number);
  const photos = (query.get('photos') ?? SAMPLE_NAMES.join(',')).split(',');
  const scene = {
    shot,
    width: size[0] || 1920,
    height: size[1] || 1080,
    layout: query.get('layout') ?? 'castgrid',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('title') ?? 'NEON VICE',
    subtitle: query.get('subtitle') ?? 'A LEONIDA STORY',
    photos,
    callouts: query.get('callouts') === '1' ? DEFAULT_CALLOUTS : [],
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  return scene;
}

/** The sample photo names the app ships, in display order. */
export function sampleNames() { return [...SAMPLE_NAMES]; }

/** The measured face span [top, bottom] of a sample photo, or null. */
export function sampleFace(name) {
  return SAMPLES.find((s) => s.name === name)?.face ?? null;
}
