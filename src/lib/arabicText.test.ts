import { describe, it, expect } from 'vitest'
import { hash, normalizeArabic, pick, sameAnswer, sample, shuffle, stripTashkeel, toArabicDigits } from './arabicText'

describe('stripTashkeel', () => {
  it('يزيل الحركات والتطويل', () => {
    expect(stripTashkeel('الصِّدْقُ مَنْجَاةٌ')).toBe('الصدق منجاة')
    expect(stripTashkeel('كـــتاب')).toBe('كتاب')
  })
  it('لا يغيّر النص غير المشكول', () => {
    expect(stripTashkeel('كتاب')).toBe('كتاب')
  })
})

describe('normalizeArabic', () => {
  it('يوحّد المسافات ويقصّ الأطراف', () => {
    expect(normalizeArabic('  العلمُ   نورٌ  ')).toBe('العلم نور')
  })
  it('يوحّد الهمزات والياء والتاء المربوطة افتراضياً', () => {
    expect(normalizeArabic('أإآ')).toBe('ااا')
    expect(normalizeArabic('على')).toBe(normalizeArabic('علي'))
    expect(normalizeArabic('مدرسة')).toBe(normalizeArabic('مدرسه'))
  })
  it('لا يوحّد الهمزات عند hamza:false (المهارة إملائية)', () => {
    expect(normalizeArabic('أكرم', { hamza: false })).toBe('أكرم')
    expect(normalizeArabic('مدرسة', { hamza: false })).toBe('مدرسة')
  })
})

describe('sameAnswer', () => {
  it('يتجاهل التشكيل', () => {
    expect(sameAnswer('اكتُبْ', ['اكتب'])).toBe(true)
  })
  it('يقبل أي إجابة من القائمة', () => {
    expect(sameAnswer('ب', ['أ', 'ب'])).toBe(true)
    expect(sameAnswer('ج', ['أ', 'ب'])).toBe(false)
  })
  it('في الوضع الدقيق يفرّق بين الهمزة والألف وبين التاء والهاء', () => {
    expect(sameAnswer('اكرم', ['أكرم'])).toBe(true)
    expect(sameAnswer('اكرم', ['أكرم'], true)).toBe(false)
    expect(sameAnswer('مدرسه', ['مدرسة'], true)).toBe(false)
    expect(sameAnswer('مدرسة', ['مدرسة'], true)).toBe(true)
  })
  it('لا يعتبر الإجابة الفارغة صحيحة', () => {
    expect(sameAnswer('', ['كتاب'])).toBe(false)
  })
})

describe('toArabicDigits', () => {
  it('يحوّل الأرقام العادية إلى شرقية', () => {
    expect(toArabicDigits(1234567890)).toBe('١٢٣٤٥٦٧٨٩٠')
    expect(toArabicDigits('16')).toBe('١٦')
  })
  it('يترك النص العربي كما هو', () => {
    expect(toArabicDigits('سؤال 3 من 5')).toBe('سؤال ٣ من ٥')
  })
})

describe('shuffle / pick / sample', () => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8]
  it('shuffle يحافظ على العناصر ولا يغيّر الأصل', () => {
    const copy = a.slice()
    const r = shuffle(a)
    expect(a).toEqual(copy)
    expect([...r].sort()).toEqual(copy)
  })
  it('pick يرجع عنصراً من المصفوفة', () => {
    for (let i = 0; i < 50; i++) expect(a).toContain(pick(a))
  })
  it('sample يرجع n عنصراً مختلفاً', () => {
    const s = sample(a, 3)
    expect(s).toHaveLength(3)
    expect(new Set(s).size).toBe(3)
    expect(sample(a, 100)).toHaveLength(a.length)
  })
})

describe('hash', () => {
  it('ثابت لنفس النص ومختلف لنصين مختلفين', () => {
    expect(hash('سؤال')).toBe(hash('سؤال'))
    expect(hash('سؤال')).not.toBe(hash('سؤال٢'))
    expect(hash('x').startsWith('q')).toBe(true)
  })
})
