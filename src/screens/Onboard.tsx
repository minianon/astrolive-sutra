import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { computeChart, sunSign, type Birth } from '../lib/chart'
import { Note } from '../ui/kit'

const PLACES = ['Bengaluru', 'Delhi', 'Mumbai', 'Pune', 'Hyderabad', 'Kolkata', 'Chennai', 'Jaipur', 'Lucknow', 'Indore']

/**
 * Birth-details capture. Also used as the second half of the invite flow, where
 * `?next=` sends the new user back to the joint reading they came for rather
 * than dumping them on a generic home screen — the return path is the whole
 * reason the invite converts.
 */
export default function Onboard() {
  const { setBirth } = useStore()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')

  const [form, setForm] = useState<Birth>({ name: '', date: '', time: '12:00', place: '' })
  const valid = form.name.trim().length > 1 && !!form.date && !!form.time && form.place.trim().length > 1

  const preview = form.date ? sunSign(form.date) : null
  const chart = valid ? computeChart(form) : null

  function submit() {
    if (!valid) return
    setBirth(form)
    nav(next ? decodeURIComponent(next) : '/', { replace: true })
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md rise">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-b from-marigold to-saffron text-xl text-night">✦</div>
          <h1 className="font-serif text-3xl font-bold">AstroLive Sutra</h1>
          <p className="mt-1.5 text-sm text-mute">
            {next ? 'Add your details to unlock the joint reading.' : 'The thread that connects.'}
          </p>
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <label className="label">Your name</label>
            <input className="field" placeholder="Tushar Bhardwaj" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date of birth</label>
              <input className="field" type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Time of birth</label>
              <input className="field" type="time" value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>

          <div className="mb-2">
            <label className="label">Place of birth</label>
            <input className="field" placeholder="Bengaluru" value={form.place} list="places"
              onChange={(e) => setForm({ ...form, place: e.target.value })} />
            <datalist id="places">{PLACES.map((p) => <option key={p} value={p} />)}</datalist>
          </div>

          {preview && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-edge bg-white/[0.03] p-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/[0.05] text-lg">{preview.glyph}</div>
              <div className="text-[12px] leading-snug">
                <div className="font-semibold">{preview.name} · {preview.element}</div>
                <div className="text-mute">
                  {chart ? `${chart.moon.name} Moon · ${chart.ascendant.name} rising` : 'Add a time and place to complete the chart'}
                </div>
              </div>
            </div>
          )}

          <button className="btn-gold mt-5 w-full" disabled={!valid} onClick={submit}>
            {next ? 'Unlock the reading' : 'Build my chart'}
          </button>

          <Note>
            Your details stay in this browser. Nothing is uploaded — this prototype has no
            backend and no account system. Sun sign is computed correctly from your date;
            the remaining placements are a <strong>simulated ephemeris</strong> standing in for
            Swiss Ephemeris, which a production build would run server-side.
          </Note>
        </div>
      </div>
    </div>
  )
}
