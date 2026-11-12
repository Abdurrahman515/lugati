import { describe, expect, it } from 'vitest'
import { HW, hamzaLetter, genHamza } from './unit5'
import { SGN, signQuestion } from './unit4'
import { GENS } from './index'

describe('الهمزة المتوسطة: الحرف يناسب أقوى الحركتين', () => {
  it('أمثلة الكتاب', () => {
    expect(hamzaLetter('السكون', 'الفتحة')).toBe('ألف') // تأخير
    expect(hamzaLetter('الفتحة', 'السكون')).toBe('ألف') // نشأة
    expect(hamzaLetter('الفتحة', 'الفتحة')).toBe('ألف') // تأمل
    expect(hamzaLetter('الضمة', 'الضمة')).toBe('واو') // شؤون
    expect(hamzaLetter('الفتحة', 'الضمة')).toBe('واو') // سؤال
    expect(hamzaLetter('السكون', 'الضمة')).toBe('واو') // رؤية
    expect(hamzaLetter('الضمة', 'السكون')).toBe('واو') // تفاؤل
    expect(hamzaLetter('الضمة', 'الفتحة')).toBe('واو') // يملؤها
    expect(hamzaLetter('الفتحة', 'الكسرة')).toBe('ياء') // فئة
    expect(hamzaLetter('الكسرة', 'الضمة')).toBe('ياء') // سئل
  })
  it('الجواب الصحيح في السؤال المولَّد يطابق الحساب لكل كلمة في البنك', () => {
    for (let i = 0; i < 300; i++) {
      const q = genHamza()
      if (q.kind !== 'mc') throw new Error()
      const w = /«([^»]+)»/.exec(q.q)![1]
      const [, h, p] = HW.find((x) => x[0] === w)!
      expect(q.opts[q.correct].t).toBe(hamzaLetter(h, p))
    }
  })
})

describe('علامات الجر', () => {
  it('السؤال يحدد العلامة الصحيحة ولا يكررها بين الخيارات', () => {
    const q = signQuestion(['مررتُ بالمعلمينَ', 'المعلمينَ', 'جمع مذكر سالم', 'الياء'], 'الاسم')
    if (q.kind !== 'mc') throw new Error()
    expect(q.opts[q.correct].t).toBe('الياء')
    expect(new Set(q.opts.map((o) => o.t)).size).toBe(Object.keys(SGN).length)
  })
})

describe('تسجيل مولّدات الفصل الثاني', () => {
  it('كل المولّدات الأربعة عشر مسجّلة', () => {
    for (const g of ['mabni', 'damir', 'jarr', 'nahy', 'lamsh', 'prefal', 'ishara', 'idafa', 'jumla', 'hamza', 'tarqim', 'mawsul', 'mudari', 'ikhtisar']) expect(GENS[g], g).toBeTypeOf('function')
  })
})
