import { AppStepperDrawer } from './AppStepperDrawer'
import { DocUploadOverlay } from './DocUploadOverlay'
import { DocViewerOverlay } from './DocViewerOverlay'
import { ConsentModal } from './ConsentModal'
import { QuickReviewDrawer } from './QuickReviewDrawer'
import { SupportChatDrawer } from './SupportChatDrawer'

/** Single mount point — overlays self-toggle via app state (SPA wiring). */
export function OverlaysRoot() {
  return (
    <>
      <AppStepperDrawer />
      <DocUploadOverlay />
      <DocViewerOverlay />
      <ConsentModal />
      <QuickReviewDrawer />
      <SupportChatDrawer />
    </>
  )
}
