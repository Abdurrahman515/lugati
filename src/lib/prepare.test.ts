import { describe, it, expect } from 'vitest'
import { prepare } from './prepare'
import { mc, wr } from '../content/dsl'

describe('prepare', () => {
  const q = mc('سؤال؟', 'الصحيح', 'لأنه صح', [['أ', 'خطأ أ'], ['ب', 'خطأ ب'], ['ج', 'خطأ ج']])
  it('يحافظ على الخيار الصحيح بعد الخلط (في ٥٠ خلطة)', () => {
    for (let i = 0; i < 50; i++) {
      const p = prepare(q)
      if (p.kind !== 'mc') throw new Error('mc expected')
      expect(p.opts[p.correct].t).toBe('الصحيح')
      expect(p.opts.map((o) => o.t).sort()).toEqual(['أ', 'ب', 'ج', 'الصحيح'].sort())
    }
  })
  it('كل خيار يحتفظ بتفسيره', () => {
    const p = prepare(q)
    if (p.kind !== 'mc') throw new Error('mc expected')
    const map = Object.fromEntries(p.opts.map((o) => [o.t, o.why]))
    expect(map['أ']).toBe('خطأ أ')
    expect(map['الصحيح']).toBe('لأنه صح')
  })
  it('لا يغيّر السؤال الأصلي', () => {
    const before = JSON.stringify(q)
    prepare(q)
    expect(JSON.stringify(q)).toBe(before)
  })
  it('السؤال الكتابي يرجع كما هو', () => {
    const w = wr('اكتبي', ['كتاب'], 'لأن')
    expect(prepare(w)).toBe(w)
  })
  it('يغيّر الترتيب أحياناً (ليس ثابتاً)', () => {
    const orders = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const p = prepare(q)
      if (p.kind === 'mc') orders.add(p.opts.map((o) => o.t).join('|'))
    }
    expect(orders.size).toBeGreaterThan(1)
  })
})
