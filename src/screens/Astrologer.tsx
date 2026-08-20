import { useState } from 'react'
import { Bars, Console, Note, Stat } from '../ui/kit'

/**
 * The astrologer console — the supply-side view.
 *
 * This is the screen that separates the submission from "we added a chatbot".
 * AstroLive runs roughly 100,000 paid users against 1,500 astrologers (~67:1);
 * Astrotalk runs 1.5M against 41,000 (~37:1). AstroLive's astrologers already
 * carry close to double the load, so the binding constraint on growth is supply,
 * not demand — and you cannot recruit 13,500 more astrologers faster than you can
 * acquire users. The only lever left is throughput per astrologer, which is
 * exactly what Brynjolfsson, Li & Raymond measured: +14% on average and +34% for
 * novices across 5,179 support agents. The novice figure is the relevant one when
 * you are scaling a roster from 1,500.
 */

interface QueueItem {
  id: string
  user: string
  topic: string
  chart: string
  question: string
  draft: string
  context: string
  status: 'pending' | 'signed'
}

const QUEUE: QueueItem[] = [
  {
    id: 'q1', user: 'Tushar B.', topic: 'Career', chart: 'Leo ☉ · Scorpio ☾ · Virgo ↑',
    question: 'Should I take the offer or wait for the Saturn transit you mentioned in March?',
    context: 'Told 14 Mar: "Do not resign in April. Renegotiate — leverage is with you until the quarter closes." Watch-day set for 12 Sep.',
    draft: 'You are asking two months early, which is consistent with how your chart handles pressure. The 12 September window I flagged in March still holds — Saturn enters your 10th house then, and decisions taken inside that window tend to stick for you. If the offer has a deadline before that, treat it as a negotiating position rather than a decision. Ask them to hold it three weeks; if they refuse, that itself is information about the role.',
    status: 'pending',
  },
  {
    id: 'q2', user: 'Priya S.', topic: 'Marriage', chart: 'Pisces ☉ · Taurus ☾ · Libra ↑',
    question: 'My family wants to finalise in October. Is that window alright?',
    context: 'Kundli Milan done 2 May. Mangal Dosha flagged, remedy prescribed. Auspicious window opens 21 Nov.',
    draft: 'October falls before the window I gave you on 2 May. The Mars placement we discussed is the reason — the remedy needs to complete before formalising, not alongside it. 21 November onwards is clean, and there are three suitable dates in that month. If the family pressure is about the wedding season rather than the specific date, that is worth separating out before you push back.',
    status: 'pending',
  },
  {
    id: 'q3', user: 'Rahul M.', topic: 'Money', chart: 'Capricorn ☉ · Gemini ☾ · Aries ↑',
    question: 'Is this a good time to move the SIP into something more aggressive?',
    context: 'First-time user. No prior readings.',
    draft: 'Your second house is active but unsettled through the next quarter, which historically shows up for Capricorn Sun as a pull towards bigger bets at exactly the wrong moment. I would not increase risk before the end of October. I am also going to be direct with you: I read charts, not markets — take the timing from me and the instrument from someone qualified to advise on it.',
    status: 'pending',
  },
]

/** Live consults cluster in the evening; async work is time-shiftable. */
const UTILISATION = [
  { label: '9a', a: 12, b: 34 }, { label: '11a', a: 18, b: 41 }, { label: '1p', a: 22, b: 46 },
  { label: '3p', a: 26, b: 52 }, { label: '5p', a: 48, b: 61 }, { label: '7p', a: 88, b: 91 },
  { label: '9p', a: 94, b: 96 }, { label: '11p', a: 61, b: 74 },
]

export default function AstrologerConsole() {
  const [queue, setQueue] = useState(QUEUE)
  const [openId, setOpenId] = useState<string | null>('q1')
  const [edits, setEdits] = useState<Record<string, string>>({})

  const open = queue.find((q) => q.id === openId)
  const signed = queue.filter((q) => q.status === 'signed').length

  return (
    <Console
      title="Astrologer console"
      sub="The supply side. AstroLive runs roughly 67 paid users per astrologer against Astrotalk's 37, so throughput per astrologer — not user acquisition — is the binding constraint on growth. Everything here exists to raise it without asking anyone to trust a machine's judgement."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Async queue" value={String(queue.length - signed)} sub="drafted, awaiting your review" />
        <Stat label="Signed today" value={String(signed + 14)} sub="voice notes sent" tone="good" />
        <Stat label="Avg review time" value="72s" sub="vs ~9 min composing from scratch" tone="good" />
        <Stat label="Off-peak fill" value="+34%" sub="daytime capacity now earning" tone="good" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* queue */}
        <div>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Review queue</h2>
          <div className="space-y-2">
            {queue.map((q) => (
              <button
                key={q.id}
                onClick={() => setOpenId(q.id)}
                className={`card w-full p-3.5 text-left transition ${openId === q.id ? '!border-indigo-glow/50' : 'hover:border-edge'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{q.user}</span>
                  <span className={`chip shrink-0 ${q.status === 'signed' ? '!border-jade/40 !text-jade' : ''}`}>
                    {q.status === 'signed' ? '✓ signed' : q.topic}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-mute">{q.chart}</div>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-chalk/80">{q.question}</p>
              </button>
            ))}
          </div>

          <h2 className="mb-3 mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
            Your hours, filled
          </h2>
          <div className="card p-4">
            <Bars data={UTILISATION} unit="%" />
            <div className="mt-3 flex items-center gap-4 text-[10px] text-mute">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded bg-white/[0.12]" /> live only (today)</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded bg-indigo-glow" /> with async</span>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-mute">
              Live demand is nearly all evening. Async answers are time-shiftable, so they fill the
              daytime trough — the same roster earns across more of the day without anyone working
              longer hours.
            </p>
          </div>
        </div>

        {/* draft review */}
        <div>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
            AI draft — yours to approve
          </h2>
          {open && (
            <div className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-semibold">{open.user}</span>
                <span className="chip">{open.chart}</span>
                <span className="chip">{open.topic}</span>
              </div>

              <div className="mt-4">
                <div className="label">Their question</div>
                <p className="font-serif text-[15px] leading-snug">“{open.question}”</p>
              </div>

              <div className="mt-4 rounded-xl border border-edge bg-white/[0.03] p-3.5">
                <div className="label !mb-1">Context pulled from Sutra Memory</div>
                <p className="text-[12px] leading-relaxed text-mute">{open.context}</p>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="label !mb-0">AI first draft — edit freely</div>
                  <span className="chip">◈ draft only · never sent unreviewed</span>
                </div>
                <textarea
                  className="field mt-2 min-h-[190px] resize-none !text-[13px] !leading-relaxed"
                  value={edits[open.id] ?? open.draft}
                  onChange={(e) => setEdits({ ...edits, [open.id]: e.target.value })}
                  disabled={open.status === 'signed'}
                />
              </div>

              {open.status === 'signed' ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-jade/30 bg-jade/[0.07] p-3 text-[12px] text-jade">
                  ✓ Signed and sent as a voice note under your name.
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="btn-gold"
                    onClick={() => setQueue(queue.map((q) => (q.id === open.id ? { ...q, status: 'signed' } : q)))}
                  >
                    Approve &amp; record in my voice
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setEdits({ ...edits, [open.id]: '' })}
                  >
                    Discard draft, write my own
                  </button>
                </div>
              )}

              <Note>
                The astrologer can always discard the draft entirely. That matters: the moment a
                platform makes the AI draft hard to refuse, it has quietly replaced the
                practitioner's judgement with a model's, and the trust that the ₹10–15/min rate
                actually rests on is gone.
              </Note>
            </div>
          )}

          <div className="card mt-4 p-5">
            <h3 className="font-serif text-lg font-semibold">Why review beats composing</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-mute">
              Editing a draft that already contains the chart, the past readings and the dated
              claims is a fundamentally cheaper act than composing from a blank page while
              re-reading a user's history. The measured analogue is Brynjolfsson, Li &amp; Raymond
              (<em>Generative AI at Work</em>, QJE 2025): across 5,179 support agents, AI assistance
              raised resolutions per hour by <strong className="text-chalk">14% on average and 34%
              for novices</strong>, with little effect on the very best performers.
            </p>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-mute">
              That skew is the point. Scaling from 1,500 astrologers means onboarding people who are
              new to the platform — precisely the cohort the evidence says gains most. The senior
              astrologers who are already fast lose nothing, because they can discard the draft.
            </p>
          </div>
        </div>
      </div>
    </Console>
  )
}
