import type { TranslationKey } from '../i18n/translations'

export type ProviderType = 'govt' | 'insurer' | 'trust'

export type Scheme = {
  id: string
  nameKey: TranslationKey
  providerKey: TranslationKey
  amount: string
  amountValue: number
  match: number
  providerType: ProviderType
  docsKeys: TranslationKey[]
}

export const schemes: Scheme[] = [
  {
    id: 'hospital-care-subsidy',
    nameKey: 'scheme.title',
    providerKey: 'scheme.provider',
    amount: '₹2,00,000',
    amountValue: 200000,
    match: 92,
    providerType: 'govt',
    docsKeys: ['scheme.docs1', 'scheme.docs2', 'scheme.docs3', 'scheme.docs4'],
  },
  {
    id: 'acmecare-topup',
    nameKey: 'results.schemeAcme',
    providerKey: 'results.schemeAcmeProvider',
    amount: '₹1,50,000',
    amountValue: 150000,
    match: 78,
    providerType: 'insurer',
    docsKeys: ['scheme.docs1', 'scheme.docs2', 'scheme.docs3'],
  },
  {
    id: 'hope-trust-grant',
    nameKey: 'results.schemeHope',
    providerKey: 'results.schemeHopeProvider',
    amount: '₹75,000',
    amountValue: 75000,
    match: 64,
    providerType: 'trust',
    docsKeys: ['scheme.docs1', 'scheme.docs2'],
  },
]

export type OcrField = {
  id: string
  labelKey: TranslationKey
  value: string
  confidence: number
  accepted: boolean
}

export type DocItem = {
  id: string
  nameKey: TranslationKey
  status: 'uploaded' | 'processing' | 'flagged'
  fields: OcrField[]
}

const aadhaarFields: OcrField[] = [
  { id: 'name', labelKey: 'docs.fieldName', value: 'Sunita Devi', confidence: 98, accepted: true },
  { id: 'dob', labelKey: 'docs.fieldDob', value: '14/03/1986', confidence: 96, accepted: true },
  { id: 'idNumber', labelKey: 'docs.fieldIdNumber', value: 'XXXX XXXX 4218', confidence: 99, accepted: false },
]

const invoiceFields: OcrField[] = [
  { id: 'invoiceNo', labelKey: 'docs.fieldInvoiceNo', value: 'RHC/2026/07124', confidence: 94, accepted: false },
  { id: 'amount', labelKey: 'docs.fieldAmount', value: '₹1,86,400', confidence: 97, accepted: false },
  { id: 'hospital', labelKey: 'docs.fieldHospital', value: 'Ruby Hall Clinic, Pune', confidence: 95, accepted: true },
]

export const initialDocs: DocItem[] = [
  { id: 'doc-aadhaar', nameKey: 'docs.docAadhaar', status: 'uploaded', fields: aadhaarFields },
  { id: 'doc-invoice', nameKey: 'docs.docInvoice', status: 'uploaded', fields: invoiceFields },
  { id: 'doc-income', nameKey: 'docs.docIncome', status: 'processing', fields: [] },
  { id: 'doc-bank', nameKey: 'docs.docBank', status: 'flagged', fields: [] },
]

export type TimelineEvent = {
  id: string
  titleKey: TranslationKey
  timeKey: TranslationKey
  bodyKey?: TranslationKey
  type: TimelineType
  isNew?: boolean
  actionable?: boolean
}

export type TimelineType = 'status' | 'docs' | 'messages'

export const timelineEvents: TimelineEvent[] = [
  { id: 'ev3', titleKey: 'timeline.ev3', timeKey: 'timeline.ev3.time', bodyKey: 'timeline.ev3.body', type: 'status', isNew: true, actionable: false },
  { id: 'ev2', titleKey: 'timeline.ev2', timeKey: 'timeline.ev2.time', bodyKey: 'timeline.ev2.body', type: 'status', actionable: false },
  { id: 'ev1', titleKey: 'timeline.ev1', timeKey: 'timeline.ev1.time', type: 'docs', actionable: true },
]
