import { describe, it, expect } from 'vitest'
import { MID_UNITS, MID_UNITS_S2, SEMESTERS, allLessons, findExam, findLesson, neighbors } from './registry'

const [s1, s2] = SEMESTERS
const allExams = SEMESTERS.flatMap((s) => s.exams)

describe('السجل المركزي', () => {
  it('فصلان دراسيان: الأول ٣ وحدات × ١٣ درساً، والثاني ٣ وحدات (١٤ و١٣ و١٣ درساً)', () => {
    expect(SEMESTERS).toHaveLength(2)
    expect(s1.units).toHaveLength(3)
    for (const u of s1.units) expect(u.lessons).toHaveLength(13)
    expect(s2.units.map((u) => u.id)).toEqual(['u4', 'u5', 'u6'])
    expect(s2.units.map((u) => u.lessons.length)).toEqual([14, 13, 13])
    expect(allLessons).toHaveLength(79)
  })
  it('معرّفات الدروس فريدة ولا درس مكرر بين الوحدات', () => {
    const ids = allLessons.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('معرّفات الوحدات والاختبارات فريدة عبر الفصلين', () => {
    const ids = [...SEMESTERS.flatMap((s) => s.units.map((u) => u.id)), ...allExams.map((e) => e.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('كل درس يحمل عنواناً ورمزاً ونوعاً صالحاً', () => {
    for (const l of allLessons) {
      expect(l.title.trim()).not.toBe('')
      expect(l.emoji.trim()).not.toBe('')
      expect(['reading', 'language', 'skill']).toContain(l.kind)
    }
  })
})

describe('findLesson / findExam', () => {
  it('يجد الموجود ويرجع undefined لغيره', () => {
    expect(findLesson(allLessons[0].id)).toBe(allLessons[0])
    expect(findLesson('لا-يوجد')).toBeUndefined()
    expect(findExam('mid-s1')?.kind).toBe('mid')
    expect(findExam('mid-s2')?.kind).toBe('mid')
    expect(findExam('final-s2')?.kind).toBe('final')
    expect(findExam('x')).toBeUndefined()
  })
})

describe('neighbors', () => {
  it('أول درس بلا سابق وآخر درس بلا لاحق، والتنقل يعبر الفصلين', () => {
    expect(neighbors(allLessons[0].id).prev).toBeUndefined()
    expect(neighbors(allLessons[0].id).next).toBe(allLessons[1])
    const last = allLessons[allLessons.length - 1]
    expect(neighbors(last.id).next).toBeUndefined()
    expect(neighbors(last.id).prev).toBe(allLessons[allLessons.length - 2])
    const lastS1 = s1.units[2].lessons[12]
    expect(neighbors(lastS1.id).next).toBe(s2.units[0].lessons[0])
  })
})

describe('إعدادات الاختبارات (القيم المعتمدة في تعليمات المشروع)', () => {
  for (const [name, s, mid] of [['الفصل الأول', s1, MID_UNITS], ['الفصل الثاني', s2, MID_UNITS_S2]] as const) {
    describe(name, () => {
      const exams = s.exams
      it('مراجعة كل وحدة: ١٦ سؤالاً، نجاح ٧٠٪، بلا قفل ولا صرامة', () => {
        for (const u of s.units) {
          const e = exams.find((x) => x.kind === 'review' && x.unitIds[0] === u.id)!
          expect(e).toBeTruthy()
          expect(e).toMatchObject({ n: 16, pass: 70, strict: false })
          expect(e.lockHours).toBeUndefined()
          expect(e.unitIds).toEqual([u.id])
        }
      })
      it('المنتصف: ٣٠ سؤالاً، ٦٠٪، جاد، قفل ٢٤ ساعة، نطاقه المحدد وتظهر بعد آخر وحدة فيه', () => {
        const e = exams.find((x) => x.kind === 'mid')!
        expect(e).toMatchObject({ n: 30, pass: 60, strict: true, lockHours: 24 })
        expect(e.unitIds).toEqual(mid)
        expect(e.afterUnit).toBe(mid[mid.length - 1])
      })
      it('النهاية: ٦٠ سؤالاً، ٦٠٪، جاد، قفل ٢٤ ساعة، كل وحدات الفصل', () => {
        const e = exams.find((x) => x.kind === 'final')!
        expect(e).toMatchObject({ n: 60, pass: 60, strict: true, lockHours: 24 })
        expect(e.unitIds).toEqual(s.units.map((u) => u.id))
      })
      it('كل وحدة مذكورة في الاختبارات موجودة داخل الفصل نفسه', () => {
        const units = new Set(s.units.map((u) => u.id))
        for (const e of exams) for (const id of e.unitIds) expect(units.has(id)).toBe(true)
        for (const id of mid) expect(units.has(id)).toBe(true)
      })
    })
  }
  it('اختبارا المنتصف والنهاية في كل فصل عنوانهما مميز (تعتمد عليه الشهادة)', () => {
    const t = allExams.filter((e) => e.kind !== 'review').map((e) => e.title)
    expect(new Set(t).size).toBe(t.length)
  })
})
