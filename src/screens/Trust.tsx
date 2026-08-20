import { AI_SURFACES } from '../lib/ai'
import { Console, KeyBox, Note } from '../ui/kit'

/**
 * The AI boundary, published as a product surface rather than buried in a policy.
 *
 * The commercial argument: a user pays ₹10–15/min for a named human who is
 * accountable for what they said. Ship an AI that answers paid questions and you
 * have (a) entered a category already commoditised by AstroGPT, Om.AI and
 * AstroSage's AI layer, and (b) attacked the trust the rate itself depends on.
 * So the split is drawn explicitly and shown to the user.
 */
export default function Trust() {
  const ai = AI_SURFACES.filter((s) => s.owner === 'ai-owned')
  const human = AI_SURFACES.filter((s) => s.owner === 'human-signed')

  return (
    <Console
      title="Where AI stops"
      sub="AI expands astrologer capacity. It never replaces astrologer accountability. This page exists because a faith product that is vague about which words came from a machine has already lost the thing it sells."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-deep/30 text-sm">◈</span>
            <h2 className="font-serif text-xl font-bold">AI owns breadth</h2>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-mute">
            Free, unlimited, explanatory, low-stakes. Work that no quantity of astrologer hours could
            ever cover — one narration per user per day — and work that currently wastes paid minutes.
          </p>
          <div className="mt-4 space-y-2.5">
            {ai.map((s) => (
              <div key={s.name} className="rounded-xl border border-edge bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{s.name}</span>
                  <span className="chip shrink-0">free</span>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-mute">{s.why}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card border-marigold/25 p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-marigold/20 text-sm text-marigold">✍</span>
            <h2 className="font-serif text-xl font-bold">Humans own depth</h2>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-mute">
            Paid, consequential, attributable. A named astrologer's judgement, with their name
            attached to it. AI may prepare the material; it never delivers the verdict.
          </p>
          <div className="mt-4 space-y-2.5">
            {human.map((s) => (
              <div key={s.name} className="rounded-xl border border-marigold/20 bg-marigold/[0.05] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{s.name}</span>
                  <span className="chip shrink-0 !border-marigold/40 !text-marigold">paid · signed</span>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-mute">{s.why}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-serif text-xl font-bold">The three rules</h2>
          <ol className="mt-3 space-y-3 text-[12.5px] leading-relaxed text-mute">
            <li>
              <span className="font-semibold text-chalk">1. No paid answer is model-generated.</span>{' '}
              Async drafts exist only inside the astrologer's console, and the astrologer can discard
              them outright. If a draft were hard to refuse, the model would have quietly become the
              practitioner.
            </li>
            <li>
              <span className="font-semibold text-chalk">2. Every AI string is labelled.</span> The
              daily card, the synastry teaser and memory search all carry a provenance badge in the
              product — including whether it was generated live or pre-written.
            </li>
            <li>
              <span className="font-semibold text-chalk">3. AI never prescribes.</span> Remedies,
              muhurat, and anything touching money, marriage, health or law stay human. The free tier
              describes; it does not instruct.
            </li>
          </ol>
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-xl font-bold">Why not just ship an AI astrologer?</h2>
          <p className="mt-3 text-[12.5px] leading-relaxed text-mute">
            Because it is the obvious move, and it fails twice. It is already
            commoditised — AstroGPT, Om.AI and AstroSage's AI layer all ship a conversational
            astrologer today, so it differentiates nothing. And it is directly cannibalistic:
            AstroLive's revenue is ₹10–15 per minute of <em>human</em> attention across 1,500
            astrologers. An AI that answers paid questions competes with the supply side the
            marketplace is built on, and trades a defensible business for a feature any competitor
            can clone in a sprint.
          </p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-mute">
            The scarce asset is not intelligence. It is <em>accountable</em> intelligence — a named
            person who will stand behind what they told you about your marriage. AI should make more
            of that available, not substitute for it.
          </p>
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        <KeyBox />
        <Note>
          Model used for the live tier: <span className="text-chalk">claude-opus-5</span>. No API key
          is bundled with this site — a public static build cannot hold a secret, so live generation
          runs only against a key the viewer supplies and stores in their own browser.
        </Note>
      </div>
    </Console>
  )
}
