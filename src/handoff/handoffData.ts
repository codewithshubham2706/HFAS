/** Handoff data: API placeholders, Lottie placeholders, licenses, component map, a11y checklist. */

export const apiPlaceholders = [
  {
    method: 'POST',
    path: '/api/documents/upload-url',
    desc: 'Returns a pre-signed upload URL (S3/GCS) for a document. Body: { docType, contentType }. Response: { uploadUrl, docId, expiresAt }.',
  },
  {
    method: 'POST',
    path: '/api/documents/process-ocr',
    desc: 'Queues OCR parsing of an uploaded document. Body: { docId }. Response: { jobId }. Poll GET /api/documents/{docId} until fields arrive.',
  },
  {
    method: 'POST',
    path: '/api/applications/submit',
    desc: 'Submits the application with consent metadata. Body: { schemeId, fields, consent: { insurer, hospital, govt, esignName }, docs: [docId] }. Response: { applicationId, reference }. **REQUIRES LEGAL REVIEW** for consent payload retention.',
  },
] as const

export const lottiePlaceholders = [
  { file: 'lottie/upload-success-check.json', use: 'Plays once when a document upload completes (doc upload overlay / documents page).' },
  { file: 'lottie/loader-ring.json', use: 'Looping loader ring for button loading states and OCR parsing (900ms rotation token).' },
  { file: 'lottie/check-burst-small.json', use: 'Small check-burst when an OCR field is accepted, and on submission confirmation hero.' },
] as const

export const licenses = [
  { asset: 'Inter font', license: 'SIL Open Font License 1.1 — https://openfontlicense.org', needsLegalReview: false },
  { asset: 'Icons (inline SVG, this project)', license: 'Original work — no attribution required', needsLegalReview: false },
  { asset: 'Lottie placeholders (lottie/*.json)', license: 'Placeholder geometry — replace with licensed exports before launch', needsLegalReview: true },
  { asset: 'Hero illustration / photography', license: 'Not sourced yet — must use licensed or original assets', needsLegalReview: true },
  { asset: 'Consent & legal copy', license: 'Draft copy — must be reviewed by counsel before release', needsLegalReview: true },
] as const

export const componentMap = [
  { figma: 'Button/primary — default/hover/pressed/loading/success/error', exportName: 'button-primary-medium' },
  { figma: 'Input/text — default/error/sensitive', exportName: 'input-text-default' },
  { figma: 'Stepper/horizontal (stepCount prop)', exportName: 'stepper-horizontal' },
  { figma: 'Card/scheme — compact/expanded', exportName: 'card-scheme-compact' },
  { figma: 'Doc/thumbnail — default/processing/flagged', exportName: 'doc-thumbnail-default' },
  { figma: 'Uploader/dropzone — default/dragover/processing/success', exportName: 'uploader-dropzone-default' },
  { figma: 'Timeline/item — default/new/expanded', exportName: 'timeline-item-default' },
  { figma: 'Toast — success/error', exportName: 'toast-success' },
  { figma: 'Modal/center — confirm/form', exportName: 'modal-center-confirm' },
  { figma: 'Table/row/application — action-needed', exportName: 'table-row-application' },
  { figma: 'Avatar — 40/56', exportName: 'avatar-40' },
  { figma: 'Icon button — 40', exportName: 'icon-button-40' },
] as const

export const focusOrderMap = [
  { page: 'landing-desktop', order: 'Logo → Log in → Get started → hero CTAs → value cards → footer links → language toggle → cookie banner (last)' },
  { page: 'auth-signup-desktop', order: 'Phone/email input → use-email toggle → Send OTP → (OTP modal) digit 1–6 → Verify → Resend → sign-in link' },
  { page: 'onboarding-wizard-desktop', order: 'Stepper (aria) → option list 1..n → Back → Next/See my matches → Save as draft' },
  { page: 'dashboard-desktop', order: 'Left rail (Dashboard → Applications → Documents → Support) → search → notifications → avatar → Start application → View all → scheme cards → View timeline' },
  { page: 'eligibility-results-desktop', order: 'Filter chips → sort select → scheme cards (Apply now) ' },
  { page: 'scheme-detail-desktop', order: 'Back to results → eligibility checklist toggles → required documents (open upload overlay) → Save for later → Start application' },
  { page: 'application-overview-desktop', order: 'Stepper → Upload documents → Message caseworker → Continue application → View timeline' },
  { page: 'application-documents-desktop', order: 'Dropzone (Enter/Space) → doc thumbnails → OCR field Accept/Edit buttons → View in document → Enter manually' },
  { page: 'application-details-desktop', order: 'Fields in DOM order (name → DOB → insurer → policy no → address → bank → IFSC) → Save & continue' },
  { page: 'application-consent-desktop', order: 'Consent checkbox → e-sign input → I agree and submit → (modal) review buttons' },
  { page: 'submission-confirmation-desktop', order: 'View timeline → Back to dashboard' },
  { page: 'status-timeline-desktop', order: 'Download history → filter chips → per-event Appeal → support' },
] as const

export const framerSnippets = [
  {
    name: 'Page transition (520ms, standard ease)',
    code: `const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

<motion.main
  key={route.pathname}
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.52, ease: [0.22, 0.9, 0.35, 1] }}
>`,
  },
  {
    name: 'Overlay slide-in right (320ms) + exit (280ms)',
    code: `<motion.aside
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{
    enter: { duration: 0.32, ease: [0.22, 0.9, 0.35, 1] },
    exit: { duration: 0.28, ease: [0.4, 0, 0.7, 0.2] },
  }}
>`,
  },
  {
    name: 'Grid reveal by row (stagger 60ms)',
    code: `<motion.div
  variants={{ show: { transition: { staggerChildren: 0.06 } } }}
  initial="hidden"
  animate="show"
>
  {cards.map((c) => (
    <motion.article
      key={c.id}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 0.9, 0.35, 1] } },
      }}
    >
      {c.content}
    </motion.article>
  ))}
</motion.div>`,
  },
  {
    name: 'Card hover lift (-6px) + shadow-2 (140ms)',
    code: `<motion.article
  whileHover={{ y: -6, boxShadow: 'var(--shadow-2)' }}
  transition={{ duration: 0.14, ease: 'easeOut' }}
>`,
  },
  {
    name: 'OTP / consent modal (scale 0.995 → 1, 320ms)',
    code: `<motion.div
  initial={{ opacity: 0, scale: 0.995, y: 8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.99, y: 4 }}
  transition={{ duration: 0.32, ease: [0.22, 0.9, 0.35, 1] }}
>`,
  },
  {
    name: 'Timeline new item (translateX -12px + overshoot, 260ms)',
    code: `<motion.li
  initial={{ opacity: 0, x: -12 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.26, ease: [0.34, 1.3, 0.64, 1] }}
>`,
  },
  {
    name: 'Reduced motion gate (use everywhere transforms run)',
    code: `const reduced = useReducedMotion()

<motion.div
  animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
>`,
  },
] as const

export const a11yChecklist = [
  'All interactive elements are reachable and operable by keyboard; visible :focus-visible ring using --border-focus.',
  'Overlays (drawers, modals) trap focus while open, close on Escape, and restore focus to the trigger on close.',
  'Dialogs use role="dialog" + aria-modal="true" with accessible names; OTP inputs have per-digit aria-labels.',
  'Icon-only buttons carry aria-label (close, notifications, menu).',
  'Toast messages use role="status" aria-live="polite"; errors use role="alert" via inline field errors.',
  'Colour contrast meets WCAG 2.1 AA for text and UI components (verify final palette).',
  'prefers-reduced-motion is honoured globally: transforms and animations are removed; parallax and stagger disabled.',
  'Form fields have visible labels; sensitive field (policy number) is flagged with a lock icon and aria-describedby hint.',
  'Language of the page is set via <html lang> and switches with the language toggle (en-IN / es).',
  'Target size of interactive elements is at least 40×40 px (buttons, icon buttons, chips).',
] as const
