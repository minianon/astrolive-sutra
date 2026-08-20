import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { getKey, setKey } from '../lib/ai'

/* ---------------- phone frame ---------------- */

/** Wraps consumer screens in a device frame — AstroLive is a mobile app. */
export function Phone({ children, tab }: { children: ReactNode; tab?: string }) {
  return (
    <div className="flex min-h-full flex-col items-center px-3 py-4 sm:py-8">
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-edge bg-night/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[10px] text-mute/70">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="chip !border-transparent !bg-transparent !px-0 !text-[10px]">AstroLive Sutra</span>
          </span>
          <span>◗◗◗</span>
        </div>
        <div className="no-bar max-h-[74vh] min-h-[560px] overflow-y-auto px-4 pb-24">{children}</div>
        {tab && <TabBar active={tab} />}
      </div>
      <DesktopLinks />
    </div>
  )
}

const TABS = [
  { to: '/', label: 'Today', icon: '☉', key: 'today' },
  { to: '/circles', label: 'Circles', icon: '⧉', key: 'circles' },
  { to: '/memory', label: 'Memory', icon: '❍', key: 'memory' },
  { to: '/plans', label: 'Plans', icon: '✦', key: 'plans' },
]

function TabBar({ active }: { active: string }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 grid grid-cols-4 border-t border-edge bg-night/95 backdrop-blur-xl">
      {TABS.map((t) => (
        <NavLink
          key={t.key}
          to={t.to}
          className={`flex flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition ${
            active === t.key ? 'text-marigold' : 'text-mute hover:text-chalk'
          }`}
        >
          <span className="text-base leading-none">{t.icon}</span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Links to the two non-phone consoles + the trust page. */
function DesktopLinks() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px]">
      <span className="text-mute/60">Also in this prototype:</span>
      <NavLink to="/astrologer" className="chip hover:text-chalk">Astrologer console</NavLink>
      <NavLink to="/growth" className="chip hover:text-chalk">Growth model</NavLink>
      <NavLink to="/trust" className="chip hover:text-chalk">AI boundary</NavLink>
    </div>
  )
}

/* ---------------- desktop console shell ---------------- */

export function Console({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <button onClick={() => nav('/')} className="chip mb-6 hover:text-chalk">← back to the app</button>
      <h1 className="font-serif text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">{sub}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}

/* ---------------- small pieces ---------------- */

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-baseline justify-between">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">{children}</h2>
      {right}
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'default' }: {
  label: string; value: string; sub?: string; tone?: 'default' | 'good' | 'warn'
}) {
  const c = tone === 'good' ? 'text-jade' : tone === 'warn' ? 'text-saffron' : 'text-chalk'
  return (
    <div className="card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">{label}</div>
      <div className={`num mt-1.5 font-serif text-2xl font-bold ${c}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] leading-snug text-mute">{sub}</div>}
    </div>
  )
}

export function Avatar({ name, hue, size = 40 }: { name: string; hue: number; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-semibold text-night"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: `linear-gradient(160deg, hsl(${hue} 85% 72%), hsl(${(hue + 40) % 360} 80% 58%))`,
      }}
    >
      {initials}
    </div>
  )
}

export function Meter({ value, label }: { value: number; label?: string }) {
  const tone = value >= 75 ? 'bg-jade' : value >= 55 ? 'bg-saffron' : 'bg-lotus'
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-[11px] text-mute">
          <span>{label}</span><span className="num">{value}</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div className={`h-full rounded-full ${tone} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

/** Column chart used for astrologer utilisation and funnel views. */
export function Bars({ data, unit = '' }: { data: { label: string; a: number; b?: number }[]; unit?: string }) {
  const max = Math.max(...data.flatMap((d) => [d.a, d.b ?? 0]), 1)
  return (
    <div className="flex items-end gap-1.5">
      {data.map((d) => (
        <div key={d.label} className="group flex flex-1 flex-col items-center gap-1">
          <div className="relative flex h-32 w-full items-end justify-center gap-0.5">
            <div className="w-full rounded-t bg-white/[0.12] transition-all" style={{ height: `${(d.a / max) * 100}%` }} />
            {d.b !== undefined && (
              <div className="w-full rounded-t bg-gradient-to-t from-indigo-deep to-indigo-glow transition-all" style={{ height: `${(d.b / max) * 100}%` }} />
            )}
          </div>
          <div className="text-[9px] text-mute">{d.label}</div>
          {d.b !== undefined && (
            <div className="num text-[9px] text-indigo-glow opacity-0 transition group-hover:opacity-100">
              +{d.b - d.a}{unit}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ---------------- AI provenance ---------------- */

/**
 * Every AI-generated string in the product is labelled with where it came from.
 * This is a trust feature, not decoration — an unlabelled model output in a
 * faith product is exactly the thing that erodes confidence in the marketplace.
 */
export function AiBadge({ source, error }: { source: 'live' | 'prewritten'; error?: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className={`chip ${source === 'live' ? '!border-jade/40 !text-jade' : ''}`}>
        {source === 'live' ? '◈ AI · generated live' : '◈ AI · pre-written for demo'}
      </span>
      <span className="chip">not paid advice</span>
      {error && <span className="chip !border-lotus/40 !text-lotus">{error}</span>}
    </div>
  )
}

/** Bring-your-own-key control. The key never leaves the viewer's browser. */
export function KeyBox({ compact = false }: { compact?: boolean }) {
  const [val, setVal] = useState('')
  const [saved, setSaved] = useState<boolean>(!!getKey())
  const [open, setOpen] = useState(false)

  useEffect(() => { setSaved(!!getKey()) }, [open])

  if (compact && !open) {
    return (
      <button onClick={() => setOpen(true)} className="chip hover:text-chalk">
        {saved ? '◈ live AI is on — manage key' : '◈ turn on live AI with your own key'}
      </button>
    )
  }

  return (
    <div className="card mt-3 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">Live AI (optional)</div>
      <p className="mt-2 text-[12px] leading-relaxed text-mute">
        By default this prototype shows pre-written AI output, so it works for everyone with no setup.
        To watch generation happen for real, paste your own Anthropic API key — it is stored only in this
        browser, sent only to Anthropic, and is not part of the published build. No key is bundled with
        this site, because a public static page cannot hold a secret.
      </p>
      {saved ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="chip !border-jade/40 !text-jade">◈ key set — live AI active</span>
          <button
            className="btn-ghost !px-3 !py-1.5 !text-[11px]"
            onClick={() => { setKey(null); setSaved(false); setVal('') }}
          >
            Remove key
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input
            className="field !py-2 !text-[13px]"
            placeholder="sk-ant-..."
            value={val}
            type="password"
            onChange={(e) => setVal(e.target.value)}
          />
          <button
            className="btn-primary !px-3 !py-2 !text-[12px]"
            disabled={!val.trim()}
            onClick={() => { setKey(val); setSaved(true) }}
          >
            Save
          </button>
        </div>
      )}
      <p className="mt-2 text-[10px] text-mute/70">Model: claude-opus-5</p>
    </div>
  )
}

/* ---------------- misc ---------------- */

export function Empty({ title, body, cta }: { title: string; body: string; cta?: ReactNode }) {
  return (
    <div className="card mt-4 p-6 text-center">
      <div className="font-serif text-lg font-semibold">{title}</div>
      <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-mute">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-xl border border-edge/70 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-mute">
      {children}
    </p>
  )
}
