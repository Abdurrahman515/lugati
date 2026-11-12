import { describe, it, expect } from 'vitest'
import { PRAISE, RETRY, cleanWhy, hintOnly, randomPraise, randomRetry, starsFor, starsText } from './feedback'

describe('عبارات التشجيع', () => {
  it('تضم العبارات التي طلبها صاحب المشروع', () => {
    const all = PRAISE.join(' ')
    for (const w of ['هيك بدها', 'أحسنتِ', 'كفو عليكِ', 'أسطورة', 'يسلمو إيديكِ']) expect(all).toContain(w)
  })
  it('randomPraise وrandomRetry من القوائم', () => {
    for (let i = 0; i < 30; i++) {
      expect(PRAISE).toContain(randomPraise())
      expect(RETRY).toContain(randomRetry())
    }
  })
  it('عبارات الدعم لا تكشف جواباً ولا تستعمل فصحى جافة', () => {
    for (const r of RETRY) {
      expect(r).not.toMatch(/ليست هذه الإجابة|الجواب الصحيح/)
      expect(r).toMatch(/مرة|تاني|جرّبي|حاولي/)
    }
  })
})

describe('starsText', () => {
  it('ثلاث خانات دائماً', () => {
    expect(starsText(0)).toBe('☆☆☆')
    expect(starsText(1)).toBe('⭐☆☆')
    expect(starsText(2)).toBe('⭐⭐☆')
    expect(starsText(3)).toBe('⭐⭐⭐')
  })
  it('لا يتجاوز ثلاثاً في الخانات الفارغة', () => {
    expect(starsText(5)).toBe('⭐⭐⭐⭐⭐')
  })
})

describe('starsFor', () => {
  it('عتبات ٩٠٪ و٧٠٪', () => {
    expect(starsFor(10, 10)).toBe(3)
    expect(starsFor(9, 10)).toBe(3)
    expect(starsFor(8, 10)).toBe(2)
    expect(starsFor(7, 10)).toBe(2)
    expect(starsFor(6, 10)).toBe(1)
    expect(starsFor(0, 10)).toBe(1)
  })
  it('بلا أسئلة: ثلاث نجوم', () => {
    expect(starsFor(0, 0)).toBe(3)
  })
})

describe('cleanWhy', () => {
  it('يحذف بادئة «صحيح:» فقط', () => {
    expect(cleanWhy('صحيح: «س» كذا')).toBe('«س» كذا')
    expect(cleanWhy('هذا صحيح: كذا')).toBe('هذا صحيح: كذا')
  })
})

describe('hintOnly', () => {
  it('يقتطع ما بعد «أما» لأنه يكشف الجواب', () => {
    expect(hintOnly('«نكرة»: ما دل على غير معين. أما «كتاب» فهي علم.')).toBe('«نكرة»: ما دل على غير معين.')
  })
  it('يزيل علامات الوقف الزائدة في آخر الاقتطاع', () => {
    expect(hintOnly('همزة القطع بتجي بأول الكلام ووسطه، أما «س» فوصل')).toBe('همزة القطع بتجي بأول الكلام ووسطه')
    expect(hintOnly('كذا؛ أما كذا')).toBe('كذا')
  })
  it('يترك النص كما هو إن لم يحتوِ «أما»', () => {
    expect(hintOnly('الجر بيجي بعد حرف جر')).toBe('الجر بيجي بعد حرف جر')
  })
  it('يرجع نصاً فارغاً إن لم يبقَ شيء مفيد', () => {
    expect(hintOnly('أما هذا فصحيح')).toBe('')
    expect(hintOnly('')).toBe('')
  })
  it('لا يقتطع كلمة تحتوي «أما» داخلها', () => {
    expect(hintOnly('الأمام قدّام')).toBe('الأمام قدّام')
  })
})
