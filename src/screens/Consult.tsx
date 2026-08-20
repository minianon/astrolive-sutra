import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ASTROLOGERS } from '../lib/data'
import { useStore } from '../lib/store'
import { Avatar, Note, Phone, SectionTitle } from '../ui/kit'

type Mode = 'meter' | 'pack'

/**
 * The consult screen, and the argument it makes.
 *
 * Two things are wrong with a per-minute meter as the only way to pay. First,
 * it taxes anxiety: the clock runs while a distressed user is still working out
 * how to phrase the question, so sessions get rushed and the perceived value
 * drops. Second, roughly the first three minutes of every live consult are spent
 * re-establishing context the platform already has — birth details, and what the
 * last astrologer said. This screen removes the second problem with preloaded
 * context, and offers a way out of the first with a fixed-price async answer.
 */
export default function Consult() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { state, chart, spendCredit } = useStore()
  const [mode, setMode] = useState<Mode>('pack')
  const [sent, setSent] = useState(false)
  const [draft, setDraft] = useState('')

  const who = ASTROLOGERS.find((a) => a.id === id)
  const ctx = useMemo(
    () => state.readings.find((r) => r.id === params.get('ctx')),
    [state.readings, params],
  )

  if (!who || !chart) return null

  function send() {
    if (mode === 'pack') {
      const ok = spendCredit()
      if (!ok) { nav('/plans'); return }
    }
    setSent(true)
  }

  return (
    <Phone tab="today">
      <div className="flex items-center gap-3 pt-3">
        <button onClick={() => nav(-1)} className="text-mute">‹</button>
        <Avatar name={who.name} hue={who.avatarHue} size={38} />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold">{who.name}</div>
          <div className="text-[11px] text-mute">
            {who.skills.slice(0, 2).join(' · ')} · {who.years}y · ★ {who.rating}
          </div>
        </div>
        <span className={`ml-auto chip ${who.online ? '!border-jade/40 !text-jade' : ''}`}>
          {who.online ? 'online' : `${who.asyncEta}h`}
        </span>
      </div>

      {/* what the astrologer already has — the capacity saving, shown to the user */}
      <SectionTitle>They already have</SectionTitle>
      <div className="card p-4">
        <div className="space-y-2 text-[12px]">
          <Row label="Your chart" value={`${chart.sun.name} ☉ · ${chart.moon.name} ☾ · ${chart.ascendant.name} ↑`} />
          <Row label="Born" value={`${chart.birth.date} · ${chart.birth.time} · ${chart.birth.place}`} />
          <Row label="Past readings" value={`${state.readings.length} logged`} />
          {ctx && (
            <Row
              label="This thread"
              value={`${ctx.topic} — ${new Date(ctx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            />
          )}
        </div>
        {ctx && (
          <div className="mt-3 rounded-xl border border-edge bg-white/[0.03] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
              What they told you last time
            </div>
            <p className="mt-1.5 font-serif text-[13px] leading-snug text-chalk/90">“{ctx.quotes[0]}”</p>
          </div>
        )}
        <Note>
          On AstroLive today, this is the part you would spend the first three or four paid minutes
          repeating. At ₹15/min that is roughly ₹50 of every call spent on data the platform already
          held — and, more importantly, three or four minutes of astrologer capacity that could
          have served the next person.
        </Note>
      </div>

      {/* how to pay */}
      <SectionTitle>How you want to ask</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('pack')}
          className={`card p-3 text-left transition ${mode === 'pack' ? '!border-marigold/60 bg-marigold/[0.07]' : ''}`}
        >
          <div className="text-[12px] font-semibold">Async answer</div>
          <div className="num mt-0.5 text-lg font-bold text-marigold">₹83</div>
          <div className="mt-1 text-[10px] leading-snug text-mute">
            Voice note back in {who.asyncEta}h. No clock. Take as long as you like writing it.
          </div>
        </button>
        <button
          onClick={() => setMode('meter')}
          className={`card p-3 text-left transition ${mode === 'meter' ? '!border-indigo-glow/60 bg-indigo-deep/10' : ''}`}
        >
          <div className="text-[12px] font-semibold">Live call</div>
          <div className="num mt-0.5 text-lg font-bold">₹{who.ratePerMin}<span className="text-[11px] font-normal text-mute">/min</span></div>
          <div className="mt-1 text-[10px] leading-snug text-mute">
            Immediate, but the meter runs from the moment they pick up.
          </div>
        </button>
      </div>

      {mode === 'pack' && (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-edge bg-white/[0.03] px-3 py-2 text-[11px]">
          <span className="text-mute">Async answers left on your plan</span>
          <span className="num font-semibold text-marigold">{state.asyncCredits}</span>
        </div>
      )}

      {/* compose */}
      {!sent ? (
        <>
          <SectionTitle>Your question</SectionTitle>
          <div className="card p-3">
            <textarea
              className="field min-h-[92px] resize-none"
              placeholder={ctx ? `Following up on what you said about ${ctx.topic.toLowerCase()}…` : 'Type your question…'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="btn-gold mt-3 w-full" disabled={!draft.trim()} onClick={send}>
              {mode === 'pack'
                ? state.asyncCredits > 0 ? 'Send — uses 1 async answer' : 'Get async answers →'
                : `Start call at ₹${who.ratePerMin}/min`}
            </button>
            {mode === 'pack' && (
              <p className="mt-2 text-center text-[10px] text-mute">
                AI drafts a first pass from your chart. {who.name.split(' ').slice(-1)} edits it and
                records the voice note in their own voice — nothing reaches you unreviewed.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="card mt-4 p-5 text-center rise">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-jade/15 text-lg text-jade">✓</div>
          <div className="font-serif text-lg font-semibold">Sent to {who.name.split(' ').slice(-1)}</div>
          <p className="mx-auto mt-1.5 max-w-[260px] text-[12px] leading-relaxed text-mute">
            AI has drafted a first pass from your chart and your past readings. It sits in their queue
            for review — you will get a voice note within {who.asyncEta} hours, signed by them.
          </p>
          <Link to="/astrologer" className="btn-ghost mt-4 !text-[12px]">
            See this from the astrologer’s side →
          </Link>
        </div>
      )}
    </Phone>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-mute">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
