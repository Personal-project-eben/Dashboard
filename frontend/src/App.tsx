import './App.css'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'


import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage'
import { ProfilePage } from './pages/ProfilePage'
import { InstallAppButton } from './components/InstallAppButton'
import type { FormEvent, ReactNode } from 'react'
import {
  getMe, login, logout, signup,
  getWidgets, createWidget, updateWidget, deleteWidget, fetchWidgetData, getAbout,
  type User, type WidgetInstance, type WidgetData, type AboutJson,
  type WeatherTemperatureData, type WeatherForecastData,
  type RssArticleListData, type RssFeedHeadlineData,
  type GithubRecentCommitsData, type GithubSecurityAlertsData,
  type CryptoCoinPriceData, type CryptoTopCoinsData,
  type OpenlibraryBookInfoData, type OpenlibraryAuthorBooksData,
  type InspirationQuoteData, type ProductivityPomodoroData,
  type AiSmartSummaryData,
  sendChatMessage
} from './api/client'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = { weather: 'Weather', rss: 'RSS', github: 'GitHub', crypto: 'Crypto', openlibrary: 'Open Library', inspiration: 'Inspiration', productivity: 'Productivity', ai: 'Intelligence Artificielle' }
const SERVICE_COLORS: Record<string, string> = { weather: 'blue', rss: 'orange', github: 'ink', crypto: 'green', openlibrary: 'purple', inspiration: 'pink', productivity: 'red', ai: 'purple' }
const SERVICE_ABBR: Record<string, string> = { weather: 'WE', rss: 'RS', github: 'GH', crypto: 'CR', openlibrary: 'OL', inspiration: 'IN', productivity: 'PR', ai: 'AI' }

function widgetTitle(service: string, widget: string): string {
  const map: Record<string, string> = {
    city_temperature: 'Température actuelle',
    forecast: 'Prévisions météo',
    article_list: 'Liste d\'articles',
    feed_headline: 'Dernière publication',
    recent_commits: 'Commits récents',
    security_alerts: 'Alertes de sécurité',
    coin_price: 'Prix crypto',
    top_coins: 'Top cryptos',
    book_info: 'Infos livre',
    author_books: 'Livres d\'un auteur',
    random_quote: 'Citation du jour',
    pomodoro: 'Pomodoro',
    smart_summary: 'Résumé IA',
  }
  return map[widget] ?? `${service}/${widget}`
}

// ─── Hook : récupération + auto-refresh des données d'un widget ─────────────

function useWidgetData(instance: WidgetInstance) {
  const [data, setData] = useState<WidgetData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    fetchWidgetData(instance.service, instance.widget, instance.config)
      .then((d) => { setData(d); setError(null) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [instance.service, instance.widget, instance.config])

  useEffect(() => {
    setLoading(true)
    fetch()
    const timer = window.setInterval(fetch, instance.refreshRate * 1000)
    return () => window.clearInterval(timer)
  }, [fetch, instance.refreshRate])

  return { data, error, loading }
}

// ─── Rendu des données selon le type de widget ───────────────────────────────

function WidgetDataView({ service, widget, data, error, loading }: {
  service: string; widget: string
  data: WidgetData | null; error: string | null; loading: boolean
}) {
  if (loading) return <div className="widget-data-loading">Chargement…</div>
  if (error) {
    // Cas particulier GitHub : compte non lié ou token expiré
    if (error.includes('not linked') || error.includes('re-link')) {
      return (
        <div className="widget-data-error">
          <p>Compte GitHub non connecté ou expiré.</p>
          <a href={`${import.meta.env.VITE_API_URL ?? '/api'}/services/github/auth`} className="link-button">
            Connecter GitHub
          </a>
        </div>
      )
    }
    return <div className="widget-data-error">{error}</div>
  }
  if (!data) return null

  if (service === 'weather' && widget === 'city_temperature') {
    const d = data as WeatherTemperatureData
    return (
      <div className="widget-value">
        <strong>{d.temperature}°</strong>
        <span>{d.unit === 'celsius' ? '°C' : d.unit} · {d.city}</span>
      </div>
    )
  }

  if (service === 'weather' && widget === 'forecast') {
    const d = data as WeatherForecastData
    return (
      <div className="widget-forecast">
        {d.forecast.slice(0, 4).map((day) => (
          <div key={day.date} className="forecast-day">
            <span className="forecast-date">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</span>
            <span className="forecast-temp">{day.tempMin}° / {day.tempMax}°</span>
          </div>
        ))}
      </div>
    )
  }

  if (service === 'rss' && widget === 'article_list') {
    const d = data as RssArticleListData
    return (
      <ul className="widget-article-list">
        {d.articles.map((a, i) => (
          <li key={i}>
            <a href={a.link} target="_blank" rel="noopener noreferrer">{a.title}</a>
          </li>
        ))}
      </ul>
    )
  }

  if (service === 'rss' && widget === 'feed_headline') {
    const d = data as RssFeedHeadlineData
    return (
      <div className="widget-headline">
        <a href={d.article.link} target="_blank" rel="noopener noreferrer">{d.article.title}</a>
        {d.article.pubDate && <span className="headline-date">{new Date(d.article.pubDate).toLocaleString('fr-FR')}</span>}
      </div>
    )
  }

  if (service === 'github' && widget === 'recent_commits') {
    const d = data as GithubRecentCommitsData
    return (
      <ul className="widget-commit-list">
        {d.commits.map((c) => (
          <li key={c.sha}>
            <span className="commit-sha">{c.sha.slice(0, 7)}</span>
            <span className="commit-msg">{c.message.split('\n')[0]}</span>
            <span className="commit-author">{c.author}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (service === 'github' && widget === 'security_alerts') {
    const d = data as GithubSecurityAlertsData
    return (
      <div className="widget-alerts">
        <div className="widget-value">
          <strong>{d.count}</strong>
          <span>alerte{d.count !== 1 ? 's' : ''} Dependabot</span>
        </div>
        {d.alerts.slice(0, 3).map((a) => (
          <div key={a.number} className={`alert-item severity-${a.severity}`}>
            <span className="alert-severity">{a.severity}</span>
            <span className="alert-package">{a.package}</span>
          </div>
        ))}
      </div>
    )
  }

  if (service === 'crypto' && widget === 'coin_price') {
    const d = data as CryptoCoinPriceData
    const change = d.change24h
    const changeClass = change === null ? '' : change >= 0 ? 'positive' : 'negative'
    return (
      <div className="widget-crypto-price">
        <div className="widget-value">
          <strong>{d.price !== null ? `${d.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${d.currency}` : '—'}</strong>
          <span>{d.coin.toUpperCase()}</span>
        </div>
        {change !== null && (
          <span className={`crypto-change ${changeClass}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}% (24h)
          </span>
        )}
        {d.marketCap !== null && (
          <span className="crypto-mcap">Market cap : {(d.marketCap / 1e9).toFixed(2)} Md {d.currency}</span>
        )}
      </div>
    )
  }

  if (service === 'crypto' && widget === 'top_coins') {
    const d = data as CryptoTopCoinsData
    return (
      <ol className="widget-top-coins">
        {d.map((coin) => {
          const change = coin.change24h
          const changeClass = change === null ? '' : change >= 0 ? 'positive' : 'negative'
          return (
            <li key={coin.id} className="top-coin-item">
              <span className="coin-rank">#{coin.rank}</span>
              {coin.image && <img src={coin.image} alt={coin.name} className="coin-icon" width={20} height={20} />}
              <span className="coin-name">{coin.name} <em>{coin.symbol}</em></span>
              <span className="coin-price">{coin.price !== null ? `$${coin.price.toLocaleString('en-US', { maximumFractionDigits: 4 })}` : '—'}</span>
              {change !== null && <span className={`coin-change ${changeClass}`}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</span>}
            </li>
          )
        })}
      </ol>
    )
  }

  if (service === 'openlibrary' && widget === 'book_info') {
    const d = data as OpenlibraryBookInfoData
    return (
      <div className="widget-book-info">
        {d.cover && <img src={d.cover} alt={d.title ?? 'cover'} className="book-cover" />}
        <div className="book-details">
          <strong className="book-title">{d.title ?? 'Titre inconnu'}</strong>
          {d.authors.length > 0 && <span>par {d.authors.join(', ')}</span>}
          <span className="book-meta">
            {d.firstPublished && `Publié en ${d.firstPublished}`}
            {d.pages && ` · ${d.pages} pages`}
            {d.editions && ` · ${d.editions} éditions`}
          </span>
          {d.subjects.length > 0 && (
            <div className="book-subjects">
              {d.subjects.map((s) => <span key={s} className="subject-tag">{s}</span>)}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (service === 'openlibrary' && widget === 'author_books') {
    const d = data as OpenlibraryAuthorBooksData
    return (
      <div className="widget-author-books">
        <p className="author-total">{d.total} livre{d.total !== 1 ? 's' : ''} trouvé{d.total !== 1 ? 's' : ''} pour <strong>{d.author}</strong></p>
        <ul className="author-book-list">
          {d.books.map((book, i) => (
            <li key={i} className="author-book-item">
              {book.cover && <img src={book.cover} alt={book.title ?? ''} className="book-thumb" width={32} height={48} />}
              <div>
                <span className="book-title">{book.title ?? 'Sans titre'}</span>
                {book.firstPublished && <span className="book-year">{book.firstPublished}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (service === 'inspiration' && widget === 'random_quote') {
    const d = data as InspirationQuoteData
    return (
      <div className="widget-quote">
        <blockquote style={{ fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 10px 0' }}>"{d.quote}"</blockquote>
        <div style={{ textAlign: 'right', fontWeight: 'bold' }}>— {d.author}</div>
      </div>
    )
  }

  if (service === 'productivity' && widget === 'pomodoro') {
    const d = data as ProductivityPomodoroData
    return (
      <div className="widget-pomodoro" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#17221f', margin: '8px 0' }}>
          {d.focusTime}:00
        </div>
        <div style={{ color: '#7d857e', fontSize: '12px' }}>Temps de concentration (Pause: {d.breakTime}m)</div>
        <div style={{ marginTop: '10px' }}>
          <button className="primary-button" style={{ padding: '4px 12px', fontSize: '12px' }}>Démarrer</button>
        </div>
      </div>
    )
  }

  if (service === 'ai' && widget === 'smart_summary') {
    const d = data as AiSmartSummaryData
    return (
      <div className="widget-ai-summary" style={{ padding: '10px' }}>
        <p style={{ margin: 0, fontStyle: 'italic', color: '#55615a', lineHeight: '1.5', fontSize: '13px' }}>
          ✨ {d.summary}
        </p>
      </div>
    )
  }

  return <pre className="widget-raw">{JSON.stringify(data, null, 2)}</pre>
}

// ─── WidgetCard ───────────────────────────────────────────────────────────────

function WidgetCard({
  instance,
  onDelete, onSave,
}: {
  instance: WidgetInstance
  onDelete: () => void
  onSave: (config: Record<string, string | number>, refreshRate: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const { data, error, loading } = useWidgetData(instance)

  return (
    <article className="widget-card">
      <header>
        <div className={`service-mark ${SERVICE_COLORS[instance.service] ?? 'ink'}`}>
          {SERVICE_ABBR[instance.service] ?? instance.service.slice(0, 2).toUpperCase()}
        </div>
        <div className="widget-heading">
          <span>{SERVICE_LABELS[instance.service] ?? instance.service}</span>
          <h2>{widgetTitle(instance.service, instance.widget)}</h2>
        </div>
        <button className="icon-button" type="button" onClick={() => setEditing((e) => !e)} aria-label="Modifier">
          •••
        </button>
      </header>

      <WidgetDataView service={instance.service} widget={instance.widget} data={data} error={error} loading={loading} />

      {editing && (
        <WidgetEditor
          instance={instance}
          onSave={(config, refreshRate) => { onSave(config, refreshRate); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}

      <div className="widget-meta">
        <span>Rafraîchissement : {instance.refreshRate}s</span>
        <span>{Object.entries(instance.config).map(([k, v]) => `${k}: ${v}`).join(' · ')}</span>
      </div>

      <footer>
        
        
        <button type="button" onClick={onDelete} className="delete-button">Supprimer</button>
      </footer>
    </article>
  )
}

// ─── WidgetEditor ─────────────────────────────────────────────────────────────

function WidgetEditor({
  instance, onSave, onCancel,
}: {
  instance: WidgetInstance
  onSave: (config: Record<string, string | number>, refreshRate: number) => void
  onCancel: () => void
}) {
  const [config, setConfig] = useState(instance.config)
  const [refresh, setRefresh] = useState(instance.refreshRate)

  return (
    <form
      className="widget-editor"
      onSubmit={(e) => { e.preventDefault(); onSave(config, refresh) }}
    >
      <strong>Configuration</strong>
      {Object.entries(config).map(([key, value]) => (
        <label key={key}>
          {key}
          <input
            value={value}
            type={typeof value === 'number' ? 'number' : 'text'}
            onChange={(e) =>
              setConfig({ ...config, [key]: typeof value === 'number' ? Number(e.target.value) : e.target.value })
            }
          />
        </label>
      ))}
      <label>
        Rafraîchir toutes les (secondes)
        <input type="number" min="5" max="3600" value={refresh} onChange={(e) => setRefresh(Number(e.target.value))} />
      </label>
      <div className="editor-actions">
        <button className="save-button" type="submit">Enregistrer</button>
        <button className="cancel-button" type="button" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  )
}

// ─── AddWidget panel ──────────────────────────────────────────────────────────

function AddWidget({
  about, onAdd, onCancel,
}: {
  about: AboutJson | null
  onAdd: (payload: { service: string; widget: string; config: Record<string, string | number>; refreshRate: number }) => void
  onCancel: () => void
}) {
  const services = about?.server.services ?? []
  const [selectedService, setSelectedService] = useState(services[0]?.name ?? '')
  const [selectedWidget, setSelectedWidget] = useState(services[0]?.widgets[0]?.name ?? '')
  const [config, setConfig] = useState<Record<string, string | number>>({})
  const [refreshRate, setRefreshRate] = useState(60)

  // Met à jour la config quand on change de widget
  const currentWidgetDef = services
    .find((s) => s.name === selectedService)
    ?.widgets.find((w) => w.name === selectedWidget)

  const prevWidget = useRef(selectedWidget)
  useEffect(() => {
    if (prevWidget.current !== selectedWidget || Object.keys(config).length === 0) {
      prevWidget.current = selectedWidget
      const defaults: Record<string, string | number> = {}
      currentWidgetDef?.params.forEach((p) => { defaults[p.name] = p.type === 'integer' ? 5 : '' })
      setConfig(defaults)
    }
  }, [selectedWidget, currentWidgetDef])  // eslint-disable-line react-hooks/exhaustive-deps

  const widgetOptions = services.find((s) => s.name === selectedService)?.widgets ?? []

  return (
    <div className="add-panel-overlay">
      <form
        className="add-panel"
        onSubmit={(e) => {
          e.preventDefault()
          onAdd({ service: selectedService, widget: selectedWidget, config, refreshRate })
        }}
      >
        <div>
          <p className="eyebrow">NOUVELLE SOURCE</p>
          <h2>Ajouter un widget</h2>
        </div>

        <label>
          Service
          <select
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value)
              const firstWidget = services.find((s) => s.name === e.target.value)?.widgets[0]?.name ?? ''
              setSelectedWidget(firstWidget)
            }}
          >
            {services.map((s) => (
              <option key={s.name} value={s.name}>{SERVICE_LABELS[s.name] ?? s.name}</option>
            ))}
          </select>
        </label>

        <label>
          Widget
          <select value={selectedWidget} onChange={(e) => setSelectedWidget(e.target.value)}>
            {widgetOptions.map((w) => (
              <option key={w.name} value={w.name}>{widgetTitle(selectedService, w.name)}</option>
            ))}
          </select>
        </label>

        {currentWidgetDef && (
          <div className="param-fields">
            <strong>Paramètres</strong>
            {currentWidgetDef.params.map((p) => (
              <label key={p.name}>
                {p.name}
                <input
                  type={p.type === 'integer' ? 'number' : 'text'}
                  value={config[p.name] ?? ''}
                  required
                  onChange={(e) =>
                    setConfig({ ...config, [p.name]: p.type === 'integer' ? Number(e.target.value) : e.target.value })
                  }
                />
              </label>
            ))}
          </div>
        )}

        <label>
          Rafraîchissement (secondes)
          <input type="number" min="5" max="3600" value={refreshRate} onChange={(e) => setRefreshRate(Number(e.target.value))} />
        </label>

        <div className="editor-actions">
          <button className="primary-button" type="submit">Ajouter au tableau</button>
          <button className="cancel-button" type="button" onClick={onCancel}>Annuler</button>
        </div>
      </form>
    </div>
  )
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

function Chatbot() {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    const currentQuery = query
    setQuery('')
    setHistory(h => [...h, { role: 'user', content: currentQuery }])
    setLoading(true)

    try {
      const { reply } = await sendChatMessage(currentQuery)
      setHistory(h => [...h, { role: 'assistant', content: reply }])
    } catch (err: any) {
      setHistory(h => [...h, { role: 'assistant', content: "Erreur: " + err.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          💬 Assistant
        </button>
      )}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h4>Assistant IA</h4>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="chatbot-messages">
            {history.length === 0 && <p className="chat-empty">Posez-moi une question sur votre dashboard...</p>}
            {history.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="chat-message assistant">Réflexion en cours...</div>}
          </div>
          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="Ex: Quel temps fait-il demain ?" 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
            />
            <button type="submit" disabled={loading || !query.trim()}>Envoyer</button>
          </form>
        </div>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([])
  const [loadingWidgets, setLoadingWidgets] = useState(true)
  const [errorWidgets, setErrorWidgets] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [about, setAbout] = useState<AboutJson | null>(null)
  const [syncTime, setSyncTime] = useState<number | null>(null)

  // Chargement initial
  useEffect(() => {
    Promise.all([getWidgets(), getAbout()])
      .then(([w, a]) => { setWidgets(w); setAbout(a) })
      .catch((e: Error) => setErrorWidgets(e.message))
      .finally(() => setLoadingWidgets(false))
  }, [])

  async function handleDelete(id: string) {
    await deleteWidget(id).catch(() => undefined)
    setWidgets((curr) => curr.filter((w) => w.id !== id))
  }

  
  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    if (sourceIndex === destinationIndex) return

    const next = Array.from(widgets)
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(destinationIndex, 0, moved)
    setWidgets(next)

    await Promise.all(
      next.map((w, idx) => updateWidget(w.id, { position: idx }))
    ).catch(() => undefined)
  }


  async function handleSave(id: string, config: Record<string, string | number>, refreshRate: number) {
    const updated = await updateWidget(id, { config, refreshRate })
    setWidgets((curr) => curr.map((w) => w.id === id ? updated : w))
    setSyncTime(Date.now())
  }

  async function handleAdd(payload: { service: string; widget: string; config: Record<string, string | number>; refreshRate: number }) {
    const created = await createWidget(payload)
    setWidgets((curr) => [...curr, created])
    setShowAdd(false)
    setSyncTime(Date.now())
  }

  async function handleApplyTemplate(type: 'dev' | 'crypto' | 'innovation') {
    setLoadingWidgets(true);
    try {
      if (type === 'dev') {
        await handleAdd({ service: 'weather', widget: 'city_temperature', config: { city: 'Paris' }, refreshRate: 300 });
        await handleAdd({ service: 'rss', widget: 'article_list', config: { link: 'https://news.ycombinator.com/rss', number: 5 }, refreshRate: 600 });
        await handleAdd({ service: 'github', widget: 'recent_commits', config: { repo: 'facebook/react', number: 5 }, refreshRate: 300 });
      } else if (type === 'crypto') {
        await handleAdd({ service: 'crypto', widget: 'top_coins', config: { limit: 5 }, refreshRate: 300 });
        await handleAdd({ service: 'crypto', widget: 'coin_price', config: { coin: 'bitcoin', currency: 'usd' }, refreshRate: 60 });
        await handleAdd({ service: 'weather', widget: 'city_temperature', config: { city: 'New York' }, refreshRate: 300 });
      } else if (type === 'innovation') {
        await handleAdd({ service: 'inspiration', widget: 'random_quote', config: {}, refreshRate: 3600 });
        await handleAdd({ service: 'productivity', widget: 'pomodoro', config: { focusTime: 25, breakTime: 5 }, refreshRate: 3600 });
      }
    } finally {
      setLoadingWidgets(false);
    }
  }

  if (loadingWidgets) return <main className="loading-page">Chargement du tableau de bord…</main>

  return (
    <main className="dashboard-page">
      <button 
        type="button" 
        className="primary-button exit-zen" 
        onClick={() => document.body.classList.remove('zen-mode')}
      >
        Quitter le mode Zen
      </button>

      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">ESPACE PERSONNEL</p>
          <h1>Votre tableau de bord.</h1>
          <p className="intro-copy">Vos services réunis en un seul endroit.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
          <button 
            type="button" 
            className="secondary-button" 
            onClick={() => document.body.classList.add('zen-mode')}
            style={{ fontSize: '13px', padding: '6px 16px', borderRadius: '20px' }}
          >
            🧘 Activer le mode Zen
          </button>
          <div className="status-pill">
            <span />
            Synchronisé{' '}
            <strong>
              {syncTime
                ? new Date(syncTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : 'en attente'}
            </strong>
          </div>
        </div>
      </section>

      <section className="summary-row">
        <div><strong>{widgets.length}</strong><span>widgets actifs</span></div>
        <div><strong>{new Set(widgets.map((w) => w.service)).size}</strong><span>services utilisés</span></div>
        <div>
          <strong>{about?.server.services.length ?? '—'}</strong>
          <span>services disponibles</span>
        </div>
      </section>

      {errorWidgets && <p className="form-error" role="alert">{errorWidgets}</p>}

      {widgets.length === 0 && !loadingWidgets && (
        <section className="templates-section" style={{ marginBottom: '40px', background: 'var(--glass-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Commencez rapidement</h3>
          <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)' }}>Utilisez un de nos packs pré-configurés pour démarrer en un clic.</p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button className="secondary-button" onClick={() => handleApplyTemplate('dev')}>
              💻 Pack Développeur (Météo, GitHub, RSS)
            </button>
            <button className="secondary-button" onClick={() => handleApplyTemplate('crypto')}>
              📈 Pack Crypto (Top 5, BTC, Météo)
            </button>
            <button className="secondary-button" onClick={() => handleApplyTemplate('innovation')}>
              🚀 Pack Innovation (Inspiration, Pomodoro)
            </button>
          </div>
        </section>
      )}

            <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" direction="horizontal">
          {(provided) => (
            <section className="widget-grid" ref={provided.innerRef} {...provided.droppableProps}>
              {widgets.map((instance, index) => (
                <Draggable key={instance.id} draggableId={instance.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{...provided.draggableProps.style, height: '100%'}}>
                      <WidgetCard
                        instance={instance}
                        onDelete={() => handleDelete(instance.id)}
                        onSave={(config, refreshRate) => handleSave(instance.id, config, refreshRate)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <button type="button" className="add-widget" onClick={() => setShowAdd(true)}>
                <span>+</span>
                <strong>Ajouter un widget</strong>
                <small>Choisir parmi vos services</small>
              </button>
            </section>
          )}
        </Droppable>
      </DragDropContext>

      {showAdd && (
        <AddWidget
          about={about}
          onAdd={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <Chatbot />
    </main>
  )
}

// ─── AuthForm ─────────────────────────────────────────────────────────────────

function AuthForm({ mode, onAuthenticated }: { mode: 'login' | 'register'; onAuthenticated: (user: User) => void }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState<ReactNode>('')
  const [submitting, setSubmitting] = useState(false)
  const isRegister = mode === 'register'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const user = isRegister ? await signup(email, password) : await login(email, password)
      if (isRegister) {
        const msg = (user as any).message || 'Compte créé. Veuillez vérifier vos emails pour confirmer votre compte.';
        setMessage(msg);
      } else {
        onAuthenticated(user)
        const from = searchParams.get('from') ?? '/dashboard'
        navigate(from, { replace: true })
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">ORBIT / COMPTE</p>
        <h1>{isRegister ? 'Créer votre espace.' : 'Bon retour parmi nous.'}</h1>
        <p className="auth-copy">
          {isRegister
            ? 'Réunissez vos services dans un seul tableau de bord.'
            : 'Connectez-vous pour retrouver votre tableau de bord.'}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>
            Mot de passe
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-message" role="status">{message}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Patientez…' : isRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Se connecter' : 'Créer un compte'}</Link>
        </p>
      </div>
    </main>
  )
}

// ─── Page de confirmation de compte ──────────────────────────────────────────

function ConfirmPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending')
  const [message, setMessage] = useState('')
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const token = searchParams.get('token')
    if (!token) { setStatus('error'); setMessage('Token manquant.'); return }

    fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/auth/confirm?token=${token}`)
      .then(async (r) => {
        const body = await r.json()
        if (r.ok) { setStatus('ok'); setMessage(body.message ?? 'Compte confirmé !') }
        else { setStatus('error'); setMessage(body.error ?? 'Erreur de confirmation.') }
      })
      .catch(() => { setStatus('error'); setMessage('Impossible de joindre le serveur.') })
  }, [searchParams])

  return (
    <main className="simple-page">
      <p className="eyebrow">COMPTE</p>
      <h1>{status === 'ok' ? 'Compte confirmé !' : status === 'error' ? 'Erreur' : 'Confirmation en cours…'}</h1>
      <p>{message}</p>
      {(status === 'ok' || status === 'error') && (
        <button className="primary-button" onClick={() => navigate('/login')}>Se connecter</button>
      )}
    </main>
  )
}

// ─── ServicesPage ─────────────────────────────────────────────────────────────

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  weather: 'Données météorologiques. Aucun compte requis.',
  rss: 'Flux d\'actualités RSS. Aucun compte requis.',
  github: 'Activité et alertes de vos dépôts GitHub.',
  crypto: 'Données de cryptomonnaies. Aucun compte requis.',
  openlibrary: 'Données sur les livres et auteurs. Aucun compte requis.',
  inspiration: 'Trouvez l\'inspiration au quotidien. Aucun compte requis.',
  productivity: 'Outils de productivité pour rester concentré.'
}

function ServicesPage({ user }: { user: User }) {
  const [about, setAbout] = useState<AboutJson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAbout()
      .then(setAbout)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <main className="simple-page">Chargement des services…</main>

  return (
    <main className="simple-page">
      <p className="eyebrow">SERVICES</p>
      <h1>Abonnements.</h1>
      <p>Gérez vos connexions aux services tiers.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', textAlign: 'left', maxWidth: '400px', margin: '2rem auto' }}>
        {about?.server.services.map((service) => {
          const isGithub = service.name === 'github';
          const isConnected = isGithub ? (user.subscriptions?.includes('github') ?? false) : true;
          
          return (
            <div key={service.name} className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{SERVICE_LABELS[service.name] ?? service.name}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {SERVICE_DESCRIPTIONS[service.name] ?? 'Aucun compte requis.'}
              </p>
              {isConnected ? (
                <span className="status-badge success">✓ Connecté</span>
              ) : isGithub ? (
                <a href={`${import.meta.env.VITE_API_URL ?? '/api'}/services/github/auth`} className="primary-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Connecter GitHub
                </a>
              ) : (
                <span className="status-badge" style={{ opacity: 0.5 }}>Non connecté</span>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}

// ─── Shell & routing ──────────────────────────────────────────────────────────

function ProtectedRoute({ user, children }: { user: User | null; children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => { if (!user) navigate(`/login?from=${encodeURIComponent(location.pathname)}`, { replace: true }) }, [user, location.pathname, navigate])
  return user ? <>{children}</> : null
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(null)).finally(() => setCheckingSession(false))
  }, [])

  if (checkingSession) return <main className="loading-page">Vérification de la session…</main>

  async function handleLogout() {
    await logout().catch(() => undefined)
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="topbar">
        <Link to="/dashboard" className="brand"><span>◎</span> orbit<span className="brand-dot">.</span></Link>
        <nav>
          <NavLink to="/dashboard">Tableau de bord</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/profile">Profil</NavLink>
          {user?.isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="account">
          <InstallAppButton />
          {user ? (
            <>
              <span className="avatar">{user.email.slice(0, 2).toUpperCase()}</span>
              <span>{user.email}</span>
              <button className="logout-button" type="button" onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <Link to="/login">Connexion</Link>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<NavigateToDashboard />} />
        <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute user={user}><ServicesPage user={user!} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage currentUser={user!} /></ProtectedRoute>} />
        {user?.isAdmin && (
          <Route path="/admin" element={<ProtectedRoute user={user}><AdminPage currentUser={user!} /></ProtectedRoute>} />
        )}
        <Route path="/login" element={user ? <NavigateToDashboard /> : <AuthForm mode="login" onAuthenticated={setUser} />} />
        <Route path="/register" element={user ? <NavigateToDashboard /> : <AuthForm mode="register" onAuthenticated={setUser} />} />
        <Route path="/confirm" element={<ConfirmPage />} />
        <Route path="*" element={
          <SimplePage
            title="Page introuvable"
            copy={`Aucune page ne correspond à ${location.pathname}.`}
            action="Retour au tableau de bord"
          />
        } />
      </Routes>
    </>
  )
}

function SimplePage({ title, copy, action }: { title: string; copy: string; action: string }) {
  const navigate = useNavigate()
  return (
    <main className="simple-page">
      <p className="eyebrow">DASHBOARD</p>
      <h1>{title}</h1>
      <p>{copy}</p>
      <button className="primary-button" onClick={() => navigate('/dashboard')}>{action}</button>
    </main>
  )
}

function NavigateToDashboard() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/dashboard', { replace: true }) }, [navigate])
  return null
}

function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>
}

export default App
