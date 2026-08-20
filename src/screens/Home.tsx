import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { ASTROLOGERS, TRANSITS } from '../lib/data'
import { generate, prewrittenTransit, transitPrompt, type AiSource } from '../lib/ai'
import { AiBadge, Avatar, KeyBox, Note, Phone, SectionTitle } from '../ui/kit'
import { ELEMENT_COLOR } from '../lib/chart'

function fmt(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/**
 * The habit surface.
 *
 * The retention argument this screen embodies: a generic daily horoscope is a
 * commodity and retains nobody. What retains is a daily card tied to *this*
 * user's chart, and — critically — watch-days that trace back to something a
 * named astrologer actually told them months ago. That callback is the reason to
 * open the app on a day when nothing is wrong, which is precisely the behaviour
 * the category's ~25-30% repeat rate says is missing.
 */
export default function Home() {
  const { state, chart, checkIn } = useStore()
  const [ai, setAi] = useState<{ text: string; source: AiSource; error?: string } | null>(null)

  const today = TRANSITS[0]
  const upcoming = useMemo(() => TRANSITS.filter((t) => t.offset > 0).slice(0, 4), [])
  const nextLinked = upcoming.find((t) => t.fromReadingId)
  const linkedReading = state.readings.find((r) => r.id === nextLinked?.fromReadingId)

  // one check-in per calendar day; the streak is the free, zero-marginal-cost hook
  useEffect(() => { checkIn() }, [checkIn])

  useEffect(() => {
    if (!chart) return
    let live = true
    generate(
      transitPrompt(chart, today.title, today.body),
      prewrittenTransit(chart, today.body),
    ).then((r) => { if (live) setAi(r) })
    return () => { live = false }
  }, [chart, today.title, today.body])

  if (!chart) return null
  const first = chart.birth.name.split(' ')[0]

  return (
    <Phone tab="today">
      {/* header */}
      <div className="flex items-center justify-between pt-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-mute">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="font-serif text-2xl font-bold">Namaste, {first}</h1>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-saffron/30 bg-saffron/10 px-3 py-1.5">
          <span className="num text-lg font-bold leading-none text-marigold">{state.streak}</span>
          <span className="text-[9px] uppercase tracking-wider text-saffron/80">day streak</span>
        </div>
      </div>

      {/* chart strip */}
      <div className="mt-4 flex gap-2">
        {[
          { k: 'Sun', s: chart.sun }, { k: 'Moon', s: chart.moon }, { k: 'Rising', s: chart.ascendant },
        ].map(({ k, s }) => (
          <div key={k} className="card flex-1 p-2.5 text-center">
            <div className={`text-lg ${ELEMENT_COLOR[s.element]}`}>{s.glyph}</div>
            <div className="mt-0.5 text-[11px] font-semibold">{s.name}</div>
            <div className="text-[9px] uppercase tracking-wider text-mute">{k}</div>
          </div>
        ))}
      </div>

      {/* today's AI card */}
      <SectionTitle>Today for your chart</SectionTitle>
      <div className="card p-4 rise">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-deep/30 text-base">☾</div>
          <div>
            <div className="font-semibold">{today.title}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-mute">
              house {today.house} · {today.intensity} intensity
            </div>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-chalk/90">
          {ai?.text ?? <span className="text-mute">Reading your chart…</span>}
        </p>
        {ai && <AiBadge source={ai.source} error={ai.error} />}
      </div>
      <KeyBox compact />

      {/* watch days — the callback that earns the re-open */}
      <SectionTitle right={<Link to="/memory" className="text-[11px] text-indigo-glow">all readings →</Link>}>
        Your watch days
      </SectionTitle>
      <Note>
        These dates were not generated. Each one is a date a named astrologer gave you in a past
        consultation, extracted from their notes and put on your calendar.
      </Note>
      <div className="mt-3 space-y-2">
        {upcoming.map((t) => {
          const src = state.readings.find((r) => r.id === t.fromReadingId)
          const who = src ? ASTROLOGERS.find((a) => a.id === src.astrologerId) : null
          return (
            <div key={t.offset} className="card p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-semibold text-[13px]">{t.title}</div>
                <div className="num shrink-0 text-[11px] text-marigold">{fmt(t.offset)}</div>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-mute">{t.body}</p>
              {who && (
                <Link
                  to={`/consult/${who.id}?ctx=${t.fromReadingId}`}
                  className="mt-2.5 flex items-center gap-2 rounded-lg border border-edge bg-white/[0.03] p-2 transition hover:bg-white/[0.06]"
                >
                  <Avatar name={who.name} hue={who.avatarHue} size={26} />
                  <span className="text-[11px] leading-tight">
                    <span className="text-mute">Ask </span>
                    <span className="font-semibold">{who.name.split(' ').slice(-1)}</span>
                    <span className="text-mute"> about this — they already have the context</span>
                  </span>
                  <span className="ml-auto text-mute">›</span>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* re-entry */}
      <SectionTitle>Continue where you left off</SectionTitle>
      {linkedReading && (() => {
        const who = ASTROLOGERS.find((a) => a.id === linkedReading.astrologerId)!
        return (
          <Link to={`/consult/${who.id}?ctx=${linkedReading.id}`} className="card flex items-center gap-3 p-3.5">
            <Avatar name={who.name} hue={who.avatarHue} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{who.name}</div>
              <div className="truncate text-[11px] text-mute">
                {linkedReading.topic} · {new Date(linkedReading.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <span className={`ml-auto chip ${who.online ? '!border-jade/40 !text-jade' : ''}`}>
              {who.online ? 'online' : `async ${who.asyncEta}h`}
            </span>
          </Link>
        )
      })()}

      <Link to="/circles" className="btn-primary mt-4 w-full">Check compatibility with someone →</Link>
    </Phone>
  )
}
