import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ASTROLOGERS } from '../lib/data'
import { useStore } from '../lib/store'
import { generate, memoryPrompt, prewrittenMemoryAnswer, type AiSource } from '../lib/ai'
import { AiBadge, Avatar, Note, Phone, SectionTitle } from '../ui/kit'

const SUGGESTED = [
  'What did astrologers say about my career?',
  'What was I told about the property purchase?',
  'Which dates was I told to avoid?',
]

/**
 * Sutra Memory — the USP, and the only module here that is a moat rather than a
 * tactic.
 *
 * Every competitor treats a consultation as a disposable transaction: the call
 * ends, the advice evaporates, and the user's history is at best a billing log.
 * That is why switching platforms costs a user nothing today. Making the record
 * durable, searchable, and portable across astrologers inverts it — after four
 * readings, leaving means abandoning the only place your own guidance is written
 * down. Note also that memory search is AI-owned but returns *the human's own
 * past words with attribution*; it never invents a new judgement.
 */
export default function Memory() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [asked, setAsked] = useState<string | null>(null)
  const [ai, setAi] = useState<{ text: string; source: AiSource; error?: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!asked) return
    let live = true
    setBusy(true)
    const corpus = state.readings
      .map((r) => {
        const who = ASTROLOGERS.find((a) => a.id === r.astrologerId)?.name ?? 'Astrologer'
        return `[${r.date}] ${who} (${r.mode}, ${r.topic}): ${r.summary} Quotes: ${r.quotes.join(' | ')}`
      })
      .join('\n')
    generate(memoryPrompt(asked, corpus), prewrittenMemoryAnswer(asked)).then((r) => {
      if (live) { setAi(r); setBusy(false) }
    })
    return () => { live = false }
  }, [asked, state.readings])

  const spend = state.readings.reduce((a, r) => a + r.cost, 0)
  const mins = state.readings.reduce((a, r) => a + r.minutes, 0)

  return (
    <Phone tab="memory">
      <div className="pt-3">
        <h1 className="font-serif text-2xl font-bold">Sutra Memory</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-mute">
          Every reading you have ever had, kept and searchable — across astrologers.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { l: 'readings', v: String(state.readings.length) },
          { l: 'minutes', v: String(mins) },
          { l: 'spent', v: `₹${spend}` },
        ].map((s) => (
          <div key={s.l} className="card p-2.5 text-center">
            <div className="num font-serif text-lg font-bold text-marigold">{s.v}</div>
            <div className="text-[9px] uppercase tracking-wider text-mute">{s.l}</div>
          </div>
        ))}
      </div>

      {/* semantic search */}
      <SectionTitle>Ask your own history</SectionTitle>
      <div className="card p-3.5">
        <div className="flex gap-2">
          <input
            className="field !py-2.5 !text-[13px]"
            placeholder="What did they say about…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) setAsked(q.trim()) }}
          />
          <button className="btn-primary !px-3.5 !py-2.5 !text-[12px]" disabled={!q.trim()}
            onClick={() => setAsked(q.trim())}>
            Ask
          </button>
        </div>

        {!asked && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SUGGESTED.map((s) => (
              <button key={s} className="chip hover:text-chalk"
                onClick={() => { setQ(s); setAsked(s) }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {asked && (
          <div className="mt-3 rounded-xl border border-edge bg-white/[0.03] p-3 rise">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
              from your own readings
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-chalk/90">
              {busy ? <span className="text-mute">Searching four readings…</span> : ai?.text}
            </p>
            {ai && !busy && <AiBadge source={ai.source} error={ai.error} />}
          </div>
        )}
      </div>

      {/* the log */}
      <SectionTitle>Timeline</SectionTitle>
      <div className="space-y-2">
        {state.readings.map((r) => {
          const who = ASTROLOGERS.find((a) => a.id === r.astrologerId)
          return (
            <div key={r.id} className="card p-3.5">
              <div className="flex items-center gap-2.5">
                {who && <Avatar name={who.name} hue={who.avatarHue} size={30} />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold">{who?.name}</div>
                  <div className="text-[10px] text-mute">
                    {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{r.mode}{r.minutes ? ` · ${r.minutes} min` : ''}
                  </div>
                </div>
                <span className="chip shrink-0">{r.topic}</span>
              </div>

              <p className="mt-2.5 text-[12px] leading-relaxed text-mute">{r.summary}</p>

              {r.quotes[0] && (
                <p className="mt-2 border-l-2 border-marigold/40 pl-2.5 font-serif text-[12.5px] leading-snug text-chalk/90">
                  “{r.quotes[0]}”
                </p>
              )}

              {r.watchDays.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {r.watchDays.map((w) => (
                    <span key={w.date} className="chip !border-marigold/30 !text-marigold">
                      ⌖ {new Date(w.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  ))}
                </div>
              )}

              {who && (
                <Link to={`/consult/${who.id}?ctx=${r.id}`}
                  className="mt-2.5 block text-[11px] text-indigo-glow">
                  Continue this thread →
                </Link>
              )}
            </div>
          )
        })}
      </div>

      <Note>
        This is the switching cost. A user four readings deep cannot move to another platform
        without abandoning the only written record of their own guidance — and unlike a wallet
        balance, it grows every time they use the product.
      </Note>
    </Phone>
  )
}
