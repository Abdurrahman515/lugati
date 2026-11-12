// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Home } from './Home'
import { SEMESTERS } from '../content/registry'
import { exportJSON, getProgress, importJSON, logMistake, recordExam } from '../lib/storage'
import { toArabicDigits } from '../lib/arabicText'

const units = SEMESTERS.flatMap((s) => s.units)
const [u1, u2] = units
const reset = (p: object = {}) => importJSON(JSON.stringify({ v: 1, stars: {}, mistakes: {}, exams: {}, ...p }))
const head = (re: RegExp) => screen.getByRole('button', { name: re }) as HTMLButtonElement

beforeEach(() => { localStorage.clear(); reset() })
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('Home — الصفحة الرئيسية', () => {
  it('يعرض الهيرو والفصل الدراسي الأول والثاني ووحداتهما', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /لغتي الخالدة/ })).toBeTruthy()
    expect(head(/الفصل الدراسي الأول/).getAttribute('aria-expanded')).toBe('true')
    expect(head(/الفصل الدراسي الثاني/).getAttribute('aria-expanded')).toBe('true')
    expect(units).toHaveLength(6)
    for (const u of units) expect(head(new RegExp(u.title.split(':')[0])).getAttribute('aria-expanded')).toBeDefined()
  })

  it('الوحدة الأولى مفتوحة افتراضياً والباقية مطويّة', () => {
    render(<Home />)
    expect(head(/الوحدة الأولى/).getAttribute('aria-expanded')).toBe('true')
    expect(head(/الوحدة الثانية/).getAttribute('aria-expanded')).toBe('false')
    expect(head(/الوحدة الثالثة/).getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText(new RegExp(u1.lessons[0].title))).toBeTruthy()
    expect(screen.queryByText(new RegExp(u2.lessons[0].title))).toBeNull()
  })

  it('رابط كل درس في الوحدة المفتوحة يشير إلى #/lesson/<id>', () => {
    const { container } = render(<Home />)
    const hrefs = [...container.querySelector('.lessons')!.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(u1.lessons.map((l) => '#/lesson/' + l.id))
  })

  it('فتح وحدة مطويّة يُظهر دروسها ويحفظ الحالة في مفتاح الواجهة المنفصل', () => {
    render(<Home />)
    fireEvent.click(head(/الوحدة الثانية/))
    expect(head(/الوحدة الثانية/).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText(new RegExp(u2.lessons[0].title))).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('lugha-app:ui:v1')!)['unit:u2']).toBe(true)
    // ولا تدخل حالة الطيّ في بيانات التقدم المصدَّرة
    expect(exportJSON()).not.toContain('unit:u2')
  })

  it('حالة الطيّ المحفوظة تُستعاد عند فتح الصفحة من جديد', () => {
    localStorage.setItem('lugha-app:ui:v1', JSON.stringify({ 'unit:u1': false, 'unit:u3': true }))
    render(<Home />)
    expect(head(/الوحدة الأولى/).getAttribute('aria-expanded')).toBe('false')
    expect(head(/الوحدة الثالثة/).getAttribute('aria-expanded')).toBe('true')
  })

  it('طيّ الفصل الدراسي كله يخفي وحداته', async () => {
    render(<Home />)
    fireEvent.click(head(/الفصل الدراسي الأول/))
    expect(head(/الفصل الدراسي الأول/).getAttribute('aria-expanded')).toBe('false')
    await waitFor(() => expect(screen.queryByRole('button', { name: /الوحدة الأولى/ })).toBeNull())
  })

  it('ثلاث خانات نجوم لكل درس دائماً (☆☆☆ قبل أي تقدم)', () => {
    const { container } = render(<Home />)
    const stars = [...container.querySelector('.lessons')!.querySelectorAll('.stars')].map((s) => s.textContent)
    expect(stars).toHaveLength(u1.lessons.length)
    expect(new Set(stars)).toEqual(new Set(['☆☆☆']))
  })

  it('يعرض نجوم الدروس المحفوظة ومجموع الوحدة بالأرقام العربية', () => {
    reset({ stars: { [u1.lessons[0].id]: 2, [u1.lessons[1].id]: 3 } })
    const { container } = render(<Home />)
    const stars = [...container.querySelector('.lessons')!.querySelectorAll('.stars')].map((s) => s.textContent)
    expect(stars[0]).toBe('⭐⭐☆')
    expect(stars[1]).toBe('⭐⭐⭐')
    expect(stars[2]).toBe('☆☆☆')
    expect(head(/الوحدة الأولى/).textContent).toContain(`⭐ ${toArabicDigits(5)}/${toArabicDigits(u1.lessons.length * 3)}`)
  })

  it('عدّاد الأخطاء في الهيرو يتبع السجل', () => {
    const rec = { lesson: 'L', q: 'س', chosen: 'أ', correct: 'ب', why: '' }
    const { rerender } = render(<Home />)
    expect(screen.getByText(/سجل الأخطاء \(٠\)/)).toBeTruthy()
    logMistake('a', rec); logMistake('b', rec)
    rerender(<Home />)
    const a = screen.getByText(/سجل الأخطاء \(٢\)/) as HTMLAnchorElement
    expect(a.getAttribute('href')).toBe('#/mistakes')
  })
})

describe('Home — بطاقات الاختبارات', () => {
  it('مراجعة الوحدة داخل وحدتها، وتفاصيلها بالأرقام العربية', () => {
    render(<Home />)
    const a = screen.getByText('مراجعة الوحدة الأولى').closest('a')!
    expect(a.getAttribute('href')).toBe('#/exam/rev-u1')
    expect(a.textContent).toContain('١٦ سؤالاً — النجاح ٧٠٪')
    expect(a.textContent).not.toContain('اختبار جاد')
    expect(screen.queryByText('مراجعة الوحدة الثانية')).toBeNull() // وحدتها مطويّة
  })

  it('المنتصف خارج طيّ الوحدات (يظهر والوحدة الثانية مطويّة) وجاد', () => {
    render(<Home />)
    const a = screen.getByText(/اختبار منتصف الفصل الدراسي الأول/).closest('a')!
    expect(a.getAttribute('href')).toBe('#/exam/mid-s1')
    expect(a.textContent).toContain('٣٠ سؤالاً — النجاح ٦٠٪ — اختبار جاد')
  })

  it('النهاية تظهر تحت الفصل الدراسي وجادّة', () => {
    render(<Home />)
    const a = screen.getByText(/اختبار نهاية الفصل/).closest('a')!
    expect(a.getAttribute('href')).toBe('#/exam/final-s1')
    expect(a.textContent).toContain('٦٠ سؤالاً')
  })

  it('بلا محاولات: الحالة «—»', () => {
    render(<Home />)
    expect(screen.getByText(/اختبار منتصف الفصل الدراسي الأول/).closest('a')!.querySelector('.status')!.textContent).toBe('—')
  })

  it('ناجح: ✅ مع أفضل نتيجة', () => {
    recordExam('rev-u1', 85, true)
    render(<Home />)
    expect(screen.getByText('مراجعة الوحدة الأولى').closest('a')!.querySelector('.status')!.textContent).toBe('✅ ٨٥٪')
  })

  it('راسب بلا قفل (مراجعة): 🔁 مع النتيجة', () => {
    recordExam('rev-u1', 40, false)
    render(<Home />)
    expect(screen.getByText('مراجعة الوحدة الأولى').closest('a')!.querySelector('.status')!.textContent).toBe('🔁 ٤٠٪')
  })

  it('راسب في اختبار جاد: مقفول مع الساعات المتبقية', () => {
    recordExam('mid-s1', 30, false, 24)
    render(<Home />)
    const a = screen.getByText(/اختبار منتصف الفصل الدراسي الأول/).closest('a')!
    expect(a.className).toContain('locked')
    expect(a.querySelector('.status')!.textContent).toBe('🔒 بعد ٢٤ ساعة')
  })

  it('انتهاء مدة القفل يزيل حالة القفل', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    recordExam('mid-s1', 30, false, 24)
    vi.setSystemTime(new Date('2026-01-02T01:00:00Z'))
    render(<Home />)
    const a = screen.getByText(/اختبار منتصف الفصل الدراسي الأول/).closest('a')!
    expect(a.className).not.toContain('locked')
    expect(a.querySelector('.status')!.textContent).toBe('🔁 ٣٠٪')
  })
})

describe('Home — تصدير واستيراد التقدم', () => {
  it('التصدير ينزّل lugha-progress.json بمحتوى التقدم', async () => {
    reset({ stars: { x: 2 } })
    const created: Blob[] = []
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => { created.push(b as Blob); return 'blob:x' })
    URL.revokeObjectURL = vi.fn()
    let name = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { name = this.download })
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /تصدير التقدم/ }))
    expect(name).toBe('lugha-progress.json')
    expect(created).toHaveLength(1)
    expect(created[0].type).toBe('application/json')
    expect(created[0].size).toBe(new Blob([exportJSON()]).size)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
  })

  it('زر الاستيراد يفتح منتقي الملفات (JSON فقط)', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const { container } = render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /استيراد/ }))
    expect(click).toHaveBeenCalledTimes(1)
    expect(container.querySelector('input[type=file]')!.getAttribute('accept')).toBe('application/json')
  })

  const pick = (container: HTMLElement, text: string) => {
    const f = new File([text], 'p.json', { type: 'application/json' })
    Object.defineProperty(f, 'text', { value: async () => text })
    fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [f] } })
  }

  it('استيراد ملف صالح: يستبدل التقدم ويعرض رسالة نجاح', async () => {
    const alert = vi.fn(); vi.stubGlobal('alert', alert)
    const { container } = render(<Home />)
    pick(container, JSON.stringify({ v: 1, stars: { [u1.lessons[0].id]: 3 }, mistakes: {}, exams: {} }))
    await waitFor(() => expect(alert).toHaveBeenCalledWith(expect.stringContaining('تم استيراد التقدم بنجاح')))
    expect(getProgress().stars[u1.lessons[0].id]).toBe(3)
    await waitFor(() => expect(container.querySelector('.lessons .stars')!.textContent).toBe('⭐⭐⭐'))
  })

  it('استيراد ملف غير صالح: رسالة خطأ ولا يتغير التقدم', async () => {
    reset({ stars: { keep: 1 } })
    const alert = vi.fn(); vi.stubGlobal('alert', alert)
    const { container } = render(<Home />)
    pick(container, 'ليس JSON')
    await waitFor(() => expect(alert).toHaveBeenCalledWith(expect.stringContaining('الملف غير صالح')))
    expect(getProgress().stars.keep).toBe(1)
  })

  it('لا شيء يحدث إن أُلغي اختيار الملف', () => {
    const alert = vi.fn(); vi.stubGlobal('alert', alert)
    const { container } = render(<Home />)
    fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [] } })
    expect(alert).not.toHaveBeenCalled()
  })
})

describe('Home — الفصل الثاني وشهادة الشكر والتقدير', () => {
  it('اختبارا الفصل الثاني يظهران برابطيهما', () => {
    render(<Home />)
    expect(screen.getByText('اختبار منتصف الفصل الدراسي الثاني').closest('a')!.getAttribute('href')).toBe('#/exam/mid-s2')
    expect(screen.getByText('اختبار نهاية العام الدراسي').closest('a')!.getAttribute('href')).toBe('#/exam/final-s2')
  })

  it('لا زر شهادة قبل النجاح، ولا بعد الرسوب', () => {
    recordExam('mid-s1', 30, false, 24)
    render(<Home />)
    expect(screen.queryAllByRole('button', { name: /شهادة شكر/ })).toHaveLength(0)
  })

  it('لا زر شهادة لمراجعة الوحدة حتى لو نجحت فيها', () => {
    recordExam('rev-u1', 95, true)
    render(<Home />)
    expect(screen.queryAllByRole('button', { name: /شهادة شكر/ })).toHaveLength(0)
  })

  it('بعد النجاح في المنتصف والنهاية يظهر زر الشهادة لكل منهما، ويفتح نموذج الاسم', () => {
    recordExam('mid-s1', 80, true)
    recordExam('final-s2', 75, true)
    render(<Home />)
    const btns = screen.getAllByRole('button', { name: /شهادة شكر/ })
    expect(btns).toHaveLength(2)
    fireEvent.click(btns[0])
    expect(screen.getByLabelText('اسم الطالبة')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'اطبعي الشهادة' }).hasAttribute('disabled')).toBe(true)
  })
})
