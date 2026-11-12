import { useState } from 'react'
import type { ExamConfig } from '../lib/types'
import { NAME_MAX, downloadCertificate, sanitizeName } from '../lib/certificate'
import './certificate.css'

/** زر شهادة الشكر والتقدير: تكتب الطالبة اسمها فتُنزَّل الشهادة بصيغة PDF أفقي. يعمل دون اتصال. */
export function CertificatePanel({ exam }: { exam: ExamConfig }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const clean = sanitizeName(name)

  const make = async () => {
    if (!clean || state === 'busy') return
    setState('busy')
    try { await downloadCertificate(clean, exam.title); setState('done') } catch { setState('error') }
  }

  return (
    <div className="cert-panel">
      <button className="btn ghost" aria-expanded={open} onClick={() => setOpen(!open)}>🏅 شهادة شكر وتقدير</button>
      {open && (
        <div className="card">
          <b>اكتبي اسمك لتطلع الشهادة باسمك 🌸</b>
          <div className="cert-form">
            <input
              value={name}
              maxLength={NAME_MAX}
              placeholder="اسم الطالبة"
              aria-label="اسم الطالبة"
              onChange={(e) => { setName(e.target.value); setState('idle') }}
              onKeyDown={(e) => { if (e.key === 'Enter') make() }}
            />
            <button className="btn cert" disabled={!clean || state === 'busy'} onClick={make}>
              {state === 'busy' ? 'عم تتجهّز الشهادة…' : 'اطبعي الشهادة'}
            </button>
          </div>
          {state === 'done' && <p className="cert-note">تمّ! نزل ملف الشهادة (PDF) على جهازك 🎉 افتحيه واطبعيه.</p>}
          {state === 'error' && <p className="cert-note">صار خطأ وما قدرنا نجهّز الشهادة 😕 جرّبي مرة تانية.</p>}
          {!clean && name.trim() !== '' && <p className="cert-note">اكتبي اسماً من حرفين على الأقل.</p>}
        </div>
      )}
    </div>
  )
}
