import { useMemo, useRef, useState } from 'react'
import type { ExamConfig, Q } from '../lib/types'
import { buildExam } from '../content/exams'
import { QuizCard } from './QuizCard'
import { CertificatePanel } from './CertificatePanel'
import { RichText } from './RichText'
import { logMistake, recordExam, useProgress } from '../lib/storage'
import { toArabicDigits } from '../lib/arabicText'
import { correctText, evaluate } from '../lib/evaluate'
import type { Ans } from '../lib/evaluate'

/** سؤال في الاختبار الجاد: لا تفسير قبل نهاية الاختبار. */
function StrictQuestion({ q, onNext, last }: { q: Q; onNext: (chosen: string) => void; last: boolean }) {
  const [sel, setSel] = useState<string>('')
  return (
    <div className="card quiz">
      {q.passage && <div className="passage small"><RichText text={q.passage} /></div>}
      <div className="qtext"><RichText text={q.q} /></div>
      {q.kind === 'mc' ? (
        <div className="opts">
          {q.opts.map((o, i) => (
            <button key={i} className={'opt' + (sel === o.t ? ' picked' : '')} onClick={() => setSel(o.t)}>{o.t}</button>
          ))}
        </div>
      ) : (
        <div className="wr"><input value={sel} onChange={(e) => setSel(e.target.value)} placeholder="اكتبي إجابتك هنا" /></div>
      )}
      <button className="btn next" disabled={!sel.trim()} onClick={() => onNext(sel)}>{last ? 'إنهاء الاختبار ✔' : 'التالي ←'}</button>
    </div>
  )
}

export function ExamView({ exam }: { exam: ExamConfig }) {
  const rec = useProgress().exams[exam.id]
  const locked = !!rec?.lockedUntil && rec.lockedUntil > Date.now()
  const [phase, setPhase] = useState<'intro' | 'run' | 'result'>('intro')
  const [qs, setQs] = useState<Q[]>([])
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Ans[]>([])
  const [fbDone, setFbDone] = useState(false)
  const saved = useRef(false)

  const start = () => { setQs(buildExam(exam)); setI(0); setAnswers([]); setFbDone(false); saved.current = false; setPhase('run') }

  const finish = (all: Ans[]) => {
    if (saved.current) return
    saved.current = true
    const right = all.filter((a) => a.ok).length
    const pct = Math.round((100 * right) / Math.max(1, all.length))
    recordExam(exam.id, pct, pct >= exam.pass, exam.lockHours)
    if (exam.strict) all.filter((a) => !a.ok).forEach((a) => logMistake(a.q.id, { lesson: 'exam:' + exam.id, q: a.q.q, chosen: a.chosen, correct: a.correct, why: a.why }))
    setPhase('result')
  }
  const push = (a: Ans) => {
    const all = [...answers, a]
    setAnswers(all)
    return all
  }

  const right = answers.filter((a) => a.ok).length
  const pct = useMemo(() => Math.round((100 * right) / Math.max(1, answers.length)), [right, answers.length])

  if (phase === 'intro') {
    const hrs = locked ? Math.ceil((rec!.lockedUntil! - Date.now()) / 3600_000) : 0
    return (
      <div className="page">
        <div className="topbar"><a className="back" href="#/">→ الرئيسية</a></div>
        <h1>{exam.emoji} {exam.title}</h1>
        <div className="card">
          <p>عدد الأسئلة: <b>{toArabicDigits(exam.n)}</b></p>
          <p>حدّ النجاح: <b>{toArabicDigits(exam.pass)}٪</b></p>
          <p>{exam.strict ? 'اختبار جاد: الإجابات والتفسيرات ما بتظهر إلا بعد ما تخلّصي كل الأسئلة.' : 'بعد كل سؤال بيظهر التفسير مباشرة، ولازم توصلي للجواب الصحيح قبل ما تكمّلي. والنتيجة بتنحسب من أول محاولة.'}</p>
          {exam.strict && exam.lockHours && <p>إذا ما نجحتِ بيتقفل الاختبار {toArabicDigits(exam.lockHours)} ساعة قبل الإعادة، فراجعي دروسك منيح.</p>}
          {rec && <p>أفضل نتيجة: <b>{toArabicDigits(rec.best)}٪</b> — المحاولات: {toArabicDigits(rec.attempts)}</p>}
          {locked
            ? <div className="fb bad">🔒 الاختبار مقفول. باقي نحو {toArabicDigits(hrs)} ساعة. راجعي الدروس وسجل الأخطاء وبعدين ارجعي.</div>
            : <button className="btn" onClick={start}>ابدئي الاختبار 🚀</button>}
        </div>
      </div>
    )
  }

  if (phase === 'run') {
    const q = qs[i]
    const last = i === qs.length - 1
    return (
      <div className="page">
        <div className="topbar"><span>{exam.emoji} {exam.title}</span><span>{toArabicDigits(i + 1)} / {toArabicDigits(qs.length)}</span></div>
        <div className="progress"><div style={{ width: `${(100 * i) / qs.length}%` }} /></div>
        {exam.strict ? (
          <StrictQuestion key={i} q={q} last={last} onNext={(c) => {
            const all = push(evaluate(q, c))
            if (last) finish(all); else setI(i + 1)
          }} />
        ) : (
          <>
            <QuizCard key={i} q={q} lessonId={'exam:' + exam.id} retry
              onDone={(_ok, _chosen, firstChosen) => { push(evaluate(q, firstChosen)); setFbDone(true) }} />
            {fbDone && (
              <button className="btn next" onClick={() => {
                setFbDone(false)
                if (last) finish(answers); else setI(i + 1)
              }}>{last ? 'عرض النتيجة' : 'السؤال التالي ←'}</button>
            )}
          </>
        )}
      </div>
    )
  }

  const passed = pct >= exam.pass
  return (
    <div className="page">
      <div className="topbar"><a className="back" href="#/">→ الرئيسية</a></div>
      <h1>{passed ? '🏆 نجحتِ! هيك بدها' : '💪 ما نجحتِ هالمرة، بس ولا يهمّك'}</h1>
      <div className={'card ' + (passed ? 'done' : '')}>
        <h2>{toArabicDigits(right)} من {toArabicDigits(answers.length)} — {toArabicDigits(pct)}٪</h2>
        {!passed && exam.strict && exam.lockHours && <p>الاختبار انقفل {toArabicDigits(exam.lockHours)} ساعة. أخطاؤك محفوظة بـ«سجل الأخطاء» لتراجعيها.</p>}
        {!passed && !exam.strict && <p>أعيدي الاختبار وقت ما بدّك؛ الأسئلة بتتجدد.</p>}
      </div>
      {passed && exam.kind !== 'review' && <CertificatePanel exam={exam} />}
      {answers.filter((a) => !a.ok).length > 0 && <h3 className="section">مراجعة الأسئلة التي أخطأتِ فيها</h3>}
      {answers.filter((a) => !a.ok).map((a, k) => (
        <div key={k} className="card mistake">
          {a.q.passage && <div className="passage small"><RichText text={a.q.passage} /></div>}
          <RichText text={a.q.q} />
          <div className="fb bad"><b>إجابتك:</b> {a.chosen}<RichText text={a.why} /></div>
          <div className="fb ok"><b>الصحيح:</b> {correctText(a.q)}</div>
        </div>
      ))}
      <div className="row nav"><a className="btn" href="#/">الرئيسية</a>
        {!exam.strict || passed ? <button className="btn ghost" onClick={start}>إعادة بأسئلة جديدة 🔄</button> : <span />}</div>
    </div>
  )
}
