import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'

/** Support chat drawer with message thread and request-callback CTA. */
export function SupportChatDrawer() {
  const { t } = useI18n()
  const { overlay, closeOverlay, showToast, chatMessages, pushChatMessage } = useAppState()
  const [draft, setDraft] = useState('')
  const open = overlay === 'supportChat'

  function send() {
    const text = draft.trim()
    if (!text) return
    pushChatMessage('user', text)
    setDraft('')
    // Simulated support reply
    window.setTimeout(() => {
      pushChatMessage('bot', t('overlay.chatAutoReply'))
    }, 900)
  }

  return (
    <Drawer open={open} onClose={closeOverlay} title={t('overlay.chatTitle')} width={400}>
      <div className="flex h-full flex-col gap-4">
        <p className="u-caption">{t('overlay.chatHours')}</p>

        <div className="flex min-h-[240px] flex-1 flex-col gap-2.5 overflow-y-auto rounded-[var(--radius-md)] bg-[var(--color-gray-50)] p-3">
          <div className="flex items-start gap-2">
            <Avatar name="HFAS Support" size={40} />
            <div className="max-w-[80%] rounded-[var(--radius-md)] rounded-tl-none bg-white px-3 py-2 shadow-[var(--shadow-1)]">
              <p className="text-[14px]">{t('overlay.chatGreeting')}</p>
            </div>
          </div>
          {chatMessages.map((m) =>
            m.from === 'user' ? (
              <div key={m.id} className="self-end">
                <div className="max-w-[80%] rounded-[var(--radius-md)] rounded-br-none bg-[var(--color-primary-600)] px-3 py-2 text-[14px] text-white">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2">
                <Avatar name="HFAS Support" size={40} />
                <div className="max-w-[80%] rounded-[var(--radius-md)] rounded-tl-none bg-white px-3 py-2 shadow-[var(--shadow-1)]">
                  <p className="text-[14px]">{m.text}</p>
                </div>
              </div>
            ),
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
            placeholder={t('overlay.chatPlaceholder')}
            aria-label={t('overlay.chatPlaceholder')}
            className="h-10 flex-1 rounded-[var(--radius-md)] border border-[var(--border-strong)] px-3 text-[14px] focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
          />
          <Button size="md" onClick={send}>
            {t('overlay.chatSend')}
          </Button>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            showToast(t('toast.callbackRequested'))
            closeOverlay()
          }}
        >
          {t('common.requestCallback')}
        </Button>
      </div>
    </Drawer>
  )
}
