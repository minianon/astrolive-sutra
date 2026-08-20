# AstroLive Sutra

**The thread that connects.** A working prototype for AstroHack 2026, addressing four
structural gaps in AstroLive's current product — no built-in growth loop, no daily habit,
revenue capped by astrologer supply-hours, and no continuity across readings — through four
interlocking modules.

**Live prototype:** https://minianon.github.io/astrolive-sutra/
**Written report:** [`report/report.html`](report/report.html) (also submitted as a PDF)

## The four modules

| Module | Addresses | What it does |
|---|---|---|
| **Sutra Invite** | Structural virality | A compatibility reading needs two charts, so it cannot be completed alone — the invitee arrives with a full profile instead of an anonymous install. Works with **no backend**: the invite carries the inviter's birth details inside the URL fragment. |
| **Transit Feed** | Habit | A daily transit card and streak, with "watch-days" traced back to a named astrologer's own past claim rather than an invented prediction. |
| **AI Copilot & async answers** | New revenue / supply unlock | AI drafts an async answer from chart + prior context; the astrologer edits or discards it, then signs it. Fills the daytime capacity that live-only, evening-peaked demand leaves idle. |
| **Sutra Memory** | Retention / USP | Every reading, logged and searchable across astrologers — the switching cost that compounds with use. |

Every paid, consequential answer is reviewed and signed by a named astrologer — AI expands
capacity, it never replaces accountability. See [`docs/HLD.md` §5](docs/HLD.md#5-the-ai--human-trust-boundary)
and the in-app `/trust` page for the full boundary.

## Documentation

- [`docs/HLD.md`](docs/HLD.md) — architecture, module map, deployment, the AI/human trust boundary
- [`docs/LLD.md`](docs/LLD.md) — domain model, function signatures, sequence diagrams, routing table
- [`report/report.html`](report/report.html) — the full written submission: teardown, competitive
  benchmarks, growth and revenue modelling, risks, limitations, and citations

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · React Router (`HashRouter`) · `@anthropic-ai/sdk`
(optional live AI tier only) · deployed to GitHub Pages via GitHub Actions.

No backend, no database, no accounts — state lives in the browser's `localStorage`.

## Getting started

```bash
npm install
npm run dev       # starts the dev server
npm run build     # type-checks and builds to dist/
npm run preview   # serves the production build locally
```

To try the invite loop as it's meant to work, create a link on `/circles`, then open it in a
**different browser or a private window** — the mechanic needs no shared account and no server.

## Known limitations

Stated here as well as in the report and in-product, deliberately not buried:

- **No real ephemeris.** Sun sign is astronomically correct; Moon, Ascendant and planetary
  houses come from a deterministic hash of birth details standing in for Swiss Ephemeris.
- **No payments.** Plan purchases and async credits are simulated.
- **No cross-device sync.** An invite's acceptance is visible on the invitee's device; the
  inviter's own device is never notified, since there's no backend to notify it.
- **The bundled sample profile uses real personal data** — see the note below.

> **Note on the demo profile.** Appending `?demo=1` (or clicking "fill a sample profile") seeds
> a hardcoded sample chart, defined in `src/lib/store.tsx` (`DEMO_BIRTH`), so a reviewer can see
> gated screens without typing birth details. That value is the project lead's own name and
> birth details, and it ships in this public repository and bundle. If you fork this project for
> anything beyond the hackathon submission, replace `DEMO_BIRTH` with fictional data first.

## AI tools used

Built with [Claude Code](https://claude.com/claude-code) (Claude Opus 5, Anthropic) — used for
research and synthesis of the competitive figures cited in the report, application code, the
report's own layout, and the documentation in this `docs/` folder. See
[`report/report.html` §16](report/report.html) for the full citation, including all AI tools and
external sources used.

## License

[MIT](LICENSE) © 2026 Tushar Bhardwaj
