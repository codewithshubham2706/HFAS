import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { I18nProvider } from './i18n/I18nContext'
import { AppStateProvider, useAppState } from './state/AppStateContext'
import { CookieBanner } from './components/layout/CookieBanner'
import { Toast } from './components/ui/Toast'
import { OverlaysRoot } from './components/overlays/OverlaysRoot'
import {
  Landing,
  AuthSignup,
  OnboardingWizard,
  Dashboard,
  EligibilityResults,
  SchemeDetail,
  ApplicationOverview,
  ApplicationDocuments,
  ApplicationDetails,
  ApplicationConsent,
  SubmissionConfirmation,
  StatusTimeline,
  Handoff,
} from './pages'

const ROUTES: { path: string; element: JSX.Element }[] = [
  { path: '/', element: <Landing /> },
  { path: '/auth-signup', element: <AuthSignup /> },
  { path: '/onboarding-wizard', element: <OnboardingWizard /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/eligibility-results', element: <EligibilityResults /> },
  { path: '/scheme-detail', element: <SchemeDetail /> },
  { path: '/application-overview', element: <ApplicationOverview /> },
  { path: '/application-documents', element: <ApplicationDocuments /> },
  { path: '/application-details', element: <ApplicationDetails /> },
  { path: '/application-consent', element: <ApplicationConsent /> },
  { path: '/submission-confirmation', element: <SubmissionConfirmation /> },
  { path: '/status-timeline', element: <StatusTimeline /> },
  { path: '/handoff', element: <Handoff /> },
]

function AnimatedRoutes(): JSX.Element {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {ROUTES.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </AnimatePresence>
  )
}

function Shell(): JSX.Element {
  const { toast } = useAppState()

  return (
    <div className="app-shell">
      <AnimatedRoutes />
      <CookieBanner />
      <AnimatePresence>{toast && <Toast key={toast.id} message={toast.message} kind={toast.kind} />}</AnimatePresence>
      <OverlaysRoot />
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <I18nProvider>
      <AppStateProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </AppStateProvider>
    </I18nProvider>
  )
}
