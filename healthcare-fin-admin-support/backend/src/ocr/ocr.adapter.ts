import { Injectable, Logger } from '@nestjs/common'

/**
 * OCR adapter interface + two implementations:
 *  - MockOcrAdapter: deterministic dev parser (no external calls).
 *  - GoogleVisionAdapter: TODO(org) — wire @google-cloud/vision here.
 *
 * Selection: OCR_PROVIDER=mock|gcv. Both return the same OcrResult shape so
 * the pipeline (documents.service) is provider-agnostic.
 */
export type OcrField = { label: string; value: string; confidence: number }
export type OcrResult = {
  provider: 'mock' | 'gcv'
  text: string
  fields: OcrField[]
  error?: string
}

export interface OcrAdapter {
  readonly provider: 'mock' | 'gcv'
  process(buffer: Buffer, contentType: string, docType: string): Promise<OcrResult>
}

@Injectable()
export class MockOcrAdapter implements OcrAdapter {
  readonly provider = 'mock' as const
  private readonly logger = new Logger('MockOcrAdapter')

  async process(buffer: Buffer, contentType: string, docType: string): Promise<OcrResult> {
    // Deterministic "extraction" by doc type — enough to exercise the flow.
    this.logger.debug(`mock OCR on ${docType} (${contentType}, ${buffer.length}B)`)
    const templates: Record<string, OcrField[]> = {
      aadhaar: [
        { label: 'name', value: 'Sunita Devi', confidence: 0.98 },
        { label: 'dob', value: '14/03/1986', confidence: 0.96 },
        { label: 'id_last4', value: '4218', confidence: 0.99 },
      ],
      hospital_invoice: [
        { label: 'invoice_no', value: 'RHC/2026/07124', confidence: 0.94 },
        { label: 'amount_inr', value: '186400', confidence: 0.97 },
        { label: 'hospital', value: 'Ruby Hall Clinic, Pune', confidence: 0.95 },
      ],
      income_proof: [
        { label: 'annual_income_inr', value: '240000', confidence: 0.91 },
        { label: 'employer', value: 'Self-employed', confidence: 0.83 },
      ],
      bank_passbook: [
        { label: 'account_last4', value: '4412', confidence: 0.97 },
        { label: 'ifsc', value: 'SBIN0001234', confidence: 0.93 },
      ],
    }
    return {
      provider: 'mock',
      text: templates[docType]?.map((f) => `${f.label}: ${f.value}`).join('\n') ?? '',
      fields: templates[docType] ?? [],
    }
  }
}

@Injectable()
export class GoogleVisionAdapter implements OcrAdapter {
  readonly provider = 'gcv' as const
  private readonly logger = new Logger('GoogleVisionAdapter')

  async process(buffer: Buffer, contentType: string, docType: string): Promise<OcrResult> {
    // TODO(org): wire @google-cloud/vision:
    //   const client = new ImageAnnotatorClient()
    //   const [res] = await client.documentTextDetection({ image: { content: buffer } })
    //   const text = res.fullTextAnnotation?.text ?? ''
    //   … map regex/templated fields per docType with confidence from res.
    // Then REVIEW the Data Processing Addendum and mark data-flow
    // **REQUIRES LEGAL REVIEW** (citizen documents leave your tenancy).
    this.logger.warn('GoogleVisionAdapter not wired — falling back to mock behaviour')
    return new MockOcrAdapter().process(buffer, contentType, docType)
  }
}

export function ocrAdapterFactory(): OcrAdapter {
  return process.env.OCR_PROVIDER === 'gcv' ? new GoogleVisionAdapter() : new MockOcrAdapter()
}
