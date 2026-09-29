import { useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

/** Page 9 — application-details: prefilled form (profile + OCR), sensitive policy no., inline validation. */
export function ApplicationDetails() {
  const { t } = useI18n()
  const { showToast, setActiveDocStage } = useAppState()
  const [form, setForm] = useState({
    name: 'Sunita Devi',
    dob: '14/03/1986',
    insurer: 'AcmeCare',
    policyNo: 'ACME-88-44120',
    address: '12 Shivaji Nagar, Pune 411005',
    bankAccount: 'XXXXXX4412',
    ifsc: 'SBIN0001234',
  })
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [shake, setShake] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: null }))
  }

  function validate(): boolean {
    const errs: Record<string, string | null> = {}
    if (!form.name.trim()) errs.name = t('toast.errorRequired')
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.dob)) errs.dob = t('details.errorDob')
    if (!form.policyNo.trim()) errs.policyNo = t('toast.errorRequired')
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const keys = Object.keys(errs)
      setShake(Object.fromEntries(keys.map((k) => [k, true])))
      window.setTimeout(() => setShake({}), 400)
      return false
    }
    return true
  }

  function save() {
    if (!validate()) return
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      setActiveDocStage('details')
      showToast(t('toast.detailsSaved'))
    }, 700)
  }

  return (
    <AppShell active="/application-details">
      <TopHeader />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <h1 className="u-h2">{t('details.title')}</h1>
        <p className="u-body u-muted mt-1">{t('details.subtitle')}</p>

        <div className="mt-6 flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-1)]">
          <div className={shake.name ? 'u-shake' : ''}>
            <Input label={t('details.name')} helpKey="help.name" value={form.name} error={errors.name ?? undefined} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={shake.dob ? 'u-shake' : ''}>
              <Input label={t('details.dob')} helpKey="help.dob" placeholder="DD/MM/YYYY" value={form.dob} error={errors.dob ?? undefined} onChange={(e) => set('dob', e.target.value)} />
            </div>
            <Input label={t('details.insurer')} value={form.insurer} onChange={(e) => set('insurer', e.target.value)} />
          </div>

          {/* Sensitive field */}
          <div className={shake.policyNo ? 'u-shake' : ''}>
            <Input
              label={t('details.policyNo')}
              helpKey="help.policyNo"
              type="password"
              value={form.policyNo}
              error={errors.policyNo ?? undefined}
              hint={t('details.policyNoHint')}
              sensitive
              onChange={(e) => set('policyNo', e.target.value)}
            />
          </div>

          <Input label={t('details.address')} value={form.address} onChange={(e) => set('address', e.target.value)} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label={t('details.bankAccount')} value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} />
            <Input label={t('details.ifsc')} value={form.ifsc} onChange={(e) => set('ifsc', e.target.value)} />
          </div>

          <div className="mt-2 flex justify-end">
            <Button size="lg" loading={saving} onClick={save}>
              {t('details.saveContinue')}
            </Button>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
