/**
 * Invite payload codec.
 *
 * The whole virality claim rests on this file working with no backend. An invite
 * link carries the inviter's birth details inside the URL fragment, so the
 * recipient's browser can compute the joint chart locally. That is what makes the
 * mechanic demonstrable on a static host — a judge can open the link in a
 * different browser, with no shared server and no prior localStorage, and it works.
 *
 * We use the fragment (`#/join?i=...`) rather than a query string deliberately:
 * fragments are never sent to the server, so birth details stay on-device even
 * when the page is hosted by a third party.
 */

import type { Birth } from './chart'

export type RelationKind = 'partner' | 'spouse' | 'family' | 'friend' | 'colleague'

export const RELATION_LABEL: Record<RelationKind, string> = {
  partner: 'Partner',
  spouse: 'Spouse',
  family: 'Family',
  friend: 'Friend',
  colleague: 'Colleague',
}

export interface InvitePayload {
  /** schema version, so old links keep working */
  v: 1
  from: Birth
  relation: RelationKind
  /** the question the inviter actually wants answered */
  question: string
  /** epoch ms, stamped by the caller */
  at: number
}

/* --- unicode-safe base64url, because names carry non-ASCII characters --- */

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
  const bin = atob(b64 + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function encodeInvite(p: InvitePayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(p)))
}

/** Returns null on anything malformed — a broken link must degrade, never throw. */
export function decodeInvite(token: string | null): InvitePayload | null {
  if (!token) return null
  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(token)))
    if (parsed?.v !== 1 || !parsed?.from?.date || !parsed?.from?.name) return null
    return parsed as InvitePayload
  } catch {
    return null
  }
}

/** Absolute shareable URL for an invite, correct under the Pages base path. */
export function inviteUrl(token: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/join?i=${token}`
}
