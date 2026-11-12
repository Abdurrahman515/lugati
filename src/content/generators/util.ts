import { mc } from '../dsl'
import { sample } from '../../lib/arabicText'
import type { MC } from '../../lib/types'

export type Pair = [string, string]

/** يبني سؤالاً بخيار صحيح واحد وk مشتتات مختلفة النص عن الصحيح وعن بعضها. */
export function build(q: string, right: Pair, wrongs: Pair[], k = 3, passage?: string): MC {
  const seen = new Set<string>([right[0]])
  const uniq: Pair[] = []
  for (const w of sample(wrongs, wrongs.length)) {
    if (!seen.has(w[0])) { seen.add(w[0]); uniq.push(w) }
  }
  return mc(q, right[0], right[1], uniq.slice(0, k), passage)
}
export const strip = (s: string) => s.replace(/[\u064B-\u065F\u0670]/g, '')
