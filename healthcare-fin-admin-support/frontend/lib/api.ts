/** Typed fetch client for the HFAS API (JWT bearer). */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api'

type Tokens = { accessToken: string; refreshToken: string }

let accessToken: string | null = null
let refreshToken: string | null = null
let onSessionExpired: (() => void) | null = null

export function setSession(t: Tokens): void {
  accessToken = t.accessToken
  refreshToken = t.refreshToken
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('hfas.refresh', t.refreshToken) // access token stays in memory only
  }
}

export function clearSession(): void {
  accessToken = null
  refreshToken = null
  if (typeof localStorage !== 'undefined') localStorage.removeItem('hfas.refresh')
}

export function restoreSession(): void {
  if (typeof localStorage !== 'undefined') refreshToken = localStorage.getItem('hfas.refresh')
}

export function registerSessionExpiry(fn: () => void): void {
  onSessionExpired = fn
}

async function refreshAccess(): Promise<boolean> {
  if (!refreshToken) return false
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return false
  const t = (await res.json()) as Tokens
  accessToken = t.accessToken
  refreshToken = t.refreshToken
  if (typeof localStorage !== 'undefined') localStorage.setItem('hfas.refresh', t.refreshToken)
  return true
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 401 && (await refreshAccess())) {
    return api<T>(path, opts) // one retry with the fresh token
  }
  if (res.status === 401) {
    clearSession()
    onSessionExpired?.()
    throw new Error('session expired')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// ── typed endpoints ──────────────────────────────────────────
export type Scheme = {
  id: string; slug: string; name: string; provider_type: string
  provider_name: string; description: string; max_amount_inr: string | null
  required_docs: string[]; helpline: string | null
}

export type Match = {
  schemeId: string; slug: string; name: string; providerType: string
  maxAmountInr: string | null
  assessment: { eligible: boolean; score: number; reasons: { met: boolean; describe: string }[] }
}

export const endpoints = {
  requestOtp: (destination: string, channel: 'sms' | 'email') =>
    api<{ sent: boolean; devOtp?: string }>('/auth/request-otp', { method: 'POST', body: { destination, channel } }),
  verifyOtp: (destination: string, code: string, channel: 'sms' | 'email') =>
    api<Tokens & { userId: string; isNewUser: boolean }>('/auth/verify-otp', { method: 'POST', body: { destination, code, channel } }),
  schemes: () => api<Scheme[]>('/schemes'),
  assess: (profile: object, onboarding: object) =>
    api<Match[]>('/eligibility/assess', { method: 'POST', body: { profile, onboarding } }),
  createApplication: (schemeSlug: string) =>
    api<{ id: string; reference: string }>('/applications', { method: 'POST', body: { scheme_slug: schemeSlug } }),
  createUpload: (docType: string, contentType: string, byteSize: number) =>
    api<{ documentId: string; uploadUrl: string; method: string }>('/documents/upload', {
      method: 'POST', body: { doc_type: docType, content_type: contentType, byte_size: byteSize },
    }),
  confirmUpload: (docId: string, checksum: string) =>
    api<{ id: string; status: string }>(`/documents/${docId}/confirm`, { method: 'POST', body: { checksum_sha256: checksum } }),
  processOcr: (docId: string) =>
    api<{ id: string; status: string; fields: { label: string; value: string; confidence: number }[] }>(`/documents/${docId}/process-ocr`, { method: 'POST' }),
  updateForm: (appId: string, formData: Record<string, unknown>) =>
    api<{ id: string; progress_pct: number }>(`/applications/${appId}/form`, { method: 'PUT', body: { form_data: formData } }),
  recordConsent: (appId: string, body: { consent_version: string; scopes: string[]; esign_name: string }) =>
    api<{ recorded: boolean }>(`/applications/${appId}/consent`, { method: 'POST', body }),
  submit: (appId: string) =>
    api<{ reference: string; status: string }>(`/applications/${appId}/submit`, { method: 'POST' }),
  exportData: () => api<Record<string, unknown>>('/data-requests/export'),
  requestDeletion: () =>
    api<{ id: string; kind: string; status: string }>('/data-requests', { method: 'POST', body: { kind: 'deletion' } }),
}
