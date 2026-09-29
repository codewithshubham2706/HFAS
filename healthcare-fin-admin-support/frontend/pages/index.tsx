import Head from 'next/head'
import { useI18n } from '../lib/i18n'

export default function Landing() {
  const { t } = useI18n()
  return (
    <>
      <Head><title>{t('app.name')} — {t('landing.title')}</title></Head>
      <main>
        <section className="container" style={{ textAlign: 'center', padding: '72px 0 48px' }}>
          <h1 style={{ maxWidth: 760, margin: '0 auto' }}>{t('landing.title')}</h1>
          <p className="muted" style={{ maxWidth: 640, margin: '16px auto 0', fontSize: 17 }}>{t('landing.subtitle')}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <a href="/signup" className="btn btn-primary" style={{ height: 48 }}>{t('landing.cta')}</a>
          </div>
        </section>

        <section className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, paddingBottom: 48 }}>
          {[
            { h: t('wizard.title'), b: t('results.subtitle', { count: 3 }) },
            { h: t('application.step.documents'), b: t('application.uploader.hint') },
            { h: t('application.step.review'), b: t('application.submitted') },
          ].map((v) => (
            <article key={v.h} className="card">
              <h3 style={{ fontSize: 17 }}>{v.h}</h3>
              <p className="muted" style={{ marginTop: 6 }}>{v.b}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}
