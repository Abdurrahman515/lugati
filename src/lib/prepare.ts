import type { MC, Q } from './types'
import { shuffle } from './arabicText'

/** يخلط ترتيب خيارات الاختيار من متعدد ويحدّث رقم الجواب الصحيح. */
export function prepare(q: Q): Q {
  if (q.kind !== 'mc') return q
  const idx = shuffle(q.opts.map((_, i) => i))
  const opts = idx.map((i) => q.opts[i])
  const correct = idx.indexOf(q.correct)
  const m: MC = { ...q, opts, correct }
  return m
}
