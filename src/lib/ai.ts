/**
 * The AI layer.
 *
 * ARCHITECTURAL POSITION — this is the point of the whole submission:
 * AI here expands astrologer *capacity*; it never replaces astrologer
 * *accountability*. Concretely, that boundary is enforced by `AI_SURFACES`
 * below: every surface is tagged either `ai-owned` (breadth — free, low-stakes,
 * explanatory, unlimited) or `human-signed` (depth — paid, high-stakes,
 * attributable to a named person). No paid judgement is ever returned by a
 * model without a named astrologer signing it. A paid AI oracle would be both
 * commoditised (AstroGPT, Om.AI and AstroSage all ship one) and directly
 * cannibalistic to the ₹10–15/min marketplace this product runs on.
 *
 * TWO-TIER EXECUTION:
 *  1. Default — pre-written output. Works instantly, offline, for every judge.
 *  2. Live    — the viewer supplies their own Anthropic API key, held only in
 *               their own browser's localStorage, and generation runs for real.
 * There is deliberately no third option: a public static build cannot hold a
 * secret, so no key is ever bundled.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Chart, Synastry } from './chart'

export const MODEL = 'claude-opus-5'

/* ---------------- the AI / human boundary, as data ---------------- */

export interface Surface {
  name: string
  owner: 'ai-owned' | 'human-signed'
  why: string
  paid: boolean
}

export const AI_SURFACES: Surface[] = [
  { name: 'Daily transit card', owner: 'ai-owned', paid: false, why: 'Unlimited, low-stakes, must be free to build a daily habit. No astrologer hour can scale to one narration per user per day.' },
  { name: 'Chart explainer', owner: 'ai-owned', paid: false, why: 'Explaining what a placement means is education, not judgement. Astrologers currently burn paid minutes on it.' },
  { name: 'Question framing', owner: 'ai-owned', paid: false, why: 'Helps a distressed user articulate what they actually want to ask, before the meter starts.' },
  { name: 'Synastry teaser', owner: 'ai-owned', paid: false, why: 'The shareable artefact. Must be instant and free or the invite loop never starts.' },
  { name: 'Consult note structuring', owner: 'ai-owned', paid: false, why: 'Turns an astrologer’s unstructured notes into dated watch-days. Mechanical work, done post-call.' },
  { name: 'Memory search', owner: 'ai-owned', paid: false, why: 'Retrieval over the user’s own history. Surfaces the human’s past words rather than inventing new ones.' },
  { name: 'Async answer draft', owner: 'human-signed', paid: true, why: 'AI drafts; the astrologer edits and records. The draft is never delivered unreviewed — the astrologer’s name is on it.' },
  { name: 'Live consultation', owner: 'human-signed', paid: true, why: 'Fully human. AI only shows the astrologer context on their own screen.' },
  { name: 'Remedies & muhurat', owner: 'human-signed', paid: true, why: 'Prescriptive, consequential, culturally weighted. Never model-generated.' },
  { name: 'Full synastry reading', owner: 'human-signed', paid: true, why: 'The monetised depth behind the free teaser.' },
]

/* ---------------- key handling (viewer-supplied only) ---------------- */

const KEY_STORE = 'sutra.byok'

export function getKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORE)
  } catch {
    return null
  }
}

export function setKey(k: string | null) {
  try {
    if (k && k.trim()) localStorage.setItem(KEY_STORE, k.trim())
    else localStorage.removeItem(KEY_STORE)
  } catch {
    /* private-mode browsers: live tier simply stays off */
  }
}

export function hasKey(): boolean {
  return !!getKey()
}

/* ---------------- prompts ---------------- */

function chartLine(c: Chart): string {
  return `${c.birth.name}: Sun ${c.sun.name}, Moon ${c.moon.name}, ${c.ascendant.name} rising (born ${c.birth.date} ${c.birth.time}, ${c.birth.place})`
}

export function transitPrompt(c: Chart, title: string, body: string): string {
  return `You are writing one day's astrology card for a user of an Indian astrology app.

Their chart: ${chartLine(c)}
Today's transit: ${title} — ${body}

Write 2-3 sentences, second person, warm but grounded. No emoji, no headings, no greeting.
This is a free daily card, so it must NOT give prescriptive advice about money, marriage, health
or legal matters — that is a paid human astrologer's job. Describe the texture of the day and,
at most, suggest what might be worth paying attention to.`
}

export function synastryPrompt(a: Chart, b: Chart, s: Synastry, relation: string): string {
  return `You are writing a free compatibility teaser for an Indian astrology app.

Person A — ${chartLine(a)}
Person B — ${chartLine(b)}
Relationship: ${relation}
Computed compatibility: ${s.score}/100
Strongest axis: ${[...s.aspects].sort((x, y) => y.score - x.score)[0].label} (${[...s.aspects].sort((x, y) => y.score - x.score)[0].score}/100)
Weakest axis: ${[...s.aspects].sort((x, y) => x.score - y.score)[0].label}

Write 3-4 sentences naming one genuine strength and one genuine friction, using both first names.
Be specific and even-handed — do not flatter. End by noting that the house overlay and the timing
of their next decision windows need a named astrologer. No emoji, no headings.`
}

export function memoryPrompt(query: string, corpus: string): string {
  return `Answer this question using ONLY the user's own past astrology consultations below.
Quote the astrologer who said it and the date. If the readings do not address the question,
say so plainly rather than inventing a reading.

Question: ${query}

Past consultations:
${corpus}`
}

/* ---------------- generation ---------------- */

export type AiSource = 'live' | 'prewritten'

export interface AiResult {
  text: string
  source: AiSource
  /** populated when the live tier was attempted and failed */
  error?: string
}

/**
 * Runs the live tier if the viewer supplied a key, otherwise returns the
 * pre-written text. A live failure degrades to pre-written rather than
 * surfacing an error state — a judge must never hit a dead end.
 */
export async function generate(prompt: string, fallback: string): Promise<AiResult> {
  const key = getKey()
  if (!key) return { text: fallback, source: 'prewritten' }

  try {
    const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true })
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024, // deliberately short output: these are 3-4 sentence cards
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: prompt }],
    })

    if (res.stop_reason === 'refusal') {
      return { text: fallback, source: 'prewritten', error: 'Model declined this request.' }
    }

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    return text ? { text, source: 'live' } : { text: fallback, source: 'prewritten' }
  } catch (err) {
    let msg = 'Could not reach the API.'
    if (err instanceof Anthropic.AuthenticationError) msg = 'That key was rejected.'
    else if (err instanceof Anthropic.RateLimitError) msg = 'Rate limited — try again shortly.'
    else if (err instanceof Anthropic.APIError) msg = `API error ${err.status}.`
    return { text: fallback, source: 'prewritten', error: msg }
  }
}

/* ---------------- pre-written fallbacks ---------------- */

export function prewrittenTransit(c: Chart, body: string): string {
  return `${body} With your ${c.moon.name} Moon, this lands more in the body than in the head — you may notice the mood before you can name the reason. Worth paying attention to what you find yourself avoiding today; that is usually the signal.`
}

export function prewrittenSynastry(a: Chart, b: Chart, s: Synastry): string {
  const ranked = [...s.aspects].sort((x, y) => y.score - x.score)
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const an = a.birth.name.split(' ')[0]
  const bn = b.birth.name.split(' ')[0]
  return `At ${s.score}/100, this reads as ${s.score >= 70 ? 'a genuinely workable pairing' : 'a pairing that will need deliberate effort'}. The strength sits in your ${best.label} — ${an}'s ${a.sun.element} temperament and ${bn}'s ${b.sun.element} one meet more easily here than most pairs manage. The friction is your ${worst.label}, and it will show up as the same argument recurring in different clothes. What this teaser cannot tell you is the house overlay, or when your next two decision windows open — that needs a named astrologer reading both charts side by side.`
}

export function prewrittenMemoryAnswer(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('career') || q.includes('job') || q.includes('work')) {
    return `Dr. Meera Iyer, 14 Mar 2026 (call, 14 min): "Do not resign in April. Renegotiate — the leverage is with you until the quarter closes." She also said your 10th house is "strong but slow — a two-year build, not a two-month one," and flagged 12 Sep 2026 as the date your decision window opens.`
  }
  if (q.includes('marriage') || q.includes('match') || q.includes('wedding')) {
    return `Acharya Ramesh Joshi, 2 May 2026 (chat, 22 min): "The Guna count is not your problem. The Mars placement is, and it is fixable." He set 21 Nov 2026 as the opening of the auspicious window for formalising.`
  }
  if (q.includes('money') || q.includes('property') || q.includes('buy') || q.includes('invest')) {
    return `Jyotish Guru Anand, 19 Jun 2026 (async voice note): "Buy, but not this quarter. You are two months early and it will cost you." He deferred your down payment to land near 28 Sep 2026, when Jupiter aspects your 2nd house.`
  }
  if (q.includes('relationship') || q.includes('partner') || q.includes('love')) {
    return `Tarot Nidhi Sharma, 27 Jul 2026 (chat, 11 min): "This is not a compatibility problem. It is a timing problem, and timing problems resolve." She marked 30 Aug 2026 — after Venus clears its retrograde shadow — as the point to raise the difficult conversation.`
  }
  return `Nothing in your four logged readings speaks directly to that. Your astrologers have covered career (Mar), marriage (May), property (Jun) and a relationship question (Jul). Ask one of them directly and it will be added here.`
}
