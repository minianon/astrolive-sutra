/**
 * Chart engine.
 *
 * HONESTY NOTE — read before judging accuracy:
 * `sunSign()` is real: tropical-zodiac date boundaries, correct for any birth date.
 * Everything else (moon, ascendant, planetary houses) is a *simulated ephemeris* —
 * a deterministic hash of the birth details, not astronomical computation. A true
 * implementation swaps this module for Swiss Ephemeris server-side; nothing above
 * this layer changes. It is deterministic (not random) on purpose: identical birth
 * details always produce an identical chart, which is what lets a chart travel
 * inside a shareable URL and still match on the other side.
 */

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water'

export interface Sign {
  name: string
  glyph: string
  element: Element
  ruler: string
}

export const SIGNS: Sign[] = [
  { name: 'Aries', glyph: '♈', element: 'Fire', ruler: 'Mars' },
  { name: 'Taurus', glyph: '♉', element: 'Earth', ruler: 'Venus' },
  { name: 'Gemini', glyph: '♊', element: 'Air', ruler: 'Mercury' },
  { name: 'Cancer', glyph: '♋', element: 'Water', ruler: 'Moon' },
  { name: 'Leo', glyph: '♌', element: 'Fire', ruler: 'Sun' },
  { name: 'Virgo', glyph: '♍', element: 'Earth', ruler: 'Mercury' },
  { name: 'Libra', glyph: '♎', element: 'Air', ruler: 'Venus' },
  { name: 'Scorpio', glyph: '♏', element: 'Water', ruler: 'Mars' },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire', ruler: 'Jupiter' },
  { name: 'Capricorn', glyph: '♑', element: 'Earth', ruler: 'Saturn' },
  { name: 'Aquarius', glyph: '♒', element: 'Air', ruler: 'Saturn' },
  { name: 'Pisces', glyph: '♓', element: 'Water', ruler: 'Jupiter' },
]

/** Last day of each sign, indexed by month (1-12). Tropical zodiac. */
const CUSP: Record<number, [number, number, number]> = {
  //        lastDay, signIfBefore, signIfAfter   (indices into SIGNS)
  1: [19, 9, 10],
  2: [18, 10, 11],
  3: [20, 11, 0],
  4: [19, 0, 1],
  5: [20, 1, 2],
  6: [20, 2, 3],
  7: [22, 3, 4],
  8: [22, 4, 5],
  9: [22, 5, 6],
  10: [22, 6, 7],
  11: [21, 7, 8],
  12: [21, 8, 9],
}

/** Real tropical sun sign from an ISO `YYYY-MM-DD` date. */
export function sunSign(isoDate: string): Sign {
  const [, m, d] = isoDate.split('-').map(Number)
  const rule = CUSP[m]
  if (!rule) return SIGNS[0]
  const [lastDay, before, after] = rule
  return SIGNS[d <= lastDay ? before : after]
}

/* ---------- deterministic seeding (cyrb128 + mulberry32) ---------- */

function cyrb128(str: string): number {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  return (h1 ^ h2 ^ h3 ^ h4) >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- birth details & chart ---------- */

export interface Birth {
  name: string
  date: string   // YYYY-MM-DD
  time: string   // HH:MM
  place: string
}

export const PLANETS = [
  'Sun', 'Moon', 'Ascendant', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu',
] as const
export type Planet = (typeof PLANETS)[number]

export interface Placement {
  planet: Planet
  sign: Sign
  house: number
  degree: number
  retrograde: boolean
}

export interface Chart {
  birth: Birth
  seed: number
  sun: Sign
  moon: Sign
  ascendant: Sign
  placements: Placement[]
}

export function birthKey(b: Birth): string {
  return `${b.date}|${b.time}|${b.place.trim().toLowerCase()}`
}

export function computeChart(birth: Birth): Chart {
  const seed = cyrb128(birthKey(birth))
  const rnd = mulberry32(seed)
  const sun = sunSign(birth.date)

  const placements: Placement[] = PLANETS.map((planet, i) => {
    const sign = planet === 'Sun' ? sun : SIGNS[Math.floor(rnd() * 12)]
    return {
      planet,
      sign,
      house: 1 + Math.floor(rnd() * 12),
      degree: Math.round(rnd() * 2900) / 100,
      // luminaries and the lunar node never retrograde in this model
      retrograde: i > 2 && planet !== 'Rahu' && rnd() < 0.18,
    }
  })

  const find = (p: Planet) => placements.find((x) => x.planet === p)!.sign
  return { birth, seed, sun, moon: find('Moon'), ascendant: find('Ascendant'), placements }
}

/* ---------- synastry (two-chart compatibility) ---------- */

const ELEMENT_AFFINITY: Record<Element, Record<Element, number>> = {
  Fire:  { Fire: 82, Earth: 54, Air: 90, Water: 48 },
  Earth: { Fire: 54, Earth: 84, Air: 51, Water: 88 },
  Air:   { Fire: 90, Earth: 51, Air: 80, Water: 56 },
  Water: { Fire: 48, Earth: 88, Air: 56, Water: 86 },
}

export interface SynastryAspect {
  label: string
  detail: string
  score: number
  tone: 'harmony' | 'friction' | 'growth'
}

export interface Synastry {
  score: number
  headline: string
  aspects: SynastryAspect[]
  /** Locked until both charts are present. */
  depthTeaser: string
}

/** Deterministic on the pair, and order-independent. */
export function synastry(a: Chart, b: Chart): Synastry {
  const pairSeed = cyrb128([birthKey(a.birth), birthKey(b.birth)].sort().join('~'))
  const rnd = mulberry32(pairSeed)

  const sunPair = ELEMENT_AFFINITY[a.sun.element][b.sun.element]
  const moonPair = ELEMENT_AFFINITY[a.moon.element][b.moon.element]
  const ascPair = ELEMENT_AFFINITY[a.ascendant.element][b.ascendant.element]

  const score = Math.round(sunPair * 0.4 + moonPair * 0.38 + ascPair * 0.22)

  const aspects: SynastryAspect[] = [
    {
      label: 'Sun ↔ Sun',
      detail: `${a.sun.name} with ${b.sun.name} — ${a.sun.element} meeting ${b.sun.element}. This is the register your everyday decisions get made in.`,
      score: sunPair,
      tone: sunPair >= 75 ? 'harmony' : sunPair >= 55 ? 'growth' : 'friction',
    },
    {
      label: 'Moon ↔ Moon',
      detail: `${a.moon.name} with ${b.moon.name}. The emotional weather — how each of you behaves when things get hard.`,
      score: moonPair,
      tone: moonPair >= 75 ? 'harmony' : moonPair >= 55 ? 'growth' : 'friction',
    },
    {
      label: 'Ascendant ↔ Ascendant',
      detail: `${a.ascendant.name} rising with ${b.ascendant.name} rising. First impressions, and how you two look from outside.`,
      score: ascPair,
      tone: ascPair >= 75 ? 'harmony' : ascPair >= 55 ? 'growth' : 'friction',
    },
    {
      label: `${a.moon.ruler} ↔ ${b.sun.ruler}`,
      detail: 'Ruling-planet exchange. Where one of you consistently leads and the other follows.',
      score: 45 + Math.floor(rnd() * 50),
      tone: rnd() > 0.5 ? 'growth' : 'harmony',
    },
  ]

  const headline =
    score >= 80 ? 'Unusually easy — and that carries its own risk'
    : score >= 65 ? 'Strong, with one fault line worth naming'
    : score >= 50 ? 'Workable, but it will need deliberate effort'
    : 'High friction — which is not the same as wrong'

  return {
    score,
    headline,
    aspects,
    depthTeaser:
      'A named astrologer reads the full house overlay, the timing of your next three decision windows, and the two dates worth avoiding.',
  }
}

export const ELEMENT_COLOR: Record<Element, string> = {
  Fire: 'text-saffron',
  Earth: 'text-jade',
  Air: 'text-indigo-glow',
  Water: 'text-lotus',
}
