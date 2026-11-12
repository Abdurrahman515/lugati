// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { MC } from '../lib/types'
import { importJSON } from '../lib/storage'

const mk = (n: number): MC => ({
  kind: 'mc', id: 'p' + n, q: 'سؤال ' + n,
  opts: [{ t: 'صح' + n, why: 'تفسير صحيح ' + n }, { t: 'خطأ' + n, why: 'تفسير خطأ ' + n }],
  correct: 0,
})
const genSet = vi.fn((_g: string, n: number) => Array.from({ length: n }, (_, i) => mk(i + 1)))
vi.mock('../content/generators', () => ({ genSet: (g: string, n: number) => genSet(g, n) }))

import { Practice } from './Practice'

const btn = (n: string | RegExp) => screen.getByRole('button', { name: n }) as HTMLButtonElement
const right = (i: number) => fireEvent.click(btn('صح' + i))
const wrong = (i: number) => fireEvent.click(btn('خطأ' + i))

beforeEach(() => {
  localStorage.clear()
  importJSON(JSON.stringify({ v: 1, stars: {}, mistakes: {}, exams: {} }))
  genSet.mockClear()
})
afterEach(cleanup)

describe('Practice — تدريب متجدد', () => {
  it('يطلب من المولّد العدد المطلوب ويعرض العدّاد بالأرقام العربية', () => {
    render(<Practice gen="g" n={3} lessonId="L" />)
    expect(genSet).toHaveBeenCalledWith('g', 3)
    expect(screen.getByText(/سؤال ١ من ٣/)).toBeTruthy()
    expect(screen.getByText('سؤال 1')).toBeTruthy()
  })

  it('لا يعرض شيئاً إن لم يُنتج المولّد أسئلة', () => {
    genSet.mockReturnValueOnce([])
    const { container } = render(<Practice gen="none" n={3} lessonId="L" />)
    expect(container.innerHTML).toBe('')
  })

  it('زر «السؤال التالي» لا يظهر قبل الوصول للجواب الصحيح', () => {
    render(<Practice gen="g" n={2} lessonId="L" />)
    expect(screen.queryByRole('button', { name: /السؤال التالي/ })).toBeNull()
    wrong(1)
    expect(screen.queryByRole('button', { name: /السؤال التالي/ })).toBeNull()
    right(1)
    expect(btn(/السؤال التالي/)).toBeTruthy()
  })

  it('الانتقال للتالي يعرض السؤال الثاني والعدّاد ٢ من ٢', () => {
    render(<Practice gen="g" n={2} lessonId="L" />)
    right(1)
    fireEvent.click(btn(/السؤال التالي/))
    expect(screen.getByText(/سؤال ٢ من ٢/)).toBeTruthy()
    expect(screen.getByText('سؤال 2')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /السؤال التالي|عرض النتيجة/ })).toBeNull()
  })

  it('آخر سؤال: زر «عرض النتيجة» بدل «التالي»', () => {
    render(<Practice gen="g" n={1} lessonId="L" />)
    right(1)
    expect(btn('عرض النتيجة')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /السؤال التالي/ })).toBeNull()
  })

  it('النتيجة تحسب الصحيح من أول محاولة فقط، وonComplete مرة واحدة', () => {
    const onComplete = vi.fn()
    render(<Practice gen="g" n={3} lessonId="L" onComplete={onComplete} />)
    right(1); fireEvent.click(btn(/السؤال التالي/))
    wrong(2); right(2); fireEvent.click(btn(/السؤال التالي/)) // صحيح بعد خطأ: لا يُحتسب
    right(3); fireEvent.click(btn('عرض النتيجة'))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(2, 3)
    expect(screen.getByText('خلصت الجولة!', { exact: false })).toBeTruthy()
    expect(document.body.textContent).toContain('جبتِ ٢ من ٣ من أول محاولة')
  })

  it('جولة جديدة: تُعاد توليد الأسئلة وتصفّر النتيجة ولا تستدعي onComplete ثانية', () => {
    const onComplete = vi.fn()
    render(<Practice gen="g" n={1} lessonId="L" onComplete={onComplete} />)
    right(1); fireEvent.click(btn('عرض النتيجة'))
    expect(genSet).toHaveBeenCalledTimes(1)
    fireEvent.click(btn(/جولة جديدة/))
    expect(genSet).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/سؤال ١ من ١/)).toBeTruthy()
    wrong(1); right(1); fireEvent.click(btn('عرض النتيجة'))
    expect(document.body.textContent).toContain('جبتِ ٠ من ١')
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('وضع retry مفعّل: الخطأ لا يكشف الجواب ولا ينقل للتالي', () => {
    const { container } = render(<Practice gen="g" n={2} lessonId="L" />)
    wrong(1)
    expect(container.querySelector('.correct')).toBeNull()
    expect(btn('خطأ1').disabled).toBe(true)
    expect(btn('صح1').disabled).toBe(false)
  })
})
