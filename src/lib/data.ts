/**
 * Static demo data + the benchmark figures the growth model is priced against.
 *
 * Every number in BENCHMARKS is sourced. Where a figure comes from third-party
 * analysis rather than an official company disclosure, `basis` says so — the
 * report repeats that distinction rather than dressing estimates up as filings.
 */

export interface Astrologer {
  id: string
  name: string
  skills: string[]
  langs: string[]
  years: number
  ratePerMin: number
  rating: number
  consults: number
  online: boolean
  /** async voice-note turnaround, in hours */
  asyncEta: number
  avatarHue: number
}

export const ASTROLOGERS: Astrologer[] = [
  { id: 'a1', name: 'Acharya Ramesh Joshi', skills: ['Vedic', 'Marriage', 'Kundli Milan'], langs: ['Hindi', 'English'], years: 18, ratePerMin: 22, rating: 4.8, consults: 14203, online: true, asyncEta: 4, avatarHue: 32 },
  { id: 'a2', name: 'Dr. Meera Iyer', skills: ['Career', 'KP System', 'Numerology'], langs: ['English', 'Tamil'], years: 12, ratePerMin: 30, rating: 4.9, consults: 9840, online: true, asyncEta: 6, avatarHue: 285 },
  { id: 'a3', name: 'Pandit Sourav Mishra', skills: ['Vedic', 'Muhurat', 'Remedies'], langs: ['Hindi', 'Bengali'], years: 24, ratePerMin: 18, rating: 4.7, consults: 21567, online: false, asyncEta: 12, avatarHue: 12 },
  { id: 'a4', name: 'Tarot Nidhi Sharma', skills: ['Tarot', 'Relationships'], langs: ['Hindi', 'English'], years: 7, ratePerMin: 14, rating: 4.6, consults: 5321, online: true, asyncEta: 3, avatarHue: 330 },
  { id: 'a5', name: 'Jyotish Guru Anand', skills: ['Vedic', 'Finance', 'Sade Sati'], langs: ['Telugu', 'English'], years: 15, ratePerMin: 26, rating: 4.8, consults: 11090, online: true, asyncEta: 8, avatarHue: 165 },
]

/** A logged reading. This is the Sutra Memory substrate. */
export interface Reading {
  id: string
  astrologerId: string
  /** ISO date */
  date: string
  mode: 'chat' | 'call' | 'async'
  topic: 'Career' | 'Marriage' | 'Money' | 'Family' | 'Health' | 'Relationship'
  minutes: number
  cost: number
  summary: string
  /** the astrologer's claims, as dated watch-days */
  watchDays: { date: string; note: string }[]
  quotes: string[]
}

export const SEED_READINGS: Reading[] = [
  {
    id: 'r1', astrologerId: 'a2', date: '2026-03-14', mode: 'call', topic: 'Career', minutes: 14, cost: 420,
    summary: 'Job change discussed. Advised to wait out the Mercury retrograde before signing, and to renegotiate rather than resign.',
    watchDays: [
      { date: '2026-09-12', note: 'Saturn transits your 10th house — decision window on the role change opens.' },
      { date: '2026-10-03', note: 'Mercury direct. Safe to put anything in writing after this date.' },
    ],
    quotes: [
      'Do not resign in April. Renegotiate — the leverage is with you until the quarter closes.',
      'Your 10th house is strong but slow. This is a two-year build, not a two-month one.',
    ],
  },
  {
    id: 'r2', astrologerId: 'a1', date: '2026-05-02', mode: 'chat', topic: 'Marriage',
    minutes: 22, cost: 484,
    summary: 'Kundli matching for a proposed match. Guna score acceptable; flagged Mangal Dosha requiring a specific remedy before finalising.',
    watchDays: [{ date: '2026-11-21', note: 'Auspicious window for formalising begins.' }],
    quotes: ['The Guna count is not your problem. The Mars placement is, and it is fixable.'],
  },
  {
    id: 'r3', astrologerId: 'a5', date: '2026-06-19', mode: 'async', topic: 'Money', minutes: 0, cost: 149,
    summary: 'Async voice note on a property purchase. Advised deferring the down payment by one quarter.',
    watchDays: [{ date: '2026-09-28', note: 'Jupiter aspect on the 2nd house — the deferred payment lands well here.' }],
    quotes: ['Buy, but not this quarter. You are two months early and it will cost you.'],
  },
  {
    id: 'r4', astrologerId: 'a4', date: '2026-07-27', mode: 'chat', topic: 'Relationship', minutes: 11, cost: 154,
    summary: 'Tarot pull on a stalling relationship. Read as a communication blockage rather than a compatibility problem.',
    watchDays: [{ date: '2026-08-30', note: 'Venus moves out of retrograde shadow — raise the difficult conversation after this.' }],
    quotes: ['This is not a compatibility problem. It is a timing problem, and timing problems resolve.'],
  },
]

/* ---------- transit feed ---------- */

export interface Transit {
  /** days from today; negative = past */
  offset: number
  planet: string
  house: number
  intensity: 'low' | 'medium' | 'high'
  title: string
  body: string
  /** links this transit back to something an astrologer actually said */
  fromReadingId?: string
}

export const TRANSITS: Transit[] = [
  { offset: 0, planet: 'Moon', house: 4, intensity: 'medium', title: 'Moon in your 4th house', body: 'Home and family matters surface today. A conversation you have been deferring becomes easier to start — the register is softer than usual.' },
  { offset: 1, planet: 'Mercury', house: 3, intensity: 'low', title: 'Mercury steadies', body: 'Short-form communication runs clean. Good day for the email you have been rewriting.' },
  { offset: 10, planet: 'Venus', house: 7, intensity: 'high', title: 'Venus clears retrograde shadow', body: 'Nidhi flagged this date in July: the difficult conversation you were told to defer can be raised from here.', fromReadingId: 'r4' },
  { offset: 23, planet: 'Saturn', house: 10, intensity: 'high', title: 'Saturn transits your 10th house', body: 'Dr. Iyer called this in March — your decision window on the role change opens. This is the date she told you to wait for.', fromReadingId: 'r1' },
  { offset: 39, planet: 'Jupiter', house: 2, intensity: 'medium', title: 'Jupiter aspects your 2nd house', body: 'Guru Anand deferred your property payment to land here.', fromReadingId: 'r3' },
  { offset: 44, planet: 'Mercury', house: 10, intensity: 'medium', title: 'Mercury direct', body: 'Safe to put things in writing from today, per your March reading.', fromReadingId: 'r1' },
]

/* ---------- plans ---------- */

export interface Plan {
  id: string
  name: string
  price: number
  cadence: 'month' | 'pack'
  tagline: string
  includes: string[]
  highlight?: boolean
  /** what this replaces in meter terms, for the value framing */
  meterEquivalent: string
}

export const PLANS: Plan[] = [
  {
    id: 'p0', name: 'Free', price: 0, cadence: 'month',
    tagline: 'The habit, at no cost.',
    includes: ['Daily transit card for your chart', 'Streak & watch-day reminders', 'Full chart + AI chart explainer', 'Sutra Memory of every past reading'],
    meterEquivalent: 'No meter. Nothing to lose by opening the app.',
  },
  {
    id: 'p1', name: 'Sutra Plus', price: 399, cadence: 'month',
    tagline: 'Four answers a month, no clock running.',
    includes: ['4 async voice-note answers / month', 'Answers signed by a named astrologer', '10% off live consults', 'Unlimited Sutra Invites'],
    highlight: true,
    meterEquivalent: '≈ 26 minutes of ₹15/min calling — but nobody is watching a timer.',
  },
  {
    id: 'p2', name: 'Sutra Pro', price: 999, cadence: 'month',
    tagline: 'For people mid-decision.',
    includes: ['12 async answers / month', 'One 20-min live call included', 'Priority queue with your chosen astrologer', '20% off additional live consults'],
    meterEquivalent: '≈ 66 minutes of ₹15/min calling, plus the call is already paid for.',
  },
  {
    id: 'p3', name: 'Question Pack', price: 249, cadence: 'pack',
    tagline: 'Three questions. No subscription.',
    includes: ['3 async voice-note answers', 'Valid 6 months', 'Same named-astrologer guarantee'],
    meterEquivalent: 'The on-ramp for anyone who finds a per-minute meter stressful.',
  },
]

/* ---------- sourced benchmarks ---------- */

export interface Benchmark {
  label: string
  value: string
  source: string
  basis: 'company-reported' | 'third-party estimate' | 'peer-reviewed'
  note?: string
}

export const BENCHMARKS: Benchmark[] = [
  { label: 'AstroLive paid users', value: '100,000+', source: 'Inc42, Dec 2024', basis: 'company-reported' },
  { label: 'AstroLive astrologers', value: '1,500', source: 'Inc42, Dec 2024', basis: 'company-reported' },
  { label: 'AstroLive stated target', value: '10 lakh paid users', source: 'Inc42, Dec 2024', basis: 'company-reported' },
  { label: 'AstroLive funding raised', value: 'None disclosed', source: 'Tracxn / Crunchbase', basis: 'third-party estimate' },
  { label: 'Astrotalk FY25 revenue', value: '₹1,214 Cr (+85% YoY)', source: 'Outlook Business / BW Disrupt', basis: 'company-reported' },
  { label: 'Astrotalk monthly transacting users', value: '1.5 M', source: 'FY25 financial summaries', basis: 'company-reported' },
  { label: 'Astrotalk astrologers', value: '41,000+', source: 'FY25 reporting', basis: 'company-reported' },
  { label: 'Astrotalk repeat-user rate', value: '25–30%', source: 'Astrotalk case-study analyses', basis: 'third-party estimate', note: 'Implies roughly 70–75% of paying users transact once and do not return.' },
  { label: 'Category CAC', value: '₹600–900', source: 'Astrotalk growth analyses', basis: 'third-party estimate' },
  { label: 'Category LTV', value: '≈ ₹1,500', source: 'Astrotalk growth analyses', basis: 'third-party estimate' },
  { label: 'Astrotalk organic traffic share', value: '77%', source: 'Astrotalk SEO case study', basis: 'third-party estimate' },
  { label: 'Astrotalk marketing spend', value: '20–25% of revenue (≈₹236–296 Cr)', source: 'Marketing-strategy analyses', basis: 'third-party estimate' },
  { label: 'AI copilot throughput lift', value: '+14% avg, +34% novices', source: 'Brynjolfsson, Li & Raymond, "Generative AI at Work", QJE 2025 (NBER w31161)', basis: 'peer-reviewed', note: '5,179 customer-support agents. Novice-weighted lift is the relevant figure when scaling astrologer supply.' },
  { label: 'Duolingo streak effect', value: 'churn 47% → 28%', source: 'Duolingo retention case studies', basis: 'third-party estimate' },
  { label: 'Dropbox referral effect', value: '3900% growth / 15 months', source: 'Dropbox referral case studies', basis: 'third-party estimate' },
]

/** Default inputs for the growth simulator, chosen to be defensible not flattering. */
export const GROWTH_DEFAULTS = {
  monthlyNewUsers: 25000,
  shareAskingRelational: 0.42,
  inviteSendRate: 0.35,
  inviteAcceptRate: 0.38,
  acceptToPaid: 0.22,
  cac: 750,
  arpu: 230,
  repeatRateNow: 0.27,
  repeatRateWithHabit: 0.44,
}
