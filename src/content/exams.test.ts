import { describe, it, expect } from 'vitest'
import { buildExam, lessonPool, lessonsInScope } from './exams'
import { SEMESTERS, allLessons } from './registry'

describe('lessonsInScope', () => {
  it('يرجع دروس الوحدات المطلوبة فقط وبالترتيب', () => {
    const e = SEMESTERS[0].exams.find((x) => x.id === 'rev-u2')!
    const ls = lessonsInScope(e)
    expect(ls).toHaveLength(13)
    expect(ls.every((l) => l.id.startsWith('u2-'))).toBe(true)
  })
  it('النهاية تضم كل دروس فصلها الدراسي', () => {
    for (const s of SEMESTERS) {
      const e = s.exams.find((x) => x.kind === 'final')!
      expect(lessonsInScope(e)).toHaveLength(s.units.flatMap((u) => u.lessons).length)
    }
  })
})

describe('lessonPool', () => {
  it('يضم أسئلة الدرس الثابتة ومن مولّداته، بلا نقص عن ثلاثة', () => {
    for (const l of allLessons) expect(lessonPool(l).length).toBeGreaterThanOrEqual(3)
  })
  it('كل درس له مولّد يحقق شرط «لكل درس في نطاق اختبار مولّد/أسئلة»', () => {
    for (const l of allLessons) {
      const statics = l.blocks.filter((b) => b.t === 'quiz').length
      expect(statics + (l.gens?.length ?? 0)).toBeGreaterThan(0)
    }
  })
})

describe('buildExam', () => {
  for (const e of SEMESTERS[0].exams) {
    it(`${e.id}: العدد المطلوب بالضبط، بلا تكرار، وكل سؤال سليم (٥ محاولات)`, () => {
      for (let t = 0; t < 5; t++) {
        const qs = buildExam(e)
        expect(qs).toHaveLength(e.n)
        expect(new Set(qs.map((q) => q.q)).size).toBe(qs.length)
        for (const q of qs) {
          expect(q.q.trim()).not.toBe('')
          if (q.kind === 'mc') {
            expect(q.correct).toBeGreaterThanOrEqual(0)
            expect(q.correct).toBeLessThan(q.opts.length)
          }
        }
      }
    })
  }
  it('أسئلة القراءة في الاختبار تحمل نصّها معها', () => {
    const e = SEMESTERS[0].exams.find((x) => x.kind === 'final')!
    for (let t = 0; t < 5; t++) {
      for (const q of buildExam(e)) {
        const isReading = allLessons.some((l) => l.kind === 'reading' && l.blocks.some((b) => b.t === 'quiz' && b.q.q === q.q))
        if (isReading) expect(q.passage, q.q).toBeTruthy()
      }
    }
  })
  it('المراجعة تقتصر على أسئلة وحدتها', () => {
    const e = SEMESTERS[0].exams.find((x) => x.id === 'rev-u1')!
    const u1Questions = new Set(lessonsInScope(e).flatMap((l) => l.blocks.flatMap((b) => (b.t === 'quiz' ? [b.q.q] : []))))
    const u2 = SEMESTERS[0].units[1].lessons.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'quiz' ? [b.q.q] : [])))
    const qs = buildExam(e)
    for (const q of qs) expect(u2.includes(q.q) && !u1Questions.has(q.q)).toBe(false)
  })
})
