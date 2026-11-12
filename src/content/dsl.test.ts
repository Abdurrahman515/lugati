import { describe, it, expect } from 'vitest'
import { lesson, mc, passageB, practice, quiz, reading, reveal, say, widget, wr } from './dsl'

describe('mc', () => {
  const q = mc('سؤال؟', 'صح', 'لأنه صح', [['خطأ١', 'ت١'], ['خطأ٢', 'ت٢']], 'نص')
  it('الصحيح أولاً وفهرسه 0 وكل خيار له تفسير', () => {
    expect(q.kind).toBe('mc')
    expect(q.correct).toBe(0)
    expect(q.opts[0]).toEqual({ t: 'صح', why: 'لأنه صح' })
    expect(q.opts).toHaveLength(3)
    expect(q.passage).toBe('نص')
  })
  it('المعرّف ثابت ويتغير بتغير السؤال أو الجواب', () => {
    const same = mc('سؤال؟', 'صح', 'x', [['أ', 'ب']])
    expect(same.id).toBe(q.id)
    expect(mc('سؤال؟', 'صح٢', 'x', [['أ', 'ب']]).id).not.toBe(q.id)
    expect(mc('سؤال٢؟', 'صح', 'x', [['أ', 'ب']]).id).not.toBe(q.id)
  })
})

describe('wr', () => {
  it('يحفظ الإجابات والتفسير والخاطئ الشائع والوضع الدقيق', () => {
    const w = wr('اكتبي', ['أ', 'ب'], 'لأن', [{ a: 'ج', why: 'غلط' }], true)
    expect(w.kind).toBe('wr')
    expect(w.answers).toEqual(['أ', 'ب'])
    expect(w.exact).toBe(true)
    expect(w.wrong).toHaveLength(1)
  })
  it('exact افتراضياً false (قيمة غير مفعّلة)', () => {
    expect(wr('س', ['أ'], 'ل').exact).toBeFalsy()
  })
})

describe('الكتل', () => {
  it('say/reveal/widget/practice/passage/quiz', () => {
    expect(say('نص', '🙂')).toEqual({ t: 'say', text: 'نص', emoji: '🙂' })
    expect(reveal('ع', 'م')).toEqual({ t: 'reveal', title: 'ع', text: 'م' })
    expect(widget('sorter', { a: 1 })).toEqual({ t: 'widget', id: 'sorter', props: { a: 1 } })
    expect(practice('g')).toEqual({ t: 'practice', gen: 'g', n: 5 })
    expect((practice('g', 3) as { n: number }).n).toBe(3)
    expect(passageB('ن', 'ع')).toEqual({ t: 'passage', text: 'ن', title: 'ع' })
    expect(quiz(mc('س', 'ص', 'ل', [['خ', 'غ']])).t).toBe('quiz')
  })
})

describe('lesson / reading', () => {
  it('lesson يجمع الحقول', () => {
    const l = lesson('id', 'عنوان', '📘', 'language', [say('أ')], ['g'])
    expect(l).toMatchObject({ id: 'id', title: 'عنوان', emoji: '📘', kind: 'language', gens: ['g'] })
  })
  it('reading: شرح + نص + كشف المفردات + أسئلة تحمل النص', () => {
    const l = reading('r', 'قراءة', '📖', 'مقدمة', 'النص هنا', [['كلمة', 'معناها']], [['س؟', 'ص', 'ل', [['خ', 'غ']]]])
    expect(l.kind).toBe('reading')
    expect(l.blocks.map((b) => b.t)).toEqual(['say', 'passage', 'reveal', 'quiz'])
    const qb = l.blocks[3]
    if (qb.t !== 'quiz') throw new Error()
    expect(qb.q.passage).toBe('النص هنا')
  })
})
