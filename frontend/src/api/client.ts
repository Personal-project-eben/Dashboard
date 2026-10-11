const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? `Erreur API ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = { id: string; email: string; confirmed?: boolean; isAdmin?: boolean; subscriptions?: string[] }

export type WidgetInstance = {
  id: string
  service: string
  widget: string
  config: Record<string, string | number>
  refreshRate: number
  position: number
  userId: string
}

export type AboutJson = {
  client: { host: string }
  server: {
    current_time: number
    services: Array<{
      name: string
      widgets: Array<{
        name: string
        description: string
        params: Array<{ name: string; type: 'string' | 'integer' }>
      }>
    }>
  }
}

// Données brutes renvoyées par les routes /services/*/data
export type WeatherTemperatureData = { city: string; temperature: number; unit: string }
export type WeatherForecastData = {
  city: string
  forecast: Array<{ date: string; tempMin: number; tempMax: number; unite: string }>
}
export type RssArticleListData = {
  link: string
  articles: Array<{ title: string; link: string; pubDate?: string }>
}
export type RssFeedHeadlineData = {
  link: string
  article: { title: string; link: string; pubDate?: string }
}
export type GithubRecentCommitsData = {
  repo: string
  commits: Array<{ sha: string; message: string; author: string; date: string }>
}
export type GithubSecurityAlertsData = {
  repo: string
  alerts: Array<{ number: number; state: string; severity: string; package: string }>
  count: number
}
export type CryptoCoinPriceData = {
  coin: string
  currency: string
  price: number | null
  marketCap: number | null
  change24h: number | null
}
export type CryptoTopCoinsData = Array<{
  rank: number
  id: string
  name: string
  symbol: string
  price: number | null
  marketCap: number | null
  change24h: number | null
  image: string | null
}>
export type OpenlibraryBookInfoData = {
  title: string | null
  authors: string[]
  firstPublished: number | null
  pages: number | null
  editions: number | null
  subjects: string[]
  cover: string | null
}
export type OpenlibraryAuthorBooksData = {
  author: string
  total: number
  books: Array<{
    title: string | null
    firstPublished: number | null
    editions: number | null
    cover: string | null
  }>
}
export type InspirationQuoteData = {
  quote: string
  author: string
}
export type ProductivityPomodoroData = {
  focusTime: number
  breakTime: number
  message: string
  timestamp: number
}
export type AiSmartSummaryData = {
  summary: string
}

export type WidgetData =
  | WeatherTemperatureData
  | WeatherForecastData
  | RssArticleListData
  | RssFeedHeadlineData
  | GithubRecentCommitsData
  | GithubSecurityAlertsData
  | CryptoCoinPriceData
  | CryptoTopCoinsData
  | OpenlibraryBookInfoData
  | OpenlibraryAuthorBooksData
  | InspirationQuoteData
  | ProductivityPomodoroData
  | AiSmartSummaryData

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function signup(email: string, password: string) {
  return apiFetch<User & { confirmToken?: string }>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function login(email: string, password: string) {
  return apiFetch<User>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function getMe() {
  return apiFetch<User>('/auth/me')
}

export function logout() {
  return apiFetch<void>('/auth/logout', { method: 'POST' })
}

// ─── Métadonnées ──────────────────────────────────────────────────────────────

export function getAbout() {
  return apiFetch<AboutJson>('/about.json')
}

// ─── Widgets CRUD ─────────────────────────────────────────────────────────────

export function getWidgets() {
  return apiFetch<WidgetInstance[]>('/dashboard/widgets')
}

export function createWidget(payload: {
  service: string
  widget: string
  config: Record<string, string | number>
  refreshRate: number
}) {
  return apiFetch<WidgetInstance>('/dashboard/widgets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateWidget(
  id: string,
  patch: { config?: Record<string, string | number>; refreshRate?: number; position?: number }
) {
  return apiFetch<WidgetInstance>(`/dashboard/widgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteWidget(id: string) {
  return apiFetch<void>(`/dashboard/widgets/${id}`, { method: 'DELETE' })
}

// ─── Données widgets ──────────────────────────────────────────────────────────

export function fetchWidgetData(
  service: string,
  widget: string,
  config: Record<string, string | number>
): Promise<WidgetData> {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(config).map(([k, v]) => [k, String(v)]))
  )
  return apiFetch<WidgetData>(`/services/${service}/widgets/${widget}/data?${params}`)
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export function sendChatMessage(message: string) {
  return apiFetch<{ reply: string }>('/services/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string
  email: string
  confirmed: boolean
  isAdmin: boolean
  createdAt: string
  _count: {
    widgets: number
    subscriptions: number
  }
}

export function getAdminUsers() {
  return apiFetch<AdminUser[]>('/admin/users')
}

export function toggleAdminRole(id: string, isAdmin: boolean) {
  return apiFetch<AdminUser>(`/admin/users/${id}/role`, { 
    method: 'PATCH',
    body: JSON.stringify({ isAdmin })
  })
}

export function confirmAdminUser(id: string) {
  return apiFetch<AdminUser>(`/admin/users/${id}/confirm`, { method: 'PATCH' })
}

export function deleteAdminUser(id: string) {
  return apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE' })
}


export function updatePassword(currentPassword: string, newPassword: string) {
  return apiFetch<void>('/profile/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword })
  })
}
