import { useMemo, useState } from 'react'
import { BENCHMARKS } from '../lib/data'
import { Bars, Console, Note, Stat } from '../ui/kit'

/**
 * The growth model.
 *
 * Deliberately not flattering. The defaults produce a viral coefficient well
 * BELOW 1, because almost every real referral loop does, and a prototype
 * claiming runaway virality would be the fastest way to lose credibility with
 * judges who run this business. Sub-1 K does not compound to infinity — it acts
 * as a permanent multiplier on paid acquisition, which is exactly the lever a
 * company with no institutional funding needs. Every input is editable so a
 * sceptical reader can drive the assumptions down and see what survives.
 */

interface Inputs {
  paidNew: number
  relationalShare: number
  invitesPerAsker: number
  sendRate: number
  acceptRate: number
  cac: number
  atv: number
  repeatNow: number
  repeatHabit: number
}

const DEFAULTS: Inputs = {
  paidNew: 25000,
  relationalShare: 0.50,
  invitesPerAsker: 1.6,
  sendRate: 0.60,
  acceptRate: 0.45,
  cac: 750,
  atv: 230,
  repeatNow: 0.27,
  repeatHabit: 0.44,
}

const FIELDS: { key: keyof Inputs; label: string; min: number; max: number; step: number; pct?: boolean; hint: string }[] = [
  { key: 'paidNew', label: 'Paid new users / month', min: 5000, max: 100000, step: 1000, hint: 'Acquisition you are already buying.' },
  { key: 'relationalShare', label: 'Share asking a relational question', min: 0.1, max: 0.9, step: 0.01, pct: true, hint: 'Marriage, partner and family questions dominate Indian astrology demand.' },
  { key: 'invitesPerAsker', label: 'Invites sent per asker', min: 1, max: 4, step: 0.1, hint: 'A user may check a partner, then a parent, then a co-founder.' },
  { key: 'sendRate', label: 'Of those, actually send', min: 0.1, max: 0.95, step: 0.01, pct: true, hint: 'Higher than a normal referral banner because the reading is locked until they do.' },
  { key: 'acceptRate', label: 'Invite acceptance rate', min: 0.05, max: 0.9, step: 0.01, pct: true, hint: 'A personal message from a partner or parent, not a marketing push.' },
  { key: 'cac', label: 'Paid CAC (₹)', min: 200, max: 1500, step: 25, hint: 'Category benchmark is ₹600–900.' },
  { key: 'atv', label: 'Average transaction value (₹)', min: 80, max: 600, step: 10, hint: 'Astrotalk reports ≈₹230.' },
  { key: 'repeatNow', label: 'Repeat rate today', min: 0.05, max: 0.6, step: 0.01, pct: true, hint: 'Category leader sits at 25–30%.' },
  { key: 'repeatHabit', label: 'Repeat rate with the habit loop', min: 0.1, max: 0.8, step: 0.01, pct: true, hint: 'Duolingo cut churn from 47% to 28% with streaks; this assumes a smaller gain.' },
]

export default function Growth() {
  const [inp, setInp] = useState<Inputs>(DEFAULTS)

  const m = useMemo(() => {
    const k = inp.relationalShare * inp.invitesPerAsker * inp.sendRate * inp.acceptRate
    const amplification = k < 1 ? 1 / (1 - k) : Infinity
    const organic = Math.round(inp.paidNew * k)
    const totalNew = inp.paidNew + organic
    const blendedCac = Math.round((inp.paidNew * inp.cac) / Math.max(totalNew, 1))
    const cacSaved = Math.round((inp.cac - blendedCac) * totalNew)

    const txNow = 1 / (1 - inp.repeatNow)
    const txHabit = 1 / (1 - inp.repeatHabit)
    const ltvLift = txHabit / txNow - 1

    const ltvNow = inp.atv * txNow
    const ltvNew = inp.atv * txHabit
    const ratioNow = ltvNow / inp.cac
    const ratioNew = ltvNew / blendedCac

    return { k, amplification, organic, totalNew, blendedCac, cacSaved, txNow, txHabit, ltvLift, ltvNow, ltvNew, ratioNow, ratioNew }
  }, [inp])

  const funnel = [
    { label: 'new', a: inp.paidNew },
    { label: 'ask relational', a: Math.round(inp.paidNew * inp.relationalShare) },
    { label: 'invites sent', a: Math.round(inp.paidNew * inp.relationalShare * inp.invitesPerAsker * inp.sendRate) },
    { label: 'accepted', a: m.organic },
  ]

  return (
    <Console
      title="Growth model"
      sub="Every input is editable. The defaults are chosen to be defensible rather than impressive — push them down and see what still holds."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Viral coefficient (K)" value={m.k.toFixed(3)}
          sub={m.k >= 1 ? 'above 1 — self-sustaining' : 'below 1 — a multiplier on paid, not a runaway loop'}
          tone={m.k >= 0.2 ? 'good' : 'default'} />
        <Stat label="Organic users / month" value={m.organic.toLocaleString('en-IN')} sub="acquired at ≈₹0 marginal cost" tone="good" />
        <Stat label="Blended CAC" value={`₹${m.blendedCac}`} sub={`down from ₹${inp.cac}`} tone="good" />
        <Stat label="LTV : CAC" value={`${m.ratioNew.toFixed(2)}×`} sub={`from ${m.ratioNow.toFixed(2)}× today`} tone={m.ratioNew >= 3 ? 'good' : 'warn'} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* inputs */}
        <div className="card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Assumptions</h2>
          <div className="mt-4 space-y-4">
            {FIELDS.map((f) => {
              const v = inp[f.key]
              return (
                <div key={f.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <label className="text-[12px] font-medium">{f.label}</label>
                    <span className="num text-[12px] font-semibold text-marigold">
                      {f.pct ? `${Math.round(v * 100)}%` : v.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range" min={f.min} max={f.max} step={f.step} value={v}
                    onChange={(e) => setInp({ ...inp, [f.key]: Number(e.target.value) })}
                    className="mt-1.5 w-full accent-marigold"
                  />
                  <p className="mt-1 text-[10.5px] leading-snug text-mute">{f.hint}</p>
                </div>
              )
            })}
          </div>
          <button className="btn-ghost mt-5 w-full !text-[12px]" onClick={() => setInp(DEFAULTS)}>
            Reset to defaults
          </button>
        </div>

        {/* outputs */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">The invite funnel</h2>
            <div className="mt-4"><Bars data={funnel} /></div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-mute">
              K = relational share × invites per asker × send rate × acceptance rate ={' '}
              <span className="num text-chalk">
                {inp.relationalShare.toFixed(2)} × {inp.invitesPerAsker.toFixed(1)} × {inp.sendRate.toFixed(2)} × {inp.acceptRate.toFixed(2)} = {m.k.toFixed(3)}
              </span>
              . At that level the loop is not self-sustaining, and the honest claim is not
              "exponential growth" — it is that every paid user now brings{' '}
              <span className="text-chalk">{m.k.toFixed(2)}</span> more for free, which drags
              blended CAC from ₹{inp.cac} to{' '}
              <span className="text-chalk">₹{m.blendedCac}</span> and compounds into a{' '}
              <span className="text-chalk">{m.amplification.toFixed(2)}×</span> multiplier on
              everything acquisition already buys.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
              Why this matters more here than at Astrotalk
            </h2>
            <p className="mt-3 text-[12.5px] leading-relaxed text-mute">
              Reaching the stated target of 10 lakh paid users from ~1 lakh means roughly 900,000
              net new paid users. At the category CAC of ₹600–900 that is{' '}
              <span className="text-chalk">₹54–81 crore</span> of pure acquisition spend. Astrotalk
              funds ₹236–296 crore of annual marketing out of ₹1,214 crore of revenue; AstroLive has
              raised no disclosed institutional funding. At the blended CAC above, the same 900,000
              users cost{' '}
              <span className="num text-chalk">
                ₹{Math.round((900000 * m.blendedCac) / 1e7)} crore
              </span>{' '}
              instead of{' '}
              <span className="num text-chalk">₹{Math.round((900000 * inp.cac) / 1e7)} crore</span> —
              a saving of{' '}
              <span className="num text-marigold">
                ₹{Math.round((900000 * (inp.cac - m.blendedCac)) / 1e7)} crore
              </span>
              . That gap is the difference between a plan that needs a funding round and one that
              does not.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
              Retention is the larger prize
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Stat label="Txns / user today" value={m.txNow.toFixed(2)} sub={`at ${Math.round(inp.repeatNow * 100)}% repeat`} />
              <Stat label="With habit loop" value={m.txHabit.toFixed(2)} sub={`at ${Math.round(inp.repeatHabit * 100)}% repeat`} tone="good" />
              <Stat label="LTV lift" value={`+${Math.round(m.ltvLift * 100)}%`} sub="relative, independent of absolute ARPU" tone="good" />
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-mute">
              The category leader's repeat rate is 25–30%, which means roughly{' '}
              <span className="text-chalk">70–75% of paying users transact once and never
              return</span> — in the best product in the market. Nothing else in this model is worth
              as much as moving that number, and it is the metric the daily transit card and the
              watch-day callbacks exist to move.
            </p>
          </div>
        </div>
      </div>

      {/* sources */}
      <h2 className="mb-3 mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
        Every figure, and where it came from
      </h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-edge text-[10px] uppercase tracking-wider text-mute">
              <th className="p-3 font-semibold">Metric</th>
              <th className="p-3 font-semibold">Value</th>
              <th className="p-3 font-semibold">Basis</th>
              <th className="p-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((b) => (
              <tr key={b.label} className="border-b border-edge/50 last:border-0">
                <td className="p-3 font-medium">{b.label}</td>
                <td className="num p-3 text-marigold">{b.value}</td>
                <td className="p-3">
                  <span className={`chip ${
                    b.basis === 'peer-reviewed' ? '!border-jade/40 !text-jade'
                    : b.basis === 'company-reported' ? '!border-indigo-glow/40 !text-indigo-glow' : ''
                  }`}>
                    {b.basis}
                  </span>
                </td>
                <td className="p-3 text-mute">{b.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Note>
        Figures marked <em>third-party estimate</em> come from published analyses and case studies,
        not company filings, and are treated as indicative rather than audited. They are labelled
        that way here and in the report on purpose — a growth case built on numbers presented as
        more certain than they are is not worth making.
      </Note>
    </Console>
  )
}
