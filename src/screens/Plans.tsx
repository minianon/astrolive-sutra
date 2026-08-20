import { useNavigate } from 'react-router-dom'
import { PLANS } from '../lib/data'
import { useStore } from '../lib/store'
import { Note, Phone, SectionTitle } from '../ui/kit'

const CREDITS: Record<string, number> = { p0: 0, p1: 4, p2: 12, p3: 3 }

/**
 * Guidance Plans — the revenue architecture.
 *
 * AstroLive has already stated publicly that premium subscription tiers are on
 * its roadmap, so the contribution here is not the idea of subscribing; it is the
 * mechanism that makes flat pricing deliverable. A flat plan sold against purely
 * live human hours is a margin trap — you promise unlimited-ish access against a
 * supply you cannot scale. Async answers with an AI first draft break that: the
 * astrologer's marginal minute per answer falls far enough that a fixed price
 * clears, and the work lands in off-peak hours where capacity is otherwise idle.
 */
export default function Plans() {
  const { state, choosePlan } = useStore()
  const nav = useNavigate()

  return (
    <Phone tab="plans">
      <div className="pt-3">
        <h1 className="font-serif text-2xl font-bold">Guidance Plans</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-mute">
          The meter is not the only way to pay. Fixed prices, named astrologers, no clock.
        </p>
      </div>

      <div className="mt-4 space-y-2.5">
        {PLANS.map((p) => {
          const active = state.planId === p.id
          return (
            <div
              key={p.id}
              className={`card p-4 ${p.highlight ? 'border-marigold/40' : ''} ${active ? '!border-jade/50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-bold">{p.name}</span>
                    {p.highlight && !active && <span className="chip !border-marigold/40 !text-marigold">popular</span>}
                    {active && <span className="chip !border-jade/40 !text-jade">current</span>}
                  </div>
                  <div className="mt-0.5 text-[12px] text-mute">{p.tagline}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num font-serif text-xl font-bold">
                    {p.price === 0 ? 'Free' : `₹${p.price}`}
                  </div>
                  {p.price > 0 && (
                    <div className="text-[10px] text-mute">/{p.cadence === 'month' ? 'month' : 'pack'}</div>
                  )}
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                {p.includes.map((i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-snug">
                    <span className="mt-[3px] text-jade">✓</span>
                    <span className="text-chalk/85">{i}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 rounded-lg border border-edge bg-white/[0.03] px-3 py-2 text-[11px] leading-snug text-mute">
                {p.meterEquivalent}
              </div>

              {p.price > 0 && (
                <button
                  className={`${p.highlight ? 'btn-gold' : 'btn-ghost'} mt-3 w-full`}
                  onClick={() => { choosePlan(p.id, CREDITS[p.id] ?? 0); nav('/') }}
                >
                  {active ? 'Add another' : p.cadence === 'pack' ? 'Buy pack' : 'Start plan'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <SectionTitle>Why this is not just a discount</SectionTitle>
      <div className="card space-y-3 p-4 text-[12px] leading-relaxed text-mute">
        <p>
          <span className="font-semibold text-chalk">It removes the anxiety tax.</span> A per-minute
          meter charges people for thinking. Someone in genuine distress rushes the question, gets a
          worse answer, and remembers the platform as expensive.
        </p>
        <p>
          <span className="font-semibold text-chalk">It converts first-timers.</span> A fixed ₹249
          for three answers is a far easier first purchase than an open-ended meter, which is the
          single biggest barrier at the top of the funnel.
        </p>
        <p>
          <span className="font-semibold text-chalk">It breaks the supply ceiling.</span> Async work
          is time-shiftable. Live consults all pile into evening peak; async answers fill the
          daytime trough, so the same 1,500 astrologers serve materially more paying users.
        </p>
        <p>
          <span className="font-semibold text-chalk">It makes revenue predictable.</span> Per-minute
          revenue is a function of how anxious the country felt this month. Subscriptions are not.
        </p>
      </div>

      <Note>
        The margin on a fixed-price async answer only works because AI drafts the first pass and the
        astrologer edits rather than composes. That is the whole reason this tier is
        offerable — see the astrologer console for the supply-side view.
      </Note>
    </Phone>
  )
}
