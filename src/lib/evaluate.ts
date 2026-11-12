import type { Q } from './types'
import { sameAnswer } from './arabicText'

export type Ans = { q: Q; ok: boolean; chosen: string; correct: string; why: string }

export function correctText(q: Q) { return q.kind === 'mc' ? q.opts[q.correct].t : q.answers[0] }

/** يقيّم إجابة (نص الخيار المختار أو الإجابة المكتوبة) على سؤال. */
export function evaluate(q: Q, chosen: string): Ans {
  if (q.kind === 'mc') {
    const o = q.opts.find((x) => x.t === chosen)
    return { q, ok: chosen === q.opts[q.correct].t, chosen, correct: q.opts[q.correct].t, why: o?.why ?? '' }
  }
  const ok = sameAnswer(chosen, q.answers, q.exact)
  const w = q.wrong?.find((x) => sameAnswer(chosen, [x.a], q.exact))
  return { q, ok, chosen, correct: q.answers[0], why: ok ? q.why : w ? w.why : q.why }
}
