import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type OverlayKind =
  | 'appStepper'
  | 'docUpload'
  | 'docViewer'
  | 'consentModal'
  | 'quickReview'
  | 'supportChat'
  | null

export type DocStage = 'docs' | 'details' | 'consent'

type ToastState = { id: number; message: string; kind: 'success' | 'error' }
type ChatMsg = { id: number; from: 'bot' | 'user'; text: string }

type AppStateValue = {
  overlay: OverlayKind
  overlayCtx: { docId?: string }
  openOverlay: (k: Exclude<OverlayKind, null>, ctx?: { docId?: string }) => void
  closeOverlay: () => void
  toast: ToastState | null
  showToast: (message: string, kind?: 'success' | 'error') => void
  chatMessages: ChatMsg[]
  pushChatMessage: (from: 'bot' | 'user', text: string) => void
  activeDocStage: DocStage
  setActiveDocStage: (s: DocStage) => void
  celebrationDone: boolean
  setCelebrationDone: (b: boolean) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

let toastSeq = 1
let chatSeq = 1

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<OverlayKind>(null)
  const [overlayCtx, setOverlayCtx] = useState<{ docId?: string }>({})
  const [toast, setToast] = useState<ToastState | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [activeDocStage, setActiveDocStage] = useState<DocStage>('docs')
  const [celebrationDone, setCelebrationDone] = useState(false)

  const showToast = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
    const id = toastSeq++
    setToast({ id, message, kind })
    window.setTimeout(() => {
      setToast((cur) => (cur && cur.id === id ? null : cur))
    }, 3200)
  }, [])

  const openOverlay = useCallback((k: Exclude<OverlayKind, null>, ctx?: { docId?: string }) => {
    setOverlayCtx(ctx ?? {})
    setOverlay(k)
  }, [])

  const closeOverlay = useCallback(() => setOverlay(null), [])

  const pushChatMessage = useCallback((from: 'bot' | 'user', text: string) => {
    setChatMessages((prev) => [...prev, { id: chatSeq++, from, text }])
  }, [])

  const value = useMemo(
    () => ({
      overlay,
      overlayCtx,
      openOverlay,
      closeOverlay,
      toast,
      showToast,
      chatMessages,
      pushChatMessage,
      activeDocStage,
      setActiveDocStage,
      celebrationDone,
      setCelebrationDone,
    }),
    [overlay, overlayCtx, openOverlay, closeOverlay, toast, showToast, chatMessages, pushChatMessage, activeDocStage, celebrationDone],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
