import { MockOcrAdapter, ocrAdapterFactory } from './ocr.adapter'

describe('MockOcrAdapter', () => {
  const adapter = new MockOcrAdapter()

  it('extracts templated fields for aadhaar', async () => {
    const res = await adapter.process(Buffer.from('x'), 'image/png', 'aadhaar')
    expect(res.provider).toBe('mock')
    expect(res.fields.map((f) => f.label)).toEqual(expect.arrayContaining(['name', 'dob', 'id_last4']))
    expect(res.fields.every((f) => f.confidence > 0.8)).toBe(true)
  })

  it('extracts invoice number and amount for hospital invoices', async () => {
    const res = await adapter.process(Buffer.from('x'), 'application/pdf', 'hospital_invoice')
    const invoice = res.fields.find((f) => f.label === 'invoice_no')
    const amount = res.fields.find((f) => f.label === 'amount_inr')
    expect(invoice?.value).toBe('RHC/2026/07124')
    expect(amount?.value).toBe('186400')
  })

  it('returns empty fields for unknown doc types (flagged path)', async () => {
    const res = await adapter.process(Buffer.from('x'), 'image/png', 'mystery_doc')
    expect(res.fields).toHaveLength(0)
    expect(res.text).toBe('')
  })
})

describe('ocrAdapterFactory', () => {
  it('selects mock by default', () => {
    delete process.env.OCR_PROVIDER
    expect(ocrAdapterFactory().provider).toBe('mock')
  })

  it('selects gcv provider when configured (falls back internally until wired)', () => {
    process.env.OCR_PROVIDER = 'gcv'
    expect(ocrAdapterFactory().provider).toBe('gcv')
    delete process.env.OCR_PROVIDER
  })
})
