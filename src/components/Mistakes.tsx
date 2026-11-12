import { clearMistake, useProgress } from '../lib/storage'
import { RichText } from './RichText'
import { toArabicDigits } from '../lib/arabicText'

export function Mistakes() {
  const m = useProgress().mistakes
  const list = Object.entries(m).sort((a, b) => b[1].ts - a[1].ts)
  return (
    <div className="page">
      <div className="topbar"><a className="back" href="#/">→ الرئيسية</a></div>
      <h1>🧩 سجل الأخطاء</h1>
      {list.length === 0 && <div className="card">لا أخطاء محفوظة حالياً. ممتاز! 🌟</div>}
      {list.map(([id, r]) => (
        <div key={id} className="card mistake">
          <RichText text={r.q} />
          <div className="fb bad"><b>اخترتِ:</b> {r.chosen}<RichText text={r.why} /></div>
          <div className="fb ok"><b>الصحيح:</b> {r.correct}</div>
          <div className="row"><small className="muted">تكرر الخطأ {toArabicDigits(r.count)} مرة</small>
            <button className="btn ghost" onClick={() => clearMistake(id)}>فهمتها، احذفيها</button></div>
        </div>
      ))}
    </div>
  )
}
