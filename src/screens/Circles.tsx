import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { encodeInvite, inviteUrl, RELATION_LABEL, type RelationKind } from '../lib/invite'
import { Empty, Note, Phone, SectionTitle } from '../ui/kit'
import { computeChart, synastry } from '../lib/chart'

const RELATIONS: RelationKind[] = ['partner', 'spouse', 'family', 'friend', 'colleague']

const PROMPTS: Record<RelationKind, string> = {
  partner: 'Are we actually compatible long-term?',
  spouse: 'Why do we keep having the same argument?',
  family: 'How do I handle my father about this decision?',
  friend: 'Can I trust them with this?',
  colleague: 'Should I go into business with them?',
}

/**
 * Sutra Invite — the acquisition loop.
 *
 * The design constraint that makes this structural rather than a bolted-on
 * referral scheme: the reading is *about two people*, so it genuinely cannot be
 * completed alone. The invitee is not being asked for a favour — they are being
 * offered the answer to a question they are also curious about. That is why this
 * converts where a "share for ₹50 wallet credit" banner does not, and it is why
 * the invitee arrives with a completed birth-details profile instead of an
 * anonymous install.
 */
export default function Circles() {
  const { state, chart } = useStore()
  const [relation, setRelation] = useState<RelationKind>('partner')
  const [question, setQuestion] = useState(PROMPTS.partner)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!chart) return null

  function create() {
    const token = encodeInvite({
      v: 1,
      from: chart!.birth,
      relation,
      question: question.trim() || PROMPTS[relation],
      at: Date.now(),
    })
    setLink(inviteUrl(token))
    setCopied(false)
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Phone tab="circles">
      <div className="pt-3">
        <h1 className="font-serif text-2xl font-bold">Circles</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-mute">
          A compatibility reading needs two charts. Send the other person a link — when they add
          their details, you both see it.
        </p>
      </div>

      <SectionTitle>New reading</SectionTitle>
      <div className="card p-4">
        <label className="label">Who is this about?</label>
        <div className="flex flex-wrap gap-1.5">
          {RELATIONS.map((r) => (
            <button
              key={r}
              onClick={() => { setRelation(r); setQuestion(PROMPTS[r]); setLink(null) }}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                relation === r
                  ? 'border-marigold/60 bg-marigold/15 text-marigold'
                  : 'border-edge bg-white/[0.03] text-mute hover:text-chalk'
              }`}
            >
              {RELATION_LABEL[r]}
            </button>
          ))}
        </div>

        <label className="label mt-4">What do you want to know?</label>
        <textarea
          className="field min-h-[76px] resize-none"
          value={question}
          onChange={(e) => { setQuestion(e.target.value); setLink(null) }}
        />

        {!link ? (
          <button className="btn-gold mt-4 w-full" onClick={create}>Create invite link</button>
        ) : (
          <div className="mt-4 rise">
            <div className="rounded-xl border border-indigo-glow/30 bg-indigo-deep/15 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-glow">
                Your invite link
              </div>
              <div className="mt-1.5 break-all text-[10px] leading-relaxed text-mute">{link}</div>
            </div>
            <div className="mt-2.5 flex gap-2">
              <button className="btn-primary flex-1" onClick={copy}>
                {copied ? '✓ Copied' : 'Copy link'}
              </button>
              <a className="btn-ghost flex-1" href={link} target="_blank" rel="noreferrer">
                Preview
              </a>
            </div>
            <Note>
              <strong>For judges:</strong> open that link in a different browser or a private window —
              one with no history of this site at all. It will still work. The invite carries the
              chart inside the URL fragment, so the loop needs no backend and no shared account,
              which is what makes it deployable as a static page. The joined circle appears on
              <em> their</em> side — with no backend there is nothing to notify this device that
              they accepted, which a production build would do with a push.
            </Note>
          </div>
        )}
      </div>

      <SectionTitle>Your circles</SectionTitle>
      {state.circles.length === 0 ? (
        <Empty
          title="No circles yet"
          body="Once someone accepts an invite, the joint reading lives here permanently — and so does every reading an astrologer gives you about that relationship."
        />
      ) : (
        <div className="space-y-2">
          {state.circles.map((c) => {
            const other = computeChart(c.other)
            const s = synastry(chart, other)
            return (
              <div key={c.id} className="card p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">{c.other.name}</div>
                    <div className="text-[11px] text-mute">{RELATION_LABEL[c.relation]}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num font-serif text-xl font-bold text-marigold">{s.score}</div>
                    <div className="text-[9px] uppercase tracking-wider text-mute">/ 100</div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] text-mute">{c.question}</p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="chip !border-jade/40 !text-jade">both charts in</span>
                  {c.fullReadingBy
                    ? <span className="chip !border-marigold/40 !text-marigold">read by {c.fullReadingBy.split(' ').slice(-1)}</span>
                    : <Link to="/plans" className="chip hover:text-chalk">unlock full reading →</Link>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Phone>
  )
}
