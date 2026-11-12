import { describe, it, expect } from 'vitest'
import { correctText, evaluate } from './evaluate'
import { mc, wr } from '../content/dsl'

const m = mc('س؟', 'ص', 'لأنه صح', [['خ١', 'غلط١'], ['خ٢', 'غلط٢']])
const w = wr('اكتبي أمر كتب', ['اكتبْ'], 'أمر الثلاثي', [{ a: 'كتب', why: 'هاد فعل ماضٍ' }])
const strict = wr('الإملاء', ['أكرم'], 'همزة قطع', [], true)

describe('evaluate (اختيار من متعدد)', () => {
  it('الصحيح', () => {
    const a = evaluate(m, 'ص')
    expect(a.ok).toBe(true)
    expect(a.correct).toBe('ص')
    expect(a.why).toBe('لأنه صح')
  })
  it('الخاطئ يحمل تفسير الخيار المختار', () => {
    const a = evaluate(m, 'خ٢')
    expect(a.ok).toBe(false)
    expect(a.why).toBe('غلط٢')
    expect(a.correct).toBe('ص')
  })
  it('اختيار غير موجود يعتبر خطأً بتفسير فارغ', () => {
    const a = evaluate(m, 'لا وجود')
    expect(a.ok).toBe(false)
    expect(a.why).toBe('')
  })
})

describe('evaluate (كتابي)', () => {
  it('يتجاهل التشكيل في الصحيح', () => {
    expect(evaluate(w, 'اكتب').ok).toBe(true)
  })
  it('الخاطئ الشائع له تفسيره', () => {
    const a = evaluate(w, 'كتبَ')
    expect(a.ok).toBe(false)
    expect(a.why).toBe('هاد فعل ماضٍ')
  })
  it('خاطئ غير معروف يأخذ تفسير السؤال العام', () => {
    expect(evaluate(w, 'شي تاني').why).toBe('أمر الثلاثي')
  })
  it('الوضع الدقيق يفرّق الهمزات', () => {
    expect(evaluate(strict, 'أكرم').ok).toBe(true)
    expect(evaluate(strict, 'اكرم').ok).toBe(false)
  })
})

describe('correctText', () => {
  it('يرجع نص الصحيح في النوعين', () => {
    expect(correctText(m)).toBe('ص')
    expect(correctText(w)).toBe('اكتبْ')
  })
})
