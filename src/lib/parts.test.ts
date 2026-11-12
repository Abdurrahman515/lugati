import { describe, it, expect } from 'vitest'
import { buildParts, isGate } from './parts'
import { say, reveal, widget, quiz, mc, practice, passageB } from '../content/dsl'
import { allLessons } from '../content/registry'

const q = () => quiz(mc('س؟', 'ص', 'ل', [['خ', 'غ']]))

describe('buildParts', () => {
  it('كل شرح جزء مستقل بلا قفل', () => {
    const p = buildParts([say('أ'), say('ب')])
    expect(p).toHaveLength(2)
    expect(p.every((x) => !x.gated)).toBe(true)
  })
  it('النشاط يلتصق بالشرح الذي قبله ويقفل الجزء', () => {
    const p = buildParts([say('أ'), widget('sorter', {})])
    expect(p).toHaveLength(1)
    expect(p[0].gated).toBe(true)
    expect(p[0].items.map((i) => i.b.t)).toEqual(['say', 'widget'])
  })
  it('السؤال يلتصق بالشرح الذي يسبقه مباشرة', () => {
    const p = buildParts([say('أ'), q()])
    expect(p).toHaveLength(1)
    expect(p[0].gated).toBe(true)
  })
  it('سؤالان متتاليان جزآن منفصلان', () => {
    const p = buildParts([say('أ'), q(), q()])
    expect(p).toHaveLength(2)
    expect(p.every((x) => x.gated)).toBe(true)
  })
  it('سؤال بعد نص قرائي يكون جزءاً وحده', () => {
    const p = buildParts([passageB('نص'), q()])
    expect(p).toHaveLength(2)
    expect(p[0].gated).toBe(false)
    expect(p[1].gated).toBe(true)
  })
  it('بطاقات الكشف تلتصق بما قبلها', () => {
    const p = buildParts([passageB('نص'), reveal('معنى', 'م'), reveal('معنى٢', 'م'), q()])
    expect(p).toHaveLength(2)
    expect(p[0].items).toHaveLength(3)
  })
  it('بطاقة كشف في أول الدرس تفتح جزءاً', () => {
    const p = buildParts([reveal('معنى', 'م')])
    expect(p).toHaveLength(1)
  })
  it('التدريب المتجدد يلتصق بالشرح قبله ويقفل', () => {
    const p = buildParts([say('أ'), practice('mubtada', 5)])
    expect(p).toHaveLength(1)
    expect(p[0].gated).toBe(true)
  })
  it('يحفظ فهارس الكتل الأصلية', () => {
    const p = buildParts([say('أ'), widget('x', {}), say('ب'), q()])
    expect(p.flatMap((x) => x.items.map((i) => i.i))).toEqual([0, 1, 2, 3])
  })
  it('قائمة فارغة بلا أجزاء', () => {
    expect(buildParts([])).toEqual([])
  })
})

describe('isGate', () => {
  it('السؤال والنشاط والتدريب بوابات، والشرح والنص والكشف لا', () => {
    expect(isGate(q())).toBe(true)
    expect(isGate(widget('x', {}))).toBe(true)
    expect(isGate(practice('g', 3))).toBe(true)
    expect(isGate(say('أ'))).toBe(false)
    expect(isGate(passageB('ن'))).toBe(false)
    expect(isGate(reveal('ع', 'م'))).toBe(false)
  })
})

describe('buildParts على دروس المشروع الفعلية', () => {
  for (const l of allLessons) {
    it(`${l.id}: كل كتلة تظهر مرة واحدة بالترتيب، وفي كل جزء بوابة واحدة على الأكثر`, () => {
      const parts = buildParts(l.blocks)
      expect(parts.flatMap((p) => p.items.map((i) => i.i))).toEqual(l.blocks.map((_, i) => i))
      for (const p of parts) {
        expect(p.items.filter((i) => isGate(i.b)).length).toBeLessThanOrEqual(1)
        expect(p.gated).toBe(p.items.some((i) => isGate(i.b)))
      }
    })
  }
})
