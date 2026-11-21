// VICE GOLD — shot presets. The four screenshots in shots.json drive the app
// through these query strings, so every screenshot is a render of the live
// app, never a mock-up.
//
//   ?shot=cover   full-bleed export view (editor chrome hidden, canvas at the
//                 exact export aspect) — used for 1-cover, 3-cover, 4-callouts
//   ?shot=editor  the normal editor, photo loaded — used for 2-editor
// Plus: layout, grade, title, subtitle, size (1080x1080 | 1080x1350 |
// 1920x1080), callouts=1 (adds the three default callouts).
export function readShotParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') || 'editor',
    layout: q.get('layout') || 'hero',
    grade: q.get('grade') || 'golden-hour',
    title: q.get('title') || 'VICE GOLD',
    subtitle: q.get('subtitle') || 'a golden hour story',
    size: q.get('size') || '1080x1080',
    callouts: q.get('callouts') === '1',
  };
}

export const DEFAULT_CALLOUTS = [
  { ax: 0.30, ay: 0.30, tx: 0.07, ty: 0.10, text: 'GOLDEN HOUR LIGHT' },
  { ax: 0.44, ay: 0.52, tx: 0.40, ty: 0.66, text: 'THE DRIVER' },
  { ax: 0.18, ay: 0.58, tx: 0.05, ty: 0.60, text: 'LEONIDA HEAT' },
];
