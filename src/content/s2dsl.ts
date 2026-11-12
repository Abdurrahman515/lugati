import { lesson, mc, practice, quiz, reveal, say, widget } from './dsl'
import type { Block, Lesson, LessonKind } from '../lib/types'
import type { RQ } from './dsl'

/** نشاط تصنيف: كل عنصر [الكلمة، فهرس الخانة، التفسير]. */
export const sorter = (title: string, cats: string[], items: [string, number, string][]): Block =>
  widget('sorter', { title, cats, items: items.map(([t, c, why]) => ({ t, c, why })) })

/** نشاط تظليل: answer فهارس الكلمات المطلوبة. */
export const hl = (prompt: string, words: string[], answer: number[], why: string): Block =>
  widget('highlighter', { prompt, words, answer, why })

export const rv = reveal

/**
 * درس لغوي/مهاري بصياغة موحدة: شرح (say) ثم أنشطة وكشف (blocks) ثم أسئلة ثابتة ثم تدريب متجدد.
 * الشرح الأول يحمل رمز الدرس.
 */
export function lang(
  id: string, title: string, emoji: string, says: string[], blocks: Block[], qs: RQ[],
  gen: string | null = null, kind: LessonKind = 'language',
): Lesson {
  const all: Block[] = [
    ...says.map((t, i) => say(t, i === 0 ? emoji : undefined)),
    ...blocks,
    ...qs.map(([q, r, rw, ws]) => quiz(mc(q, r, rw, ws))),
    ...(gen ? [practice(gen, 5)] : []),
  ]
  return lesson(id, title, emoji, kind, all, gen ? [gen] : undefined)
}
export const skill = (id: string, title: string, emoji: string, says: string[], blocks: Block[], qs: RQ[]) =>
  lang(id, title, emoji, says, blocks, qs, null, 'skill')
