// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ExamConfig, MC, Q, WR } from '../lib/types'
import { getProgress, importJSON, recordExam } from '../lib/storage'

const mcQ = (i: number): MC => ({
  kind: 'mc', id: 'e' + i, q: 'سؤال ' + i,
  opts: [{ t: 'ص' + i, why: 'صحيح: تفسير ' + i }, { t: 'غ' + i, why: 'تفسير الخطأ ' + i }], correct: 0,
})
const buildExam = vi.fn((c: ExamConfig): Q[] => (c ? [mcQ(1), mcQ(2)] : []))
vi.mock('../content/exams', () => ({ buildExam: (c: ExamConfig) => buildExam(c) }))

import { ExamView } from './ExamView'

const strict: ExamConfig = { id: 't-strict', title: 'اختبار جاد تجريبي', emoji: '🎯', kind: 'mid', unitIds: [], n: 2, pass: 60, strict: true, lockHours: 24 }
const soft: ExamConfig = { id: 't-soft', title: 'مراجعة تجريبية', emoji: '📝', kind: 'review', unitIds: [], n: 2, pass: 70, strict: false }

const btn = (n: string | RegExp) => screen.getByRole('button', { name: n }) as HTMLButtonElement
const q = (n: string | RegExp) => screen.queryByRole('button', { name: n })

beforeEach(() => {
  localStorage.clear()
  importJSON(JSON.stringify({ v: 1, stars: {}, mistakes: {}, exams: {} }))
  buildExam.mockClear()
  buildExam.mockImplementation(() => [mcQ(1), mcQ(2)])
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('ExamView — شاشة البداية', () => {
  it('تعرض العنوان وعدد الأسئلة وحد النجاح بالأرقام العربية', () => {
    render(<ExamView exam={strict} />)
    expect(screen.getByRole('heading', { name: /اختبار جاد تجريبي/ })).toBeTruthy()
    expect(screen.getByText(/عدد الأسئلة/).textContent).toContain('٢')
    expect(screen.getByText(/حدّ النجاح/).textContent).toContain('٦٠٪')
    expect(buildExam).not.toHaveBeenCalled()
  })

  it('الاختبار الجاد: تنبيه إخفاء التفسير وتنبيه القفل', () => {
    render(<ExamView exam={strict} />)
    expect(screen.getByText(/اختبار جاد:/)).toBeTruthy()
    expect(screen.getByText(/بيتقفل الاختبار ٢٤ ساعة/)).toBeTruthy()
  })

  it('غير الجاد: يشرح التفسير الفوري وحساب أول محاولة، بلا تنبيه قفل', () => {
    render(<ExamView exam={soft} />)
    expect(screen.getByText(/بعد كل سؤال بيظهر التفسير/)).toBeTruthy()
    expect(screen.queryByText(/بيتقفل/)).toBeNull()
  })

  it('يعرض أفضل نتيجة وعدد المحاولات إن وُجدت', () => {
    recordExam('t-soft', 70, true); recordExam('t-soft', 50, false)
    render(<ExamView exam={soft} />)
    expect(screen.getByText(/أفضل نتيجة/).textContent).toContain('٧٠٪')
    expect(screen.getByText(/أفضل نتيجة/).textContent).toContain('٢')
  })

  it('مقفول بعد رسوب: رسالة قفل وبلا زر بدء', () => {
    recordExam('t-strict', 40, false, 24)
    render(<ExamView exam={strict} />)
    expect(screen.getByText(/الاختبار مقفول/).textContent).toContain('٢٤')
    expect(q(/ابدئي الاختبار/)).toBeNull()
  })

  it('القفل المنتهي يسمح بالبدء', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    recordExam('t-strict', 40, false, 24)
    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'))
    render(<ExamView exam={strict} />)
    expect(btn(/ابدئي الاختبار/)).toBeTruthy()
    vi.useRealTimers()
  })
})

describe('ExamView — الاختبار الجاد', () => {
  const start = () => { render(<ExamView exam={strict} />); fireEvent.click(btn(/ابدئي الاختبار/)) }

  it('البدء يبني الأسئلة بإعدادات الاختبار ويعرض العدّاد والسؤال الأول', () => {
    start()
    expect(buildExam).toHaveBeenCalledWith(strict)
    expect(screen.getByText('١ / ٢')).toBeTruthy()
    expect(screen.getByText('سؤال 1')).toBeTruthy()
  })

  it('«التالي» معطّل حتى اختيار جواب، ولا يظهر أي تفسير أثناء الاختبار', () => {
    const { container } = render(<ExamView exam={strict} />)
    fireEvent.click(btn(/ابدئي الاختبار/))
    expect(btn(/التالي/).disabled).toBe(true)
    fireEvent.click(btn('غ1'))
    expect(btn('غ1').className).toContain('picked')
    expect(btn(/التالي/).disabled).toBe(false)
    expect(container.querySelector('.fb')).toBeNull()
    expect(container.textContent).not.toContain('تفسير')
  })

  it('يمكن تغيير الاختيار قبل «التالي»', () => {
    start()
    fireEvent.click(btn('غ1')); fireEvent.click(btn('ص1'))
    expect(btn('ص1').className).toContain('picked')
    expect(btn('غ1').className).not.toContain('picked')
  })

  it('آخر سؤال: زر «إنهاء الاختبار»', () => {
    start()
    fireEvent.click(btn('ص1')); fireEvent.click(btn(/التالي/))
    expect(btn(/إنهاء الاختبار/)).toBeTruthy()
    expect(screen.getByText('٢ / ٢')).toBeTruthy()
  })

  it('نجاح كامل: نتيجة ١٠٠٪، تُسجَّل، بلا أخطاء، وإعادة متاحة', () => {
    start()
    fireEvent.click(btn('ص1')); fireEvent.click(btn(/التالي/))
    fireEvent.click(btn('ص2')); fireEvent.click(btn(/إنهاء الاختبار/))
    expect(screen.getByText(/نجحتِ/)).toBeTruthy()
    expect(screen.getByText('٢ من ٢ — ١٠٠٪')).toBeTruthy()
    const r = getProgress().exams['t-strict']
    expect(r.passed).toBe(true)
    expect(r.best).toBe(100)
    expect(r.attempts).toBe(1)
    expect(r.lockedUntil).toBeUndefined()
    expect(Object.keys(getProgress().mistakes)).toHaveLength(0)
    expect(btn(/إعادة بأسئلة جديدة/)).toBeTruthy()
  })

  it('رسوب: يُقفل ٢٤ ساعة، ويُسجَّل الخطأ بمعرّف الاختبار، وتظهر مراجعة الأخطاء', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-05T10:00:00Z'))
    start()
    fireEvent.click(btn('غ1')); fireEvent.click(btn(/التالي/))
    fireEvent.click(btn('غ2')); fireEvent.click(btn(/إنهاء الاختبار/))
    expect(screen.getByText('٠ من ٢ — ٠٪')).toBeTruthy()
    expect(screen.getByText(/ما نجحتِ هالمرة/)).toBeTruthy()
    expect(screen.getByText(/انقفل ٢٤ ساعة/)).toBeTruthy()
    const r = getProgress().exams['t-strict']
    expect(r.passed).toBe(false)
    expect(r.lockedUntil).toBe(Date.now() + 24 * 3600_000)
    const m = getProgress().mistakes
    expect(Object.keys(m).sort()).toEqual(['e1', 'e2'])
    expect(m.e1.lesson).toBe('exam:t-strict')
    expect(m.e1.chosen).toBe('غ1')
    expect(m.e1.correct).toBe('ص1')
    // مراجعة الأسئلة الخاطئة بعد النهاية فقط
    expect(screen.getByText(/مراجعة الأسئلة التي أخطأتِ فيها/)).toBeTruthy()
    expect(document.querySelectorAll('.card.mistake')).toHaveLength(2)
    expect(document.body.textContent).toContain('تفسير الخطأ 1')
    expect(q(/إعادة بأسئلة جديدة/)).toBeNull()
    vi.useRealTimers()
  })

  it('٥٠٪ أقل من حد ٦٠٪: رسوب، والمراجعة تعرض الخاطئ فقط', () => {
    start()
    fireEvent.click(btn('ص1')); fireEvent.click(btn(/التالي/))
    fireEvent.click(btn('غ2')); fireEvent.click(btn(/إنهاء الاختبار/))
    expect(screen.getByText('١ من ٢ — ٥٠٪')).toBeTruthy()
    expect(getProgress().exams['t-strict'].passed).toBe(false)
    expect(document.querySelectorAll('.card.mistake')).toHaveLength(1)
  })

  it('سؤال كتابي: «التالي» لا يعمل بمسافات فقط، ويقيّم الإجابة المكتوبة', () => {
    const w: WR = { kind: 'wr', id: 'w1', q: 'اكتبي جمع قلم', answers: ['أقلام'], why: 'تكسير' }
    buildExam.mockImplementation(() => [w])
    render(<ExamView exam={{ ...strict, n: 1 }} />)
    fireEvent.click(btn(/ابدئي الاختبار/))
    const input = screen.getByPlaceholderText('اكتبي إجابتك هنا')
    fireEvent.change(input, { target: { value: '   ' } })
    expect(btn(/إنهاء الاختبار/).disabled).toBe(true)
    fireEvent.change(input, { target: { value: 'أَقلامٌ' } })
    fireEvent.click(btn(/إنهاء الاختبار/))
    expect(screen.getByText('١ من ١ — ١٠٠٪')).toBeTruthy()
  })
})

describe('ExamView — شهادة الشكر والتقدير', () => {
  const finish = (exam: ExamConfig, a1: string, a2: string, next: RegExp, last: string | RegExp) => {
    render(<ExamView exam={exam} />)
    fireEvent.click(btn(/ابدئي الاختبار/))
    fireEvent.click(btn(a1)); fireEvent.click(btn(next))
    fireEvent.click(btn(a2)); fireEvent.click(btn(last))
  }
  it('النجاح في اختبار جاد (منتصف/نهاية): يظهر زر الشهادة', () => {
    finish(strict, 'ص1', 'ص2', /التالي/, /إنهاء الاختبار/)
    expect(btn(/شهادة شكر وتقدير/)).toBeTruthy()
  })
  it('الرسوب: لا شهادة', () => {
    finish(strict, 'غ1', 'غ2', /التالي/, /إنهاء الاختبار/)
    expect(q(/شهادة شكر/)).toBeNull()
  })
  it('مراجعة الوحدة (حتى مع النجاح): لا شهادة', () => {
    render(<ExamView exam={soft} />)
    fireEvent.click(btn(/ابدئي الاختبار/))
    fireEvent.click(btn('ص1')); fireEvent.click(btn(/السؤال التالي/))
    fireEvent.click(btn('ص2')); fireEvent.click(btn('عرض النتيجة'))
    expect(q(/شهادة شكر/)).toBeNull()
  })
})

describe('ExamView — المراجعة غير الجادة (retry)', () => {
  const start = () => { render(<ExamView exam={soft} />); fireEvent.click(btn(/ابدئي الاختبار/)) }

  it('الخطأ لا يكشف الجواب ولا يظهر «التالي» حتى الوصول للصحيح', () => {
    start()
    fireEvent.click(btn('غ1'))
    expect(document.querySelector('.correct')).toBeNull()
    expect(q(/السؤال التالي/)).toBeNull()
    fireEvent.click(btn('ص1'))
    expect(btn(/السؤال التالي/)).toBeTruthy()
  })

  it('آخر سؤال: «عرض النتيجة»', () => {
    start()
    fireEvent.click(btn('ص1')); fireEvent.click(btn(/السؤال التالي/))
    fireEvent.click(btn('ص2'))
    expect(btn('عرض النتيجة')).toBeTruthy()
  })

  it('النتيجة من أول محاولة: صحيح بعد خطأ لا يُحتسب، والرسوب بلا قفل وإعادة متاحة', () => {
    start()
    fireEvent.click(btn('غ1')); fireEvent.click(btn('ص1')); fireEvent.click(btn(/السؤال التالي/))
    fireEvent.click(btn('ص2')); fireEvent.click(btn('عرض النتيجة'))
    expect(screen.getByText('١ من ٢ — ٥٠٪')).toBeTruthy()
    expect(screen.getByText(/أعيدي الاختبار وقت ما بدّك/)).toBeTruthy()
    const r = getProgress().exams['t-soft']
    expect(r.passed).toBe(false)
    expect(r.lockedUntil).toBeUndefined()
    // مراجعة الخطأ بما اختارته في أول محاولة
    expect(document.querySelectorAll('.card.mistake')).toHaveLength(1)
    expect(document.querySelector('.card.mistake .fb.bad')!.textContent).toContain('غ1')
    expect(btn(/إعادة بأسئلة جديدة/)).toBeTruthy()
  })

  it('خطأ الاختبار غير الجاد يُسجَّل مرة واحدة فقط (من البطاقة) بمعرّف الاختبار', () => {
    start()
    fireEvent.click(btn('غ1')); fireEvent.click(btn('ص1')); fireEvent.click(btn(/السؤال التالي/))
    fireEvent.click(btn('ص2')); fireEvent.click(btn('عرض النتيجة'))
    const m = getProgress().mistakes
    expect(Object.keys(m)).toEqual(['e1'])
    expect(m.e1.count).toBe(1)
    expect(m.e1.lesson).toBe('exam:t-soft')
  })

  it('كله صحيح من أول مرة: نجاح ١٠٠٪', () => {
    start()
    fireEvent.click(btn('ص1')); fireEvent.click(btn(/السؤال التالي/))
    fireEvent.click(btn('ص2')); fireEvent.click(btn('عرض النتيجة'))
    expect(screen.getByText('٢ من ٢ — ١٠٠٪')).toBeTruthy()
    expect(screen.getByText(/نجحتِ/)).toBeTruthy()
    expect(getProgress().exams['t-soft'].passed).toBe(true)
  })

  it('«إعادة بأسئلة جديدة»: يبني أسئلة جديدة ويرجع للسؤال الأول بنتيجة نظيفة', () => {
    start()
    fireEvent.click(btn('ص1')); fireEvent.click(btn(/السؤال التالي/))
    fireEvent.click(btn('ص2')); fireEvent.click(btn('عرض النتيجة'))
    fireEvent.click(btn(/إعادة بأسئلة جديدة/))
    expect(buildExam).toHaveBeenCalledTimes(2)
    expect(screen.getByText('١ / ٢')).toBeTruthy()
    fireEvent.click(btn('غ1')); fireEvent.click(btn('ص1')); fireEvent.click(btn(/السؤال التالي/))
    fireEvent.click(btn('غ2')); fireEvent.click(btn('ص2')); fireEvent.click(btn('عرض النتيجة'))
    expect(screen.getByText('٠ من ٢ — ٠٪')).toBeTruthy()
    expect(getProgress().exams['t-soft'].attempts).toBe(2)
    expect(getProgress().exams['t-soft'].best).toBe(100)
  })
})
