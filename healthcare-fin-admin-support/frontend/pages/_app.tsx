import type { AppProps } from 'next/app'
import Head from 'next/head'
import { I18nProvider, useI18n } from '../lib/i18n'
import { CookieConsent } from '../components/CookieConsent'
import { restoreSession, registerSessionExpiry } from '../lib/api'
import { useEffect } from 'react'
import '../styles/globals.css'

function Shell({ Component, pageProps }: AppProps) {
  const { t, lang, setLang } = useI18n()

  useEffect(() => {
    restoreSession()
    registerSessionExpiry(() => (window.location.href = '/signup'))
  }, [])

  return (
    <>
      <Head>
        <title>{t('app.name')} — {t('app.longName')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={t('landing.subtitle')} />
      </Head>

      <header style={{ borderBottom: '1px solid var(--border-subtle)', background: '#fff' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <a href="/" style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>
            {t('app.name')}
          </a>
          <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }} aria-label="Primary">
            <a href="/settings" style={{ fontSize: 14 }}>{t('nav.settings')}</a>
            <a href="/signup" className="btn btn-primary" style={{ height: 36, fontSize: 13 }}>{t('nav.signup')}</a>
            <select
              aria-label={t('settings.language')}
              value={lang}
              onChange={(e) => setLang(e.target.value as 'en' | 'es')}
              style={{ height: 36, border: '1px solid var(--color-gray-300)', borderRadius: 8, padding: '0 8px' }}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </nav>
        </div>
      </header>

      <Component {...pageProps} />

      {/* Medical disclaimer — every page (docs/ComplianceReport.md § G) */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 48, padding: '24px 0' }}>
        <div className="container">
          <p className="muted" style={{ fontSize: 12 }}>⚠️ {t('landing.disclaimer')}</p>
        </div>
      </footer>

      <CookieConsent />
    </>
  )
}

export default function App(props: AppProps) {
  return (
    <I18nProvider>
      <Shell {...props} />
    </I18nProvider>
  )
}
