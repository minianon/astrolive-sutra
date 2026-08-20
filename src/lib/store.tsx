/**
 * App state: React context over localStorage. No backend, no accounts.
 *
 * Everything a judge does persists in their own browser and nowhere else.
 * The invite flow deliberately does NOT depend on this store on the receiving
 * side — an invite link carries its own payload — so a cold browser with empty
 * storage can still open a link and see the mechanic work.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react'
import { computeChart, type Birth, type Chart } from './chart'
import { SEED_READINGS, type Reading } from './data'
import type { RelationKind } from './invite'

const KEY = 'sutra.state.v1'

export interface Circle {
  id: string
  /** the other person */
  other: Birth
  relation: RelationKind
  question: string
  /** 'pending' = invite sent, not yet joined. 'joined' = both charts present. */
  status: 'pending' | 'joined'
  createdAt: number
  /** set when a paid full reading has been unlocked */
  fullReadingBy?: string
}

export interface Persisted {
  birth: Birth | null
  streak: number
  lastCheckIn: string | null   // ISO date
  readings: Reading[]
  circles: Circle[]
  planId: string
  asyncCredits: number
  /** dates the user tapped a watch-day reminder */
  seenWatchDays: string[]
}

const EMPTY: Persisted = {
  birth: null,
  streak: 0,
  lastCheckIn: null,
  readings: SEED_READINGS,
  circles: [],
  planId: 'p0',
  asyncCredits: 0,
  seenWatchDays: [],
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw)
    // shallow-merge so a stored state from an older build never breaks the app
    return { ...EMPTY, ...parsed }
  } catch {
    return EMPTY
  }
}

function save(s: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* quota or private mode — state simply won't persist */
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

interface Ctx {
  state: Persisted
  chart: Chart | null
  onboarded: boolean
  setBirth: (b: Birth) => void
  checkIn: () => void
  addCircle: (c: Omit<Circle, 'id' | 'createdAt'>) => string
  markCircleJoined: (id: string) => void
  unlockFullReading: (circleId: string, astrologerName: string) => void
  addReading: (r: Reading) => void
  choosePlan: (planId: string, credits: number) => void
  spendCredit: () => boolean
  reset: () => void
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)

  useEffect(() => { save(state) }, [state])

  const chart = useMemo(() => (state.birth ? computeChart(state.birth) : null), [state.birth])

  const setBirth = useCallback((birth: Birth) => {
    setState((s) => ({ ...s, birth }))
  }, [])

  /** Streak: consecutive-day check-in. Same day is a no-op, a gap resets to 1. */
  const checkIn = useCallback(() => {
    setState((s) => {
      const today = todayISO()
      if (s.lastCheckIn === today) return s
      const gap = s.lastCheckIn ? daysBetween(s.lastCheckIn, today) : Infinity
      return {
        ...s,
        lastCheckIn: today,
        streak: gap === 1 ? s.streak + 1 : 1,
        seenWatchDays: [...new Set([...s.seenWatchDays, today])],
      }
    })
  }, [])

  const addCircle = useCallback((c: Omit<Circle, 'id' | 'createdAt'>) => {
    const id = `c${Math.random().toString(36).slice(2, 9)}`
    setState((s) => ({ ...s, circles: [{ ...c, id, createdAt: Date.now() }, ...s.circles] }))
    return id
  }, [])

  const markCircleJoined = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      circles: s.circles.map((c) => (c.id === id ? { ...c, status: 'joined' } : c)),
    }))
  }, [])

  const unlockFullReading = useCallback((circleId: string, astrologerName: string) => {
    setState((s) => ({
      ...s,
      circles: s.circles.map((c) =>
        c.id === circleId ? { ...c, status: 'joined', fullReadingBy: astrologerName } : c,
      ),
    }))
  }, [])

  const addReading = useCallback((r: Reading) => {
    setState((s) => ({ ...s, readings: [r, ...s.readings] }))
  }, [])

  const choosePlan = useCallback((planId: string, credits: number) => {
    setState((s) => ({ ...s, planId, asyncCredits: s.asyncCredits + credits }))
  }, [])

  /** Returns false when there is nothing to spend, so callers can upsell. */
  const spendCredit = useCallback(() => {
    let ok = false
    setState((s) => {
      if (s.asyncCredits <= 0) return s
      ok = true
      return { ...s, asyncCredits: s.asyncCredits - 1 }
    })
    return ok
  }, [])

  const reset = useCallback(() => {
    setState(EMPTY)
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  }, [])

  const value: Ctx = {
    state, chart, onboarded: !!state.birth,
    setBirth, checkIn, addCircle, markCircleJoined, unlockFullReading,
    addReading, choosePlan, spendCredit, reset,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Ctx {
  const c = useContext(StoreContext)
  if (!c) throw new Error('useStore must be used inside StoreProvider')
  return c
}
