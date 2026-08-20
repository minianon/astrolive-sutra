# Low-Level Design — AstroLive Sutra

> Companion to [HLD.md](./HLD.md). That document covers system architecture; this one covers
> the actual types, function signatures, and call sequences, all read directly from `src/`.

## 1. Directory structure

```
src/
├── App.tsx                 # HashRouter + route table + <Gate> guard
├── main.tsx                # React root
├── lib/
│   ├── chart.ts             # sun sign + simulated ephemeris + synastry scoring
│   ├── invite.ts             # base64url invite payload codec (no backend)
│   ├── store.tsx             # React context over localStorage
│   ├── ai.ts                 # AI/human boundary data + generate() + prompts
│   └── data.ts                # seed astrologers, readings, transits, plans, benchmarks
├── ui/
│   └── kit.tsx                 # Phone frame, Console shell, AiBadge, KeyBox, Meter, Bars, Avatar
└── screens/
    ├── Onboard.tsx   Home.tsx   Circles.tsx   Join.tsx   Consult.tsx
    ├── Astrologer.tsx   Plans.tsx   Memory.tsx   Growth.tsx   Trust.tsx
```

## 2. Domain model

### 2.1 Chart engine (`lib/chart.ts`)

```mermaid
classDiagram
    class Birth {
        +string name
        +string date  "YYYY-MM-DD"
        +string time  "HH:MM"
        +string place
    }
    class Sign {
        +string name
        +string glyph
        +Element element
        +string ruler
    }
    class Placement {
        +Planet planet
        +Sign sign
        +number house
        +number degree
        +boolean retrograde
    }
    class Chart {
        +Birth birth
        +number seed
        +Sign sun
        +Sign moon
        +Sign ascendant
        +Placement[] placements
    }
    class SynastryAspect {
        +string label
        +string detail
        +number score
        +string tone "harmony, friction or growth"
    }
    class Synastry {
        +number score
        +string headline
        +SynastryAspect[] aspects
        +string depthTeaser
    }
    Chart "1" *-- "9" Placement
    Chart --> Birth
    Synastry "1" *-- "4" SynastryAspect
```

**`Element = 'Fire' | 'Earth' | 'Air' | 'Water'`** — each of the 12 `SIGNS` carries one.

| Function | Signature | Behaviour |
|---|---|---|
| `sunSign` | `(isoDate: string) => Sign` | **Real.** Tropical-zodiac cusp table (`CUSP`), correct for any date. |
| `cyrb128` | `(str: string) => number` | 128-bit-strength string hash → 32-bit seed. Deterministic. |
| `mulberry32` | `(seed: number) => () => number` | Seeded PRNG. Same seed ⇒ same output sequence, always. |
| `birthKey` | `(b: Birth) => string` | `"${date}\|${time}\|${place.trim().toLowerCase()}"` — the hash input. |
| `computeChart` | `(birth: Birth) => Chart` | Seeds PRNG from `birthKey`; sun is real, all other placements are `SIGNS[⌊rnd()×12⌋]`, house `1–12`, degree `0.00–28.99`, retrograde only for non-luminary/non-Rahu planets at `p < 0.18`. |
| `synastry` | `(a: Chart, b: Chart) => Synastry` | Seed = `cyrb128([birthKeyA, birthKeyB].sort().join('~'))` — **sorted before joining**, which is what makes the score identical regardless of which side computes it first. |

**Synastry scoring** — a weighted blend of element-affinity lookups, not the seeded RNG:

```
score = round(affinity(sunA,sunB)×0.40 + affinity(moonA,moonB)×0.38 + affinity(ascA,ascB)×0.22)
```

`ELEMENT_AFFINITY` is a fixed 4×4 table (e.g. Fire↔Air = 90, Fire↔Water = 48). A 4th aspect,
the "ruling-planet exchange" (`moonA.ruler ↔ sunB.ruler`), *is* drawn from the pair-seeded RNG
(`45 + ⌊rnd()×50⌋`) — the only aspect that isn't a pure affinity lookup.

> **Correctness note.** `aspects` is built in a fixed order (Sun, Moon, Ascendant,
> ruler-exchange) — it is *not* sorted by score. Any caller that wants "the strongest axis"
> must sort a copy first (`[...aspects].sort((a,b) => b.score - a.score)[0]`). `lib/ai.ts` does
> this correctly as of the current build; a prior version assumed `aspects[0]` was the
> strongest, which produced a real bug (strength and friction naming the same axis) — fixed by
> sorting explicitly in both `synastryPrompt()` and `prewrittenSynastry()`.

### 2.2 Invite codec (`lib/invite.ts`)

```mermaid
classDiagram
    class InvitePayload {
        +1 v
        +Birth from
        +RelationKind relation
        +string question
        +number at  "epoch ms"
    }
```

`RelationKind = 'partner' | 'spouse' | 'family' | 'friend' | 'colleague'`

| Function | Signature | Behaviour |
|---|---|---|
| `toBase64Url` / `fromBase64Url` | `(bytes) => string` / `(s) => Uint8Array` | Unicode-safe base64url (handles non-ASCII names); `+`→`-`, `/`→`_`, no padding. |
| `encodeInvite` | `(p: InvitePayload) => string` | `toBase64Url(utf8(JSON.stringify(p)))`. |
| `decodeInvite` | `(token: string \| null) => InvitePayload \| null` | Parses and validates `v === 1 && from.date && from.name`; **returns `null` on anything malformed rather than throwing** — a broken link must degrade, not crash. |
| `inviteUrl` | `(token: string) => string` | `${origin}${pathname}#/join?i=${token}` — reads `window.location` live, so it's correct under the Pages base path (`/astrolive-sutra/`) automatically. |

The payload is deliberately carried in the URL **fragment** (`#/join?i=...`), not a query
string: fragments are never transmitted in the HTTP request, so a third-party host (GitHub
Pages) never sees the birth details it's serving a page for.

### 2.3 Store (`lib/store.tsx`)

```mermaid
classDiagram
    class Persisted {
        +Birth|null birth
        +number streak
        +string|null lastCheckIn  "ISO date"
        +Reading[] readings
        +Circle[] circles
        +string planId
        +number asyncCredits
        +string[] seenWatchDays
    }
    class Circle {
        +string id
        +Birth other
        +RelationKind relation
        +string question
        +string status "pending or joined"
        +number createdAt
        +string? fullReadingBy
    }
    Persisted "1" *-- "*" Circle
```

Persistence key: `localStorage['sutra.state.v1']`. `load()` shallow-merges parsed JSON over
`EMPTY` so an older stored shape never crashes a newer build.

| Store action | Effect |
|---|---|
| `setBirth(birth)` | Sets `state.birth`; `chart` is a `useMemo` derived from it, so onboarding completes the moment this is called. |
| `checkIn()` | Streak logic: same-day call is a no-op; a 1-day gap increments the streak; any larger gap resets it to 1. |
| `addCircle(c)` | Appends a `Circle` with a random id — **called only from `Join.tsx`**, always with `status: 'joined'`. `'pending'` is defined in the type for forward-compatibility but no current code path emits it. |
| `markCircleJoined` / `unlockFullReading` | Present for a future paid-unlock flow; `unlockFullReading` also stamps `fullReadingBy`. |
| `spendCredit()` | Returns `false` (no-op) if `asyncCredits <= 0`, so callers can upsell instead of going negative. |
| `reset()` | Clears both in-memory state and the localStorage key. |

**Demo seeding** — `wantsDemo()` checks `?demo=1`/`&demo=1` in `location.hash` or
`location.search`. If present *and* no birth is stored yet, `StoreProvider`'s initial `useState`
seeds `DEMO_BIRTH` (hardcoded: Tushar Bhardwaj, 2001-08-14, 06:20, Bengaluru) with a backdated
`lastCheckIn` so the streak reads as already-in-progress. **This value ships in the public
bundle** — see the README's "known limitation" note before treating it as disposable test data.

### 2.4 AI layer (`lib/ai.ts`)

```mermaid
classDiagram
    class Surface {
        +string name
        +string owner "ai-owned or human-signed"
        +string why
        +boolean paid
    }
    class AiResult {
        +string text
        +string source "live or prewritten"
        +string error
    }
```

`AI_SURFACES: Surface[]` is the boundary encoded as data — see [HLD §5](./HLD.md#5-the-ai--human-trust-boundary)
for the table. `MODEL = 'claude-opus-5'`.

| Function | Signature | Notes |
|---|---|---|
| `getKey` / `setKey` / `hasKey` | localStorage read/write around key `sutra.byok` | Wrapped in try/catch — private-mode browsers that block storage simply leave the live tier off, silently. |
| `transitPrompt`, `synastryPrompt`, `memoryPrompt` | `(...) => string` | Pure prompt builders; no I/O. `synastryPrompt` sorts `aspects` by score to name the true strongest/weakest axis (see §2.1 correctness note). |
| `generate` | `(prompt: string, fallback: string) => Promise<AiResult>` | No key → immediate fallback. Key present → calls `Anthropic.messages.create`; a `refusal` stop reason, any thrown `AuthenticationError`/`RateLimitError`/`APIError`, or an empty response all resolve to `{ text: fallback, source: 'prewritten', error }` rather than rejecting. |
| `prewrittenTransit`, `prewrittenSynastry`, `prewrittenMemoryAnswer` | pure functions | The fallback text `generate()` uses when there's no key or the live call fails. `prewrittenSynastry` derives best/worst from a sorted copy of `aspects` (fixed alongside the prompt version). |

## 3. Sequence: onboarding → gated route

```mermaid
sequenceDiagram
    actor U as Visitor
    participant R as App.tsx (HashRouter)
    participant G as <Gate>
    participant S as useStore()

    U->>R: navigates to "/"
    R->>G: renders <Gate><Home/></Gate>
    G->>S: onboarded?
    alt no birth stored
        G-->>U: <Navigate to="/onboard" replace />
        U->>S: setBirth(details)  [or "fill sample profile" → DEMO_BIRTH]
        S-->>G: onboarded = true (chart derived via useMemo)
    end
    G-->>U: renders <Home/>
```

`/join` is the one gated-looking route that is **not** wrapped in `<Gate>` — a stranger with no
chart must be able to load it and see the locked teaser before onboarding.

## 4. Sequence: full invite lifecycle

```mermaid
sequenceDiagram
    actor Inviter
    participant Circles as Circles.tsx
    participant Invite as lib/invite.ts
    actor Invitee
    participant Join as Join.tsx
    participant Chart as lib/chart.ts
    participant Store as lib/store.tsx

    Inviter->>Circles: picks relation + question, clicks "Create invite link"
    Circles->>Invite: encodeInvite({v:1, from: chart.birth, relation, question, at: Date.now()})
    Invite-->>Circles: base64url token
    Circles->>Invite: inviteUrl(token)
    Invite-->>Circles: full shareable URL

    Invitee->>Join: opens "#/join?i=<token>" (cold browser)
    Join->>Invite: decodeInvite(token)
    Invite-->>Join: InvitePayload | null
    alt payload is null (malformed / tampered link)
        Join-->>Invitee: "This link has expired"
    else payload valid
        Join->>Chart: computeChart(payload.from)
        Chart-->>Join: inviter's Chart
        alt invitee not onboarded yet
            Join-->>Invitee: locked teaser (inviter's chart + blurred half)
            Invitee->>Join: "Add my birth details" → /onboard?next=/join?i=...
            Invitee->>Store: setBirth(own details)
            Store-->>Join: redirected back with chart now present
        end
        Join->>Chart: synastry(inviterChart, invitee's chart)
        Chart-->>Join: Synastry
        Join->>Store: addCircle({other: payload.from, relation, question, status:'joined'})
        Join-->>Invitee: unlocked score + AI teaser + paid-depth CTA
    end
```

**Note on state symmetry** (stated plainly, not glossed over): `addCircle` runs on the
**invitee's** device only. The inviter's own `state.circles` is never updated by this flow — the
prototype has no backend to notify it. Re-opening the same invite link on the inviter's own
device (e.g. via the "Preview" button) does add a self-referential circle for demo purposes,
but that is a side effect of testing, not real cross-device sync. A production build would close
this with either a lightweight sync endpoint or a push notification, as noted in-product.

## 5. Sequence: AI generation with graceful degradation

```mermaid
sequenceDiagram
    participant C as Screen (Home / Join / Memory / Astrologer)
    participant AI as lib/ai.ts generate()
    participant K as localStorage.sutra.byok
    participant API as Anthropic Messages API

    C->>AI: generate(prompt, fallback)
    AI->>K: getKey()
    alt no key
        AI-->>C: {text: fallback, source: 'prewritten'}
    else key present
        AI->>API: messages.create({model:'claude-opus-5', ...})
        alt success, non-refusal
            API-->>AI: response text
            AI-->>C: {text, source:'live'}
        else refusal / auth error / rate limit / API error / empty text
            AI-->>C: {text: fallback, source:'prewritten', error: <human-readable message>}
        end
    end
    C->>C: <AiBadge source error /> renders provenance + any error, never a dead end
```

## 6. State diagram: `Circle.status`

```mermaid
stateDiagram-v2
    [*] --> joined: addCircle() from Join.tsx\n(the only call site — always 'joined')
    joined --> joined: unlockFullReading()\nstamps fullReadingBy, status unchanged
    note right of joined
        'pending' exists in the Circle type
        for a future "invite sent, not yet
        opened" state, but no current code
        path ever constructs one.
    end note
```

## 7. Routing table (`App.tsx`)

| Path | Component | Gated? | Notes |
|---|---|---|---|
| `/onboard` | `Onboard` | — | Accepts `?next=<path>` to return to after birth details are set |
| `/join` | `Join` | **No** | Must render for a chart-less stranger |
| `/` | `Home` | Yes | Daily transit card, streak, watch-days |
| `/circles` | `Circles` | Yes | Invite creation + circle list |
| `/consult/:id` | `Consult` | Yes | |
| `/plans` | `Plans` | Yes | |
| `/memory` | `Memory` | Yes | Sutra Memory search |
| `/astrologer` | `Astrologer` | No (standalone console) | Desktop-width supply-side view |
| `/growth` | `Growth` | No (standalone) | Live growth-model simulator |
| `/trust` | `Trust` | No (standalone) | AI/human boundary + `KeyBox` |
| `*` | — | — | `<Navigate to="/" replace />` |

## 8. Determinism, illustrated

The property that makes the whole no-backend architecture work: two independent computations
of the same pair always converge.

```mermaid
flowchart LR
    subgraph DeviceA["Inviter's device"]
        A1["birthKey(A), birthKey(B)"] --> A2["sort → join('~')"] --> A3["cyrb128 → seed"] --> A4["mulberry32(seed)"] --> A5["synastry score"]
    end
    subgraph DeviceB["Invitee's device"]
        B1["birthKey(A), birthKey(B)"] --> B2["sort → join('~')"] --> B3["cyrb128 → seed"] --> B4["mulberry32(seed)"] --> B5["synastry score"]
    end
    A5 -. "identical, always" .- B5
```

Sorting the two `birthKey` strings before joining is what makes the seed — and therefore the
score — independent of which side (inviter or invitee) computed it first.
