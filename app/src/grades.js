// The eight colour grades. Each grade is a treatment applied over the photos:
// a top-to-bottom light wash, a colour wash blended over the art, a vignette
// and a grain strength. All values are plain data so the editor can list them.
export const GRADES = [
  {
    id: 'sunset', name: 'Vice Sunset',
    washTop: 'rgba(255, 214, 120, 0.20)', washBottom: 'rgba(255, 46, 136, 0.42)',
    washBlend: 'soft-light', tint: 'rgba(255, 110, 60, 0.16)', tintBlend: 'overlay',
    vignette: 0.42, grain: 0.05, swatch: 'linear-gradient(135deg,#ffd678,#ff2e88)',
  },
  {
    id: 'neon', name: 'Neon Nights',
    washTop: 'rgba(34, 211, 238, 0.22)', washBottom: 'rgba(168, 28, 255, 0.45)',
    washBlend: 'soft-light', tint: 'rgba(120, 40, 255, 0.18)', tintBlend: 'overlay',
    vignette: 0.5, grain: 0.07, swatch: 'linear-gradient(135deg,#22d3ee,#a81cff)',
  },
  {
    id: 'heat', name: 'Heatwave',
    washTop: 'rgba(255, 236, 160, 0.26)', washBottom: 'rgba(255, 90, 0, 0.40)',
    washBlend: 'overlay', tint: 'rgba(255, 140, 0, 0.20)', tintBlend: 'soft-light',
    vignette: 0.34, grain: 0.04, swatch: 'linear-gradient(135deg,#ffeca0,#ff5a00)',
  },
  {
    id: 'noir', name: 'Palm Noir',
    washTop: 'rgba(200, 210, 255, 0.10)', washBottom: 'rgba(5, 5, 20, 0.55)',
    washBlend: 'soft-light', tint: 'rgba(10, 10, 40, 0.22)', tintBlend: 'multiply',
    vignette: 0.62, grain: 0.10, swatch: 'linear-gradient(135deg,#8b93b8,#050514)',
  },
  {
    id: 'gold', name: 'Gold Hour',
    washTop: 'rgba(255, 225, 140, 0.30)', washBottom: 'rgba(190, 110, 10, 0.38)',
    washBlend: 'soft-light', tint: 'rgba(255, 201, 60, 0.14)', tintBlend: 'overlay',
    vignette: 0.36, grain: 0.04, swatch: 'linear-gradient(135deg,#ffe18c,#be6e0a)',
  },
  {
    id: 'teal', name: 'Teal Vice',
    washTop: 'rgba(120, 255, 220, 0.20)', washBottom: 'rgba(0, 90, 110, 0.48)',
    washBlend: 'soft-light', tint: 'rgba(0, 180, 160, 0.16)', tintBlend: 'overlay',
    vignette: 0.44, grain: 0.05, swatch: 'linear-gradient(135deg,#78ffdc,#005a6e)',
  },
  {
    id: 'magenta', name: 'Magenta Mile',
    washTop: 'rgba(255, 120, 220, 0.24)', washBottom: 'rgba(160, 0, 90, 0.50)',
    washBlend: 'soft-light', tint: 'rgba(255, 0, 140, 0.18)', tintBlend: 'overlay',
    vignette: 0.48, grain: 0.06, swatch: 'linear-gradient(135deg,#ff78dc,#a0005a)',
  },
  {
    id: 'print', name: 'Classic Print',
    washTop: 'rgba(255, 240, 210, 0.16)', washBottom: 'rgba(120, 60, 20, 0.30)',
    washBlend: 'soft-light', tint: 'rgba(210, 170, 120, 0.12)', tintBlend: 'overlay',
    vignette: 0.30, grain: 0.12, swatch: 'linear-gradient(135deg,#fff0d2,#783c14)',
  },
];

/** Looks a grade up by id, falling back to the first grade. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
