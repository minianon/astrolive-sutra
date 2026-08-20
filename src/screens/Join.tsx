import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { decodeInvite, RELATION_LABEL } from '../lib/invite'
import { computeChart, ELEMENT_COLOR, synastry } from '../lib/chart'
import { useStore } from '../lib/store'
import { generate, prewrittenSynastry, synastryPrompt, type AiSource } from '../lib/ai'
import { AiBadge, Meter, Note, Phone, SectionTitle } from '../ui/kit'

/**
 * The invite landing page — the single most important screen in this prototype.
 *
 * It must work for a stranger: no account, no prior localStorage, a browser that
 * has never seen this origin. Everything it needs about the inviter arrives in
 * the URL fragment. If the visitor has not onboarded, we send them to
 * `/onboard?next=` and come straight back here, so the acquisition path ends in
 * a completed profile rather than a bounce.
 */
export default function Join() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { chart, onboarded, addCircle, state } = useStore()
  const [ai, setAi] = useState<{ text: string; source: AiSource; error?: string } | null>(null)

  const invite = useMemo(() => decodeInvite(params.get('i')), [params])
  const inviterChart = useMemo(() => (invite ? computeChart(invite.from) : null), [invite])
  const pair = useMemo(
    () => (inviterChart && chart ? synastry(inviterChart, chart) : null),
    [inviterChart, chart],
  )

  // Record the circle on the joiner's side too, so it shows up in their app.
  const alreadyLogged = state.circles.some((c) => c.other.name === invite?.from.name)
  useEffect(() => {
    if (invite && chart && !alreadyLogged) {
      addCircle({
        other: invite.from,
        relation: invite.relation,
        question: invite.question,
        status: 'joined',
      })
    }
  }, [invite, chart, alreadyLogged, addCircle])

  useEffect(() => {
    if (!inviterChart || !chart || !pair) return
    let live = true
    generate(
      synastryPrompt(inviterChart, chart, pair, RELATION_LABEL[invite!.relation]),
      prewrittenSynastry(inviterChart, chart, pair),
    ).then((r) => { if (live) setAi(r) })
    return () => { live = false }
  }, [inviterChart, chart, pair, invite])

  /* --- malformed or missing token --- */
  if (!invite || !inviterChart) {
    return (
      <Phone>
        <div className="pt-10 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-xl">⧉</div>
          <h1 className="font-serif text-2xl font-bold">This link has expired</h1>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-mute">
            The invite could not be read. Ask whoever sent it to generate a fresh one.
          </p>
          <Link to="/" className="btn-ghost mt-5">Open AstroLive Sutra</Link>
        </div>
      </Phone>
    )
  }

  const inviterFirst = invite.from.name.split(' ')[0]

  /* --- the acquisition moment: locked until the visitor adds their own chart --- */
  if (!onboarded || !chart || !pair) {
    return (
      <Phone>
        <div className="pt-6 rise">
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-marigold to-saffron text-2xl text-night pulse-ring">
              ⧉
            </div>
            <h1 className="font-serif text-[26px] font-bold leading-tight">
              {inviterFirst} wants to read your charts together
            </h1>
            <p className="mt-2 text-[13px] text-mute">
              as {RELATION_LABEL[invite.relation].toLowerCase()}
            </p>
          </div>

          <div className="card mt-5 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
              Their question
            </div>
            <p className="mt-1.5 font-serif text-[17px] leading-snug">“{invite.question}”</p>
          </div>

          <div className="card mt-3 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
              {invite.from.name}’s chart
            </div>
            <div className="flex gap-2">
              {[
                { k: 'Sun', s: inviterChart.sun },
                { k: 'Moon', s: inviterChart.moon },
                { k: 'Rising', s: inviterChart.ascendant },
              ].map(({ k, s }) => (
                <div key={k} className="flex-1 rounded-xl border border-edge bg-white/[0.03] p-2.5 text-center">
                  <div className={`text-lg ${ELEMENT_COLOR[s.element]}`}>{s.glyph}</div>
                  <div className="mt-0.5 text-[11px] font-semibold">{s.name}</div>
                  <div className="text-[9px] uppercase tracking-wider text-mute">{k}</div>
                </div>
              ))}
            </div>

            {/* the locked half — visible, deliberately */}
            <div className="relative mt-3 overflow-hidden rounded-xl border border-edge">
              <div className="select-none p-4 blur-[5px]">
                <div className="text-[13px] leading-relaxed text-mute">
                  Your Sun sits opposite theirs across the seventh house, which is why the
                  attraction reads as effortless and the disagreements read as structural…
                </div>
              </div>
              <div className="absolute inset-0 grid place-items-center bg-night/70">
                <div className="text-center">
                  <div className="text-lg">🔒</div>
                  <div className="mt-1 text-[11px] font-semibold">Needs your chart</div>
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn-gold mt-4 w-full"
            onClick={() => nav(`/onboard?next=${encodeURIComponent(`/join?i=${params.get('i')}`)}`)}
          >
            Add my birth details — free
          </button>
          <p className="mt-2 text-center text-[11px] text-mute">
            Takes 20 seconds. No payment, no account.
          </p>

          <Note>
            <strong>Why this is the growth engine:</strong> the reading is about two people, so it
            cannot be completed alone. {inviterFirst} is not asking for a favour — they are offering
            an answer this visitor also wants. The visitor arrives with full birth details already
            filled in, which is a materially better signup than a paid install at the category CAC
            of ₹600–900.
          </Note>
        </div>
      </Phone>
    )
  }

  /* --- unlocked: both charts present --- */
  return (
    <Phone tab="circles">
      <div className="pt-4 rise">
        <div className="text-center">
          <div className="chip !border-jade/40 !text-jade">✓ both charts in</div>
          <h1 className="mt-3 font-serif text-2xl font-bold">
            {inviterFirst} &amp; {chart.birth.name.split(' ')[0]}
          </h1>
          <div className="num mt-3 font-serif text-6xl font-bold text-marigold">{pair.score}</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-mute">out of 100</div>
          <p className="mx-auto mt-2 max-w-[280px] font-serif text-[15px] leading-snug text-chalk/90">
            {pair.headline}
          </p>
        </div>

        <div className="card mt-5 p-4">
          <p className="text-[13px] leading-relaxed text-chalk/90">
            {ai?.text ?? <span className="text-mute">Reading both charts…</span>}
          </p>
          {ai && <AiBadge source={ai.source} error={ai.error} />}
        </div>

        <SectionTitle>The axes</SectionTitle>
        <div className="card space-y-3.5 p-4">
          {pair.aspects.map((a) => (
            <div key={a.label}>
              <Meter value={a.score} label={a.label} />
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-mute">{a.detail}</p>
            </div>
          ))}
        </div>

        {/* the monetised depth behind the free teaser */}
        <SectionTitle>What this cannot tell you</SectionTitle>
        <div className="card border-marigold/25 p-4">
          <p className="text-[13px] leading-relaxed text-chalk/90">{pair.depthTeaser}</p>
          <Link to="/plans" className="btn-gold mt-3.5 w-full">
            Have an astrologer read this properly
          </Link>
          <p className="mt-2 text-center text-[10px] text-mute">
            Signed by a named astrologer. No per-minute clock.
          </p>
        </div>

        <Note>
          Both people now have this circle saved permanently. Every future reading about this
          relationship attaches here — which is the switching cost the report calls Sutra Memory.
        </Note>
      </div>
    </Phone>
  )
}
