import { CertificatePanel } from './CertificatePanel'
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEMESTERS } from '../content/registry'
import type { ExamConfig, Lesson } from '../lib/types'
import { exportJSON, importJSON, loadUI, saveUI, useProgress } from '../lib/storage'
import { toArabicDigits } from '../lib/arabicText'
import { starsText } from '../lib/feedback'

const KIND: Record<Lesson['kind'], string> = { reading: '📖', language: '✏️', skill: '🎤' }

function Fold({ id, title, def, children, level }: { id: string; title: string; def: boolean; children: React.ReactNode; level: 1 | 2 }) {
  const [ui, setUi] = useState(loadUI)
  const open = ui[id] ?? def
  const toggle = () => { const n = { ...ui, [id]: !open }; setUi(n); saveUI(n) }
  return (
    <section className={'fold l' + level}>
      <button className="fold-head" onClick={toggle} aria-expanded={open}>
        <span>{title}</span><span className="chev">{open ? '▾' : '◂'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div className="fold-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function ExamCard({ e }: { e: ExamConfig }) {
  const p = useProgress().exams[e.id]
  const locked = p?.lockedUntil && p.lockedUntil > Date.now()
  const hrs = locked ? Math.ceil((p!.lockedUntil! - Date.now()) / 3600_000) : 0
  const card = (
    <a className={'exam ' + e.kind + (locked ? ' locked' : '')} href={'#/exam/' + e.id}>
      <span className="emoji">{e.emoji}</span>
      <span className="grow">
        <b>{e.title}</b>
        <small>{toArabicDigits(e.n)} سؤالاً — النجاح {toArabicDigits(e.pass)}٪{e.strict ? ' — اختبار جاد' : ''}</small>
      </span>
      <span className="status">
        {locked ? `🔒 بعد ${toArabicDigits(hrs)} ساعة` : p ? `${p.passed ? '✅' : '🔁'} ${toArabicDigits(p.best)}٪` : '—'}
      </span>
    </a>
  )
  // شهادة الشكر والتقدير: لاختباري المنتصف والنهاية بعد النجاح فيهما فقط
  if (e.kind === 'review' || !p?.passed) return card
  return <div className="exam-wrap">{card}<CertificatePanel exam={e} /></div>
}

export function Home() {
  const prog = useProgress()
  const file = useRef<HTMLInputElement>(null)

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lugha-progress.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const doImport = async (f?: File) => {
    if (!f) return
    const ok = importJSON(await f.text())
    alert(ok ? 'تم استيراد التقدم بنجاح ✅' : 'الملف غير صالح ❌')
  }
  const mistakes = Object.keys(prog.mistakes).length

  return (
    <div className="page">
      <header className="hero">
        <h1>📚 لغتي الخالدة</h1>
        <p>الصف الأول المتوسط — نتعلّم بمرح، خطوة بخطوة</p>
        <div className="row wrap">
          <a className="btn ghost" href="#/mistakes">🧩 سجل الأخطاء ({toArabicDigits(mistakes)})</a>
          <button className="btn ghost" onClick={doExport}>⬇️ تصدير التقدم</button>
          <button className="btn ghost" onClick={() => file.current?.click()}>⬆️ استيراد</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
      </header>

      {SEMESTERS.map((s) => (
        <Fold key={s.id} id={'sem:' + s.id} title={'📘 ' + s.title} def={true} level={1}>
          {s.units.map((u, ui) => {
            const review = s.exams.find((e) => e.kind === 'review' && e.unitIds[0] === u.id)
            const after = s.exams.filter((e) => e.kind === 'mid' && e.afterUnit === u.id)
            const earned = u.lessons.reduce((a, l) => a + (prog.stars[l.id] ?? 0), 0)
            return (
              <div key={u.id}>
                <Fold id={'unit:' + u.id} title={`${u.emoji} ${u.title}  ·  ⭐ ${toArabicDigits(earned)}/${toArabicDigits(u.lessons.length * 3)}`} def={ui === 0} level={2}>
                  <ul className="lessons">
                    {u.lessons.map((l) => (
                      <li key={l.id}>
                        <a href={'#/lesson/' + l.id}>
                          <span className="k">{KIND[l.kind]}</span>
                          <span className="grow">{l.emoji} {l.title}</span>
                          <span className="stars">{starsText(prog.stars[l.id] ?? 0)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  {review && <ExamCard e={review} />}
                </Fold>
                {after.map((e) => <ExamCard key={e.id} e={e} />)}
              </div>
            )
          })}
          {s.exams.filter((e) => e.kind === 'final').map((e) => <ExamCard key={e.id} e={e} />)}
        </Fold>
      ))}
    </div>
  )
}
