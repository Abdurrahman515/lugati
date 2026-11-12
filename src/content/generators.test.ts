import { describe, it, expect } from 'vitest'
import { GENS, genSet } from './generators'
import { hintOnly } from '../lib/feedback'
import { stripTashkeel } from '../lib/arabicText'
import { allLessons } from './registry'
import type { MC, WR } from '../lib/types'

const RUNS = 300
const norm = (s: string) => stripTashkeel(s).replace(/[«»()\s]/g, '')

describe('المولّدات المتجددة', () => {
  for (const id of Object.keys(GENS)) {
    describe(id, () => {
      it(`${RUNS} سؤالاً: بنية سليمة وخيار صحيح واحد وخيارات غير مكررة`, () => {
        for (let i = 0; i < RUNS; i++) {
          const q = GENS[id]()
          expect(q.q.trim()).not.toBe('')
          if (q.kind === 'mc') {
            expect(q.opts.length).toBeGreaterThanOrEqual(2)
            expect(q.correct).toBeGreaterThanOrEqual(0)
            expect(q.correct).toBeLessThan(q.opts.length)
            const texts = q.opts.map((o) => o.t.trim())
            expect(new Set(texts).size, `${q.q} => ${texts.join('|')}`).toBe(texts.length)
            for (const o of q.opts) {
              expect(o.t.trim()).not.toBe('')
              expect(o.why.trim(), q.q).not.toBe('')
            }
          } else {
            expect(q.answers.length).toBeGreaterThan(0)
            expect(q.why.trim()).not.toBe('')
          }
        }
      })

      it('لا توجد بقايا قوالب (undefined/NaN/[object]) ولا مسافات مزدوجة', () => {
        for (let i = 0; i < RUNS; i++) {
          const q = GENS[id]()
          const texts = [q.q, ...(q.kind === 'mc' ? q.opts.flatMap((o) => [o.t, o.why]) : [...q.answers, q.why, ...(q.wrong ?? []).map((w) => w.why)])]
          for (const t of texts) {
            expect(t).not.toMatch(/undefined|NaN|\[object|\$\{/)
            expect(t).not.toMatch(/ {2,}/)
          }
        }
      })

      it('الـ feedback بنبرة الشرح: بلا بادئة «صحيح:» ولا عبارات فصحى جافة', () => {
        for (let i = 0; i < RUNS; i++) {
          const q = GENS[id]()
          if (q.kind !== 'mc') continue
          for (const o of q.opts) {
            expect(o.why).not.toMatch(/^صحيح:/)
            expect(o.why).not.toMatch(/لم يرد|ليست هذه الإجابة|فكّري مرة أخرى/)
          }
        }
      })

      it('تفسير الخيار الخاطئ (بعد hintOnly) لا يحتوي نص الجواب الصحيح', () => {
        for (let i = 0; i < RUNS; i++) {
          const q = GENS[id]() as MC | WR
          if (q.kind !== 'mc') continue
          const right = norm(q.opts[q.correct].t)
          if (right.length < 4) continue
          q.opts.forEach((o, k) => {
            if (k === q.correct || norm(o.t).includes(right)) return
            const hint = norm(hintOnly(o.why).split(o.t).join(''))
            expect(hint, `${q.q} | الخيار «${o.t}» يكشف «${q.opts[q.correct].t}»: ${o.why}`).not.toContain(right)
          })
        }
      })

      it('genSet يرجع n سؤالاً مختلفاً', () => {
        const s = genSet(id, 5)
        expect(s).toHaveLength(5)
        expect(new Set(s.map((q) => q.q)).size).toBe(5)
      })
    })
  }

  it('genSet لمولّد غير موجود يرجع قائمة فارغة', () => {
    expect(genSet('غير-موجود', 5)).toEqual([])
  })

  it('كل مولّد مستعمل في درس أو في gens (لا مولّدات يتيمة)', () => {
    const used = new Set<string>()
    for (const l of allLessons) {
      ;(l.gens ?? []).forEach((g) => used.add(g))
      l.blocks.forEach((b) => b.t === 'practice' && used.add(b.gen))
    }
    for (const id of Object.keys(GENS)) expect(used.has(id), `مولّد غير مستعمل: ${id}`).toBe(true)
  })
})
