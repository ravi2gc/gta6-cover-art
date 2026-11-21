// VICE GOLD — colour grades. Each grade is a warm golden-hour look applied to
// the photos at render time (canvas filter + a colour wash + a vignette), plus
// the title gradient it pairs with. No external assets: everything is local.
export const GRADES = [
  { id: 'golden-hour', name: 'Golden Hour',
    filter: 'sepia(0.28) saturate(1.35) contrast(1.06) brightness(1.06)',
    wash: 'rgba(255,176,66,0.16)', vignette: ['rgba(60,10,40,0)', 'rgba(40,8,30,0.42)'],
    title: ['#FFE9A8', '#E9A821'], titleStroke: '#3A1408', accent: '#E9B64A' },
  { id: 'vice-sunset', name: 'Vice Sunset',
    filter: 'sepia(0.22) saturate(1.45) contrast(1.07) hue-rotate(-14deg) brightness(1.04)',
    wash: 'rgba(255,110,90,0.14)', vignette: ['rgba(80,10,50,0)', 'rgba(50,6,40,0.45)'],
    title: ['#FFD9C2', '#F0643C'], titleStroke: '#3A0E14', accent: '#F2824A' },
  { id: 'neon-nights', name: 'Neon Nights',
    filter: 'saturate(1.55) contrast(1.12) hue-rotate(18deg) brightness(0.96)',
    wash: 'rgba(120,80,255,0.12)', vignette: ['rgba(20,0,60,0)', 'rgba(10,0,35,0.5)'],
    title: ['#E8D9FF', '#B678FF'], titleStroke: '#16082E', accent: '#A678FF' },
  { id: 'heatwave', name: 'Heatwave',
    filter: 'sepia(0.45) saturate(1.25) contrast(1.12) brightness(1.05)',
    wash: 'rgba(255,140,30,0.18)', vignette: ['rgba(90,20,0,0)', 'rgba(60,12,0,0.45)'],
    title: ['#FFE9A8', '#D97E12'], titleStroke: '#331200', accent: '#E89B2A' },
  { id: 'palm-noir', name: 'Palm Noir',
    filter: 'saturate(0.35) contrast(1.28) brightness(0.92)',
    wash: 'rgba(20,16,28,0.20)', vignette: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)'],
    title: ['#FFFFFF', '#C8B98A'], titleStroke: '#0A0608', accent: '#D8C98A' },
  { id: 'chrome-gold', name: 'Chrome Gold',
    filter: 'saturate(1.1) contrast(1.18) brightness(1.12)',
    wash: 'rgba(255,215,120,0.12)', vignette: ['rgba(50,30,0,0)', 'rgba(30,18,0,0.4)'],
    title: ['#FFF6C8', '#C9920E'], titleStroke: '#2E1C00', accent: '#F0C44E' },
  { id: 'teal-vice', name: 'Teal Vice',
    filter: 'saturate(1.35) contrast(1.08) hue-rotate(32deg) brightness(1.02)',
    wash: 'rgba(40,200,190,0.12)', vignette: ['rgba(0,40,45,0)', 'rgba(0,25,35,0.48)'],
    title: ['#C8FFF2', '#2AB8A0'], titleStroke: '#04241F', accent: '#3EC8B8' },
  { id: 'magenta-mile', name: 'Magenta Mile',
    filter: 'saturate(1.5) contrast(1.08) hue-rotate(-32deg) brightness(1.03)',
    wash: 'rgba(255,60,160,0.13)', vignette: ['rgba(60,0,45,0)', 'rgba(40,0,32,0.48)'],
    title: ['#FFD2EA', '#E83E9E'], titleStroke: '#33041E', accent: '#F05AB0' },
  { id: 'classic-print', name: 'Classic Print',
    filter: 'sepia(0.6) saturate(0.85) contrast(1.05) brightness(1.03)',
    wash: 'rgba(240,220,170,0.14)', vignette: ['rgba(60,40,10,0)', 'rgba(40,26,6,0.42)'],
    title: ['#FFF3D0', '#B98A2E'], titleStroke: '#241708', accent: '#C8A04A' },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}
