import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Q } from '../lib/types'
import { prepare } from '../lib/prepare'
import { sameAnswer } from '../lib/arabicText'
import { clearMistake, logMistake } from '../lib/storage'
import { cleanWhy, hintOnly, randomPraise, randomRetry } from '../lib/feedback'
import { RichText } from './RichText'

type Props = {
  q: Q
  lessonId: string
  /**
   * بدون retry: تُستدعى بعد المحاولة الأولى.
   * مع retry: تُستدعى عند الوصول إلى الجواب الصحيح، ومعها: هل كانت من أول محاولة؟
   * المعامل الثالث: ما اختارته الطالبة في أول محاولة (للتقييم والتسجيل).
   */
  onDone?: (firstTry: boolean, chosen: string, firstChosen: string) => void
  /** عند true لا تُحفظ الأخطاء هنا (يتولى ذلك المستدعي). */
  skipLog?: boolean
  /** وضع الدرس: تعيد الطالبة المحاولة حتى تصل للجواب الصحيح دون كشفه لها. */
  retry?: boolean
}

type Fb = { ok: boolean; head: string; msg: string; right?: string; rightWhy?: string }

export function QuizCard({ q, lessonId, onDone, skipLog, retry }: Props) {
  const pq = useMemo(() => prepare(q), [q])
  const [wrongs, setWrongs] = useState<number[]>([])
  const [text, setText] = useState('')
  const [solved, setSolved] = useState(false)
  const [fb, setFb] = useState<Fb | null>(null)
  const [tries, setTries] = useState(0)
  const attempts = useRef(0)
  const firstChosen = useRef('')
  const done = useRef(false)

  /** يسجّل نتيجة المحاولة الأولى فقط (سجل الأخطاء). */
  const recordFirst = (ok: boolean, chosen: string, correctText: string, why: string) => {
    if (attempts.current > 0) return
    attempts.current = 1
    firstChosen.current = chosen
    if (skipLog) return
    if (ok) clearMistake(q.id)
    else logMistake(q.id, { lesson: lessonId, q: q.q, chosen, correct: correctText, why })
  }
  const complete = (firstOk: boolean, chosen: string) => {
    if (done.current) return
    done.current = true
    onDone?.(firstOk, chosen, firstChosen.current)
  }

  const pickMC = (i: number) => {
    if (pq.kind !== 'mc' || solved || wrongs.includes(i)) return
    const ok = i === pq.correct
    const right = pq.opts[pq.correct]
    const first = attempts.current === 0
    recordFirst(ok, pq.opts[i].t, right.t, pq.opts[i].why)
    setTries((t) => t + 1)
    if (ok) {
      setSolved(true)
      setFb({ ok: true, head: randomPraise(), msg: cleanWhy(right.why) })
      complete(first, pq.opts[i].t)
      return
    }
    setWrongs((w) => [...w, i])
    if (retry) {
      setFb({ ok: false, head: randomRetry(), msg: hintOnly(pq.opts[i].why) })
    } else {
      setSolved(true)
      setFb({ ok: false, head: 'لأ، مو هيك 🤔', msg: pq.opts[i].why, right: right.t, rightWhy: right.why })
      complete(false, pq.opts[i].t)
    }
  }

  const checkWR = () => {
    if (pq.kind !== 'wr' || solved || !text.trim()) return
    const ok = sameAnswer(text, pq.answers, pq.exact)
    const w = pq.wrong?.find((x) => sameAnswer(text, [x.a], pq.exact))
    const first = attempts.current === 0
    recordFirst(ok, text, pq.answers[0], w ? w.why : pq.why)
    setTries((t) => t + 1)
    if (ok) {
      setSolved(true)
      setFb({ ok: true, head: randomPraise(), msg: cleanWhy(pq.why) })
      complete(first, text)
    } else if (retry) {
      setFb({ ok: false, head: randomRetry(), msg: w ? hintOnly(w.why) : '' })
    } else {
      setSolved(true)
      setFb({ ok: false, head: 'لأ، مو هيك 🤔', msg: w ? w.why : pq.why, right: pq.answers[0] })
      complete(false, text)
    }
  }

  return (
    <motion.div className="card quiz" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {pq.passage && <div className="passage small"><RichText text={pq.passage} /></div>}
      <div className="qtext"><RichText text={pq.q} /></div>

      {pq.kind === 'mc' ? (
        <div className="opts">
          {pq.opts.map((o, i) => {
            const cls = solved
              ? (i === pq.correct ? 'opt right' : wrongs.includes(i) ? 'opt wrong' : 'opt dim')
              : (wrongs.includes(i) ? 'opt wrong' : 'opt')
            return (
              <button key={i} className={cls} onClick={() => pickMC(i)} disabled={solved || wrongs.includes(i)}>
                {o.t}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="wr">
          <input value={text} onChange={(e) => setText(e.target.value)} disabled={solved} placeholder="اكتبي إجابتك هنا"
            onKeyDown={(e) => e.key === 'Enter' && checkWR()} />
          {!solved && <button className="btn" onClick={checkWR}>تحقّقي</button>}
        </div>
      )}

      {fb && (
        <motion.div key={tries} className={'fb ' + (fb.ok ? 'ok' : 'bad')} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <b>{fb.head}</b>
          {fb.msg && <RichText text={fb.msg} />}
          {fb.right && (
            <div className="correct">
              <b>الجواب الصحيح:</b> {fb.right}
              {fb.rightWhy && <RichText text={cleanWhy(fb.rightWhy)} />}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
