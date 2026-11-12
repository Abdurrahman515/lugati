import { describe, it, expect } from 'vitest'
import { allLessons } from './registry'
import { GENS } from './generators'
import { WIDGETS } from '../components/widgets/registry'
import { hintOnly } from '../lib/feedback'
import { stripTashkeel } from '../lib/arabicText'
import type { Q } from '../lib/types'

const norm = (s: string) => stripTashkeel(s).replace(/[«»()\s]/g, '')
const quizzes = allLessons.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'quiz' ? [{ l, q: b.q }] : [])))
const widgets = allLessons.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'widget' ? [{ l, id: b.id, props: b.props as any }] : [])))
const allWhys = (q: Q): string[] => (q.kind === 'mc' ? q.opts.map((o) => o.why) : [q.why, ...(q.wrong ?? []).map((w) => w.why)])

describe('بنية الدروس', () => {
  it('عدد الدروس ٧٩ (٣٩ للفصل الأول و٤٠ للثاني) وكل درس فيه كتل', () => {
    expect(allLessons).toHaveLength(79)
    for (const l of allLessons) expect(l.blocks.length, l.id).toBeGreaterThan(0)
  })
  it('كل درس يبدأ بشرح (say) ولا ينتهي بكتلة كشف يتيمة', () => {
    for (const l of allLessons) {
      expect(['say', 'passage'], l.id).toContain(l.blocks[0].t)
    }
  })
  it('كتل say غير فارغة', () => {
    for (const l of allLessons) for (const b of l.blocks) if (b.t === 'say') expect(b.text.trim(), l.id).not.toBe('')
  })
  it('دروس القراءة فيها نص مثبت وأسئلتها تحمل النص', () => {
    for (const l of allLessons.filter((x) => x.kind === 'reading')) {
      expect(l.blocks.some((b) => b.t === 'passage'), l.id).toBe(true)
      for (const b of l.blocks) if (b.t === 'quiz') expect(b.q.passage, `${l.id}: ${b.q.q}`).toBeTruthy()
    }
  })
  it('التدريب المتجدد يشير إلى مولّد موجود وعدد معقول', () => {
    for (const l of allLessons) for (const b of l.blocks) if (b.t === 'practice') {
      expect(GENS[b.gen], `${l.id}: ${b.gen}`).toBeTypeOf('function')
      expect(b.n).toBeGreaterThanOrEqual(1)
      expect(b.n).toBeLessThanOrEqual(10)
    }
    for (const l of allLessons) for (const g of l.gens ?? []) expect(GENS[g], `${l.id}: ${g}`).toBeTypeOf('function')
  })
})

describe('الأسئلة الثابتة', () => {
  it('معرّفات الأسئلة فريدة', () => {
    const ids = quizzes.map((x) => x.q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('اختيار من متعدد: خيار صحيح واحد، خيارات غير مكررة، لكل خيار تفسير', () => {
    for (const { l, q } of quizzes) {
      if (q.kind !== 'mc') continue
      const where = `${l.id}: ${q.q}`
      expect(q.opts.length, where).toBeGreaterThanOrEqual(2)
      expect(q.correct, where).toBeGreaterThanOrEqual(0)
      expect(q.correct, where).toBeLessThan(q.opts.length)
      const t = q.opts.map((o) => o.t.trim())
      expect(new Set(t).size, where).toBe(t.length)
      for (const o of q.opts) expect(o.why.trim(), `${where} / ${o.t}`).not.toBe('')
    }
  })
  it('كتابي: إجابات غير فارغة وتفسير، والخاطئ الشائع لا يطابق الصحيح', () => {
    for (const { l, q } of quizzes) {
      if (q.kind !== 'wr') continue
      expect(q.answers.length, l.id).toBeGreaterThan(0)
      expect(q.why.trim(), l.id).not.toBe('')
      for (const w of q.wrong ?? []) expect(q.answers.map(norm)).not.toContain(norm(w.a))
    }
  })
  it('لا صور مطلوبة في نص السؤال', () => {
    for (const { q } of quizzes) expect(q.q).not.toMatch(/في الصورة|الصورة الآتية|انظري إلى الصورة/)
  })
  it('تفسير الخطأ لا يكشف الجواب الصحيح (بعد hintOnly وحذف اسم الخيار نفسه)', () => {
    for (const { l, q } of quizzes) {
      if (q.kind !== 'mc') continue
      const right = norm(q.opts[q.correct].t)
      if (right.length < 5) continue
      q.opts.forEach((o, k) => {
        if (k === q.correct || norm(o.t).includes(right)) return
        const hint = norm(hintOnly(o.why).split(o.t).join(''))
        expect(hint, `${l.id} | ${q.q} | «${o.t}» يكشف «${q.opts[q.correct].t}»: ${o.why}`).not.toContain(right)
      })
    }
  })
})

describe('نبرة الـ feedback (فصحى مبسطة + لهجة سورية خفيفة)', () => {
  const banned = /لم يرد|لم يذكر النص|ليست هذه الإجابة|ليس تماماً|فكّري مرة أخرى|^صحيح:/
  it('لا عبارات فصحى جافة في تفسيرات الأسئلة', () => {
    for (const { l, q } of quizzes) for (const w of allWhys(q)) expect(w, `${l.id} | ${q.q}`).not.toMatch(banned)
  })
  it('لا عبارات فصحى جافة في تفسيرات الأنشطة', () => {
    for (const { l, props } of widgets) {
      const whys: string[] = [props.why, ...((props.items ?? []) as { why: string }[]).map((i) => i.why)].filter(Boolean)
      for (const w of whys) expect(w, l.id).not.toMatch(banned)
    }
  })
  it('أغلب التفسيرات المعاد صياغتها فيها لمسة سورية (نسبة معقولة)', () => {
    const marks = /بيـ|بتـ|هيك|هاد|هاي|مو |إنو|لأنو|هون|منيح|كتير|دايماً|بس |إلو|إله|شي/
    const all = quizzes.flatMap(({ q }) => allWhys(q))
    const withMark = all.filter((w) => marks.test(w.replace(/ـ/g, ''))).length
    expect(withMark / all.length).toBeGreaterThan(0.4)
  })
})

describe('الأنشطة (widgets)', () => {
  it('كل نشاط مستعمل مسجّل', () => {
    for (const { l, id } of widgets) expect(WIDGETS[id], `${l.id}: ${id}`).toBeTruthy()
  })
  it('التظليل: كلمات، وفهارس الجواب صحيحة وغير مكررة، وله تفسير', () => {
    for (const { l, id, props } of widgets.filter((w) => w.id === 'highlighter')) {
      expect(props.words.length, l.id).toBeGreaterThan(1)
      expect(props.answer.length, l.id).toBeGreaterThan(0)
      expect(new Set(props.answer).size).toBe(props.answer.length)
      for (const a of props.answer) { expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThan(props.words.length) }
      expect(props.why.trim(), id).not.toBe('')
      expect(props.prompt.trim()).not.toBe('')
    }
  })
  it('الترتيب: أكثر من كلمة، والبدائل نفس الكلمات بترتيب مختلف', () => {
    for (const { l, props } of widgets.filter((w) => w.id === 'orderer')) {
      expect(props.words.length, l.id).toBeGreaterThan(1)
      for (const alt of props.alts ?? []) expect([...alt].sort()).toEqual([...props.words].sort())
      expect(props.why.trim()).not.toBe('')
    }
  })
  it('التصنيف: خانتان على الأقل، كل كلمة لها خانة صحيحة وتفسير، وكل خانة مستعملة', () => {
    for (const { l, props } of widgets.filter((w) => w.id === 'sorter')) {
      expect(props.cats.length, l.id).toBeGreaterThanOrEqual(2)
      const used = new Set<number>()
      for (const it of props.items) {
        expect(it.c).toBeGreaterThanOrEqual(0)
        expect(it.c).toBeLessThan(props.cats.length)
        expect(it.why.trim(), `${l.id}: ${it.t}`).not.toBe('')
        used.add(it.c)
      }
      expect(used.size, `${l.id}: خانة بلا كلمات`).toBe(props.cats.length)
      const texts = props.items.map((i: { t: string }) => i.t)
      expect(new Set(texts).size, l.id).toBe(texts.length)
    }
  })
})
