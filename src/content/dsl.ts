import type { Block, MC, WR, Lesson, LessonKind } from '../lib/types'
import { hash } from '../lib/arabicText'

export const say = (text: string, emoji?: string): Block => ({ t: 'say', text, emoji })
export const reveal = (title: string, text: string): Block => ({ t: 'reveal', title, text })
export const widget = (id: string, props: any): Block => ({ t: 'widget', id, props })
export const practice = (gen: string, n = 5): Block => ({ t: 'practice', gen, n })
export const passageB = (text: string, title?: string): Block => ({ t: 'passage', text, title })

/** سؤال اختيار من متعدد: الأول هو الصحيح (تخلط الواجهة الترتيب). كل مشتت له تفسير. */
export function mc(q: string, right: string, rightWhy: string, wrongs: [string, string][], passage?: string): MC {
  return {
    kind: 'mc', id: hash(q + '|' + right), q, passage,
    opts: [{ t: right, why: rightWhy }, ...wrongs.map(([t, why]) => ({ t, why }))],
    correct: 0,
  }
}
export function wr(q: string, answers: string[], why: string, wrong: { a: string; why: string }[] = [], exact = false): WR {
  return { kind: 'wr', id: hash(q + '|' + answers[0]), q, answers, why, wrong, exact }
}
export const quiz = (q: MC | WR): Block => ({ t: 'quiz', q })

export function lesson(id: string, title: string, emoji: string, kind: LessonKind, blocks: Block[], gens?: string[]): Lesson {
  return { id, title, emoji, kind, blocks, gens }
}

export type RQ = [string, string, string, [string, string][]]
/** درس قراءة: نص جديد بصياغتنا + مفردات + أسئلة تحمل النص معها (لتصلح في الاختبارات). */
export function reading(id: string, title: string, emoji: string, intro: string, text: string, vocab: [string, string][], qs: RQ[]): Lesson {
  const blocks: Block[] = [
    say(intro, emoji),
    passageB(text, 'نص جديد على نمط الدرس'),
    ...vocab.map(([w, m]) => reveal(`معنى «${w}»`, m)),
    ...qs.map(([q, r, rw, ws]) => quiz(mc(q, r, rw, ws, text))),
  ]
  return lesson(id, title, emoji, 'reading', blocks)
}
