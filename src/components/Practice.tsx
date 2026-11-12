import { useRef, useState } from 'react'
import { genSet } from '../content/generators'
import { QuizCard } from './QuizCard'
import { toArabicDigits } from '../lib/arabicText'

type Props = {
  gen: string; n: number; lessonId: string
  /** تُستدعى مرة واحدة عند إنهاء أول جولة: (الصحيحة من أول محاولة، العدد). */
  onComplete?: (score: number, total: number) => void
}

export function Practice({ gen, n, lessonId, onComplete }: Props) {
  const [round, setRound] = useState(0)
  const [qs, setQs] = useState(() => genSet(gen, n))
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const reported = useRef(false)

  const again = () => { setQs(genSet(gen, n)); setI(0); setScore(0); setAnswered(false); setRound((r) => r + 1) }
  if (qs.length === 0) return null

  if (i >= qs.length) {
    return (
      <div className="card practice-end">
        <h3>🎉 خلصت الجولة!</h3>
        <p>جبتِ <b>{toArabicDigits(score)}</b> من <b>{toArabicDigits(qs.length)}</b> من أول محاولة</p>
        <button className="btn" onClick={again}>جولة جديدة بأسئلة مختلفة 🔄</button>
      </div>
    )
  }
  const last = i + 1 >= qs.length
  return (
    <div className="practice">
      <div className="muted">تدريب متجدد — سؤال {toArabicDigits(i + 1)} من {toArabicDigits(qs.length)}</div>
      <QuizCard key={round + '-' + i} q={qs[i]} lessonId={lessonId} retry
        onDone={(ok) => { setAnswered(true); if (ok) setScore((s) => s + 1) }} />
      {answered && (
        <button className="btn next" onClick={() => {
          if (last && !reported.current) { reported.current = true; onComplete?.(score, qs.length) }
          setI(i + 1); setAnswered(false)
        }}>
          {last ? 'عرض النتيجة' : 'السؤال التالي ←'}
        </button>
      )}
    </div>
  )
}
