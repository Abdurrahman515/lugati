// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QuizCard } from './QuizCard'
import type { MC, WR } from '../lib/types'
import { getProgress, importJSON, logMistake } from '../lib/storage'
import { PRAISE, RETRY } from '../lib/feedback'

const mc: MC = {
  kind: 'mc', id: 't-mc', q: 'ما نوع كلمة «كتاب»؟',
  opts: [
    { t: 'اسم', why: 'صحيح: لأنها تدل على شيء نراه.' },
    { t: 'فعل', why: 'ليست فعلاً. أما «كتاب» فاسم لأنه يدل على شيء.' },
    { t: 'حرف', why: 'الحرف لا معنى له وحده.' },
  ],
  correct: 0,
}
const wr: WR = {
  kind: 'wr', id: 't-wr', q: 'اكتبي جمع «قلم»', answers: ['أقلام'],
  wrong: [{ a: 'قلمات', why: 'جمع التكسير لا يُجمع بالألف والتاء هنا.' }],
  why: 'جمع تكسير: تغيّر فيه شكل المفرد.',
}

const btn = (n: string | RegExp) => screen.getByRole('button', { name: n }) as HTMLButtonElement
const fbOk = (c: HTMLElement) => c.querySelector('.fb.ok')
const fbBad = (c: HTMLElement) => c.querySelector('.fb.bad')

beforeEach(() => {
  localStorage.clear()
  importJSON(JSON.stringify({ v: 1, stars: {}, mistakes: {}, exams: {} }))
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('QuizCard — اختيار من متعدد مع retry (وضع الدرس)', () => {
  it('يعرض السؤال وكل الخيارات', () => {
    render(<QuizCard q={mc} lessonId="L" retry />)
    expect(screen.getByText('ما نوع كلمة «كتاب»؟')).toBeTruthy()
    for (const t of ['اسم', 'فعل', 'حرف']) expect(btn(t)).toBeTruthy()
  })

  it('الصحيح من أول مرة: عبارة تشجيع، وonDone(true) مرة واحدة، ولا خطأ مسجّل', () => {
    const onDone = vi.fn()
    const { container } = render(<QuizCard q={mc} lessonId="L" retry onDone={onDone} />)
    fireEvent.click(btn('اسم'))
    expect(PRAISE.some((p) => fbOk(container)!.textContent!.includes(p))).toBe(true)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(true, 'اسم', 'اسم')
    expect(Object.keys(getProgress().mistakes)).toHaveLength(0)
  })

  it('بادئة «صحيح:» لا تظهر في التفسير', () => {
    const { container } = render(<QuizCard q={mc} lessonId="L" retry />)
    fireEvent.click(btn('اسم'))
    expect(fbOk(container)!.textContent).not.toContain('صحيح:')
    expect(fbOk(container)!.textContent).toContain('لأنها تدل على شيء نراه')
  })

  it('الخطأ: لا يكشف الجواب، ويعطّل الخيار الخاطئ فقط، ولا يستدعي onDone', () => {
    const onDone = vi.fn()
    const { container } = render(<QuizCard q={mc} lessonId="L" retry onDone={onDone} />)
    fireEvent.click(btn('حرف'))
    expect(btn('حرف').disabled).toBe(true)
    expect(btn('حرف').className).toContain('wrong')
    expect(btn('اسم').disabled).toBe(false)
    expect(btn('اسم').className).not.toContain('right')
    expect(container.querySelector('.correct')).toBeNull()
    expect(container.textContent).not.toContain('الجواب الصحيح')
    expect(onDone).not.toHaveBeenCalled()
    expect(RETRY.some((r) => fbBad(container)!.textContent!.includes(r))).toBe(true)
  })

  it('الخطأ: يعرض تفسير الخيار الخاطئ نفسه', () => {
    const { container } = render(<QuizCard q={mc} lessonId="L" retry />)
    fireEvent.click(btn('حرف'))
    expect(fbBad(container)!.textContent).toContain('الحرف لا معنى له وحده')
  })

  it('الخطأ: ما بعد «أما» لا يظهر لأنه يكشف الجواب', () => {
    const { container } = render(<QuizCard q={mc} lessonId="L" retry />)
    fireEvent.click(btn('فعل'))
    const t = fbBad(container)!.textContent!
    expect(t).toContain('ليست فعلاً')
    expect(t).not.toContain('فاسم')
  })

  it('خطأ ثم صحيح: onDone(false) مرة واحدة، ومعه أول اختيار', () => {
    const onDone = vi.fn()
    const { container } = render(<QuizCard q={mc} lessonId="L" retry onDone={onDone} />)
    fireEvent.click(btn('حرف'))
    fireEvent.click(btn('فعل'))
    fireEvent.click(btn('اسم'))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(false, 'اسم', 'حرف')
    expect(fbOk(container)).not.toBeNull()
    expect(btn('اسم').className).toContain('right')
  })

  it('بعد الحل تُعطَّل كل الخيارات ولا يُستدعى onDone ثانية', () => {
    const onDone = vi.fn()
    render(<QuizCard q={mc} lessonId="L" retry onDone={onDone} />)
    fireEvent.click(btn('اسم'))
    for (const t of ['اسم', 'فعل', 'حرف']) expect(btn(t).disabled).toBe(true)
    fireEvent.click(btn('فعل'))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('يسجّل المحاولة الأولى الخاطئة فقط في سجل الأخطاء (مرة واحدة)', () => {
    render(<QuizCard q={mc} lessonId="L1" retry />)
    fireEvent.click(btn('حرف'))
    fireEvent.click(btn('فعل'))
    fireEvent.click(btn('اسم'))
    const m = getProgress().mistakes['t-mc']
    expect(m.count).toBe(1)
    expect(m.chosen).toBe('حرف')
    expect(m.correct).toBe('اسم')
    expect(m.lesson).toBe('L1')
  })

  it('الصحيح من أول مرة يمسح خطأً قديماً لنفس السؤال', () => {
    logMistake('t-mc', { lesson: 'L', q: 'س', chosen: 'حرف', correct: 'اسم', why: 'x' })
    expect(getProgress().mistakes['t-mc']).toBeDefined()
    render(<QuizCard q={mc} lessonId="L" retry />)
    fireEvent.click(btn('اسم'))
    expect(getProgress().mistakes['t-mc']).toBeUndefined()
  })

  it('skipLog: لا يسجّل ولا يمسح شيئاً', () => {
    render(<QuizCard q={mc} lessonId="L" retry skipLog />)
    fireEvent.click(btn('حرف'))
    expect(getProgress().mistakes['t-mc']).toBeUndefined()
  })

  it('لا يعتمد على موضع الجواب (الخيارات تُخلط): الجواب يُعرَف بنصّه', () => {
    for (let k = 0; k < 8; k++) {
      const onDone = vi.fn()
      const { unmount } = render(<QuizCard q={mc} lessonId="L" retry onDone={onDone} />)
      fireEvent.click(btn('اسم'))
      expect(onDone).toHaveBeenCalledWith(true, 'اسم', 'اسم')
      unmount()
    }
  })
})

describe('QuizCard — بلا retry (اختبار مراجعة بمحاولة واحدة)', () => {
  it('الخطأ يكشف الجواب الصحيح وتفسيره وينهي السؤال', () => {
    const onDone = vi.fn()
    const { container } = render(<QuizCard q={mc} lessonId="L" onDone={onDone} />)
    fireEvent.click(btn('حرف'))
    expect(onDone).toHaveBeenCalledWith(false, 'حرف', 'حرف')
    const c = container.querySelector('.correct')!
    expect(c.textContent).toContain('الجواب الصحيح')
    expect(c.textContent).toContain('اسم')
    expect(c.textContent).toContain('لأنها تدل على شيء نراه')
    expect(c.textContent).not.toMatch(/اسم\s*صحيح:/)
    for (const t of ['اسم', 'فعل', 'حرف']) expect(btn(t).disabled).toBe(true)
  })

  it('الصحيح: onDone(true)', () => {
    const onDone = vi.fn()
    render(<QuizCard q={mc} lessonId="L" onDone={onDone} />)
    fireEvent.click(btn('اسم'))
    expect(onDone).toHaveBeenCalledWith(true, 'اسم', 'اسم')
  })

  it('تفسير الخطأ هنا كامل (غير مقتطع) لأن الجواب مكشوف أصلاً', () => {
    const { container } = render(<QuizCard q={mc} lessonId="L" />)
    fireEvent.click(btn('فعل'))
    expect(fbBad(container)!.textContent).toContain('فاسم')
  })
})

describe('QuizCard — سؤال كتابي', () => {
  const input = () => screen.getByPlaceholderText('اكتبي إجابتك هنا') as HTMLInputElement

  it('زر التحقق لا يفعل شيئاً والحقل فارغ', () => {
    const onDone = vi.fn()
    const { container } = render(<QuizCard q={wr} lessonId="L" retry onDone={onDone} />)
    fireEvent.click(btn('تحقّقي'))
    expect(onDone).not.toHaveBeenCalled()
    expect(container.querySelector('.fb')).toBeNull()
  })

  it('جواب صحيح من أول مرة', () => {
    const onDone = vi.fn()
    const { container } = render(<QuizCard q={wr} lessonId="L" retry onDone={onDone} />)
    fireEvent.change(input(), { target: { value: 'أقلام' } })
    fireEvent.click(btn('تحقّقي'))
    expect(onDone).toHaveBeenCalledWith(true, 'أقلام', 'أقلام')
    expect(fbOk(container)).not.toBeNull()
    expect(input().disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'تحقّقي' })).toBeNull()
  })

  it('يقبل الإجابة بتشكيل وبمسافات زائدة', () => {
    const onDone = vi.fn()
    render(<QuizCard q={wr} lessonId="L" retry onDone={onDone} />)
    fireEvent.change(input(), { target: { value: '  أَقْلامٌ ' } })
    fireEvent.click(btn('تحقّقي'))
    expect(onDone).toHaveBeenCalledWith(true, '  أَقْلامٌ ', '  أَقْلامٌ ')
  })

  it('Enter يتحقق من الإجابة', () => {
    const onDone = vi.fn()
    render(<QuizCard q={wr} lessonId="L" retry onDone={onDone} />)
    fireEvent.change(input(), { target: { value: 'أقلام' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('خطأ شائع: يعرض تلميح تفسيره دون كشف الجواب، ويبقى الحقل مفتوحاً', () => {
    const onDone = vi.fn()
    const { container } = render(<QuizCard q={wr} lessonId="L" retry onDone={onDone} />)
    fireEvent.change(input(), { target: { value: 'قلمات' } })
    fireEvent.click(btn('تحقّقي'))
    expect(fbBad(container)!.textContent).toContain('جمع التكسير لا يُجمع')
    expect(container.textContent).not.toContain('الجواب الصحيح')
    expect(container.textContent).not.toContain('أقلام')
    expect(input().disabled).toBe(false)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('خطأ غير معروف: رسالة دعم بلا تفسير ولا كشف', () => {
    const { container } = render(<QuizCard q={wr} lessonId="L" retry />)
    fireEvent.change(input(), { target: { value: 'شيء آخر' } })
    fireEvent.click(btn('تحقّقي'))
    const t = fbBad(container)!.textContent!
    expect(RETRY.some((r) => t.includes(r))).toBe(true)
    expect(t).not.toContain('أقلام')
  })

  it('خطأ ثم صحيح: onDone(false) وأول إجابة مسجّلة', () => {
    const onDone = vi.fn()
    render(<QuizCard q={wr} lessonId="L" retry onDone={onDone} />)
    fireEvent.change(input(), { target: { value: 'قلمات' } })
    fireEvent.click(btn('تحقّقي'))
    fireEvent.change(input(), { target: { value: 'أقلام' } })
    fireEvent.click(btn('تحقّقي'))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(false, 'أقلام', 'قلمات')
    expect(getProgress().mistakes['t-wr'].chosen).toBe('قلمات')
    expect(getProgress().mistakes['t-wr'].correct).toBe('أقلام')
  })

  it('بلا retry: الخطأ يكشف الجواب وينهي السؤال', () => {
    const onDone = vi.fn()
    const { container } = render(<QuizCard q={wr} lessonId="L" onDone={onDone} />)
    fireEvent.change(input(), { target: { value: 'قلمات' } })
    fireEvent.click(btn('تحقّقي'))
    expect(container.querySelector('.correct')!.textContent).toContain('أقلام')
    expect(onDone).toHaveBeenCalledWith(false, 'قلمات', 'قلمات')
    expect(input().disabled).toBe(true)
  })

  it('exact: الهمزة تُقارَن بدقة عندما تكون هي المهارة', () => {
    const q: WR = { kind: 'wr', id: 't-ex', q: 'اكتبي الكلمة بهمزتها', answers: ['أمل'], exact: true, why: 'همزة قطع.' }
    const onDone = vi.fn()
    render(<QuizCard q={q} lessonId="L" retry onDone={onDone} />)
    fireEvent.change(input(), { target: { value: 'امل' } })
    fireEvent.click(btn('تحقّقي'))
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.change(input(), { target: { value: 'أمل' } })
    fireEvent.click(btn('تحقّقي'))
    expect(onDone).toHaveBeenCalledWith(false, 'أمل', 'امل')
  })
})

describe('QuizCard — النص المرافق', () => {
  it('يعرض passage قبل السؤال عند وجوده', () => {
    const { container } = render(<QuizCard q={{ ...mc, passage: 'نص قصير للقراءة' }} lessonId="L" retry />)
    expect(container.querySelector('.passage')!.textContent).toBe('نص قصير للقراءة')
  })
  it('لا يعرض مربع passage عند غيابه', () => {
    const { container } = render(<QuizCard q={mc} lessonId="L" retry />)
    expect(container.querySelector('.passage')).toBeNull()
  })
})
