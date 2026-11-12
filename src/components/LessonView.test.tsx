// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Lesson, MC } from '../lib/types'
import { getProgress, importJSON } from '../lib/storage'

const nb = vi.fn((id: string): { prev?: { id: string; title: string }; next?: { id: string; title: string } } => (id ? {} : {}))
vi.mock('../content/registry', () => ({ neighbors: (id: string) => nb(id) }))
vi.mock('../content/generators', () => ({
  genSet: (_g: string, n: number) => Array.from({ length: n }, (_, i): MC => ({
    kind: 'mc', id: 'pg' + i, q: 'تدريب ' + (i + 1),
    opts: [{ t: 'ص' + (i + 1), why: 'صحيح: تمام' }, { t: 'غ' + (i + 1), why: 'لا' }], correct: 0,
  })),
}))

import { LessonView } from './LessonView'

const quiz: MC = {
  kind: 'mc', id: 'lv-q1', q: 'سؤال الدرس',
  opts: [{ t: 'الصحيح', why: 'صحيح: لأنه كذلك' }, { t: 'الخطأ', why: 'لأنه ليس كذلك' }], correct: 0,
}
const lesson: Lesson = {
  id: 'lv-1', title: 'درس تجريبي', emoji: '🧪', kind: 'language',
  blocks: [
    { t: 'say', text: 'مقدمة الدرس' },
    { t: 'say', text: 'شرح **القاعدة**', emoji: '💡' },
    { t: 'quiz', q: quiz },
    { t: 'reveal', title: 'هل تعرفين؟', text: 'معلومة مخفية' },
    { t: 'say', text: 'خلاصة الدرس' },
  ],
}

const btn = (n: string | RegExp) => screen.getByRole('button', { name: n }) as HTMLButtonElement
const q = (n: string | RegExp) => screen.queryByRole('button', { name: n })
const cont = () => btn(/كمّلي/)

beforeEach(() => {
  localStorage.clear()
  importJSON(JSON.stringify({ v: 1, stars: {}, mistakes: {}, exams: {} }))
  nb.mockReset(); nb.mockReturnValue({})
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('LessonView — الفتح التدريجي', () => {
  it('يعرض العنوان والجزء الأول فقط، ولا يعرض الباقي', () => {
    render(<LessonView lesson={lesson} />)
    expect(screen.getByText(/درس تجريبي/)).toBeTruthy()
    expect(screen.getByText('مقدمة الدرس')).toBeTruthy()
    expect(screen.queryByText('خلاصة الدرس')).toBeNull()
    expect(screen.queryByText('سؤال الدرس')).toBeNull()
    expect(screen.getByText('الجزء ١ من ٣')).toBeTruthy()
  })

  it('جزء بلا سؤال: زر «كمّلي» ظاهر ويفتح الجزء التالي', () => {
    render(<LessonView lesson={lesson} />)
    expect(q(/🔒/)).toBeNull()
    fireEvent.click(cont())
    expect(screen.getByText('الجزء ٢ من ٣')).toBeTruthy()
    expect(screen.getByText('سؤال الدرس')).toBeTruthy()
    expect(screen.getByText('مقدمة الدرس')).toBeTruthy() // الأجزاء السابقة تبقى ظاهرة
  })

  it('جزء فيه سؤال: «كمّلي» مخفي وتلميح القفل ظاهر حتى الحل', () => {
    render(<LessonView lesson={lesson} />)
    fireEvent.click(cont())
    expect(q(/كمّلي/)).toBeNull()
    expect(screen.getByText(/حلّي هالجزء لتكمّلي/)).toBeTruthy()
  })

  it('الإجابة الخاطئة لا تفتح الجزء التالي ولا تكشف الجواب', () => {
    const { container } = render(<LessonView lesson={lesson} />)
    fireEvent.click(cont())
    fireEvent.click(btn('الخطأ'))
    expect(q(/كمّلي/)).toBeNull()
    expect(screen.getByText(/حلّي هالجزء/)).toBeTruthy()
    expect(container.querySelector('.correct')).toBeNull()
  })

  it('الحل الصحيح يفتح «كمّلي» ويُخفي القفل', () => {
    render(<LessonView lesson={lesson} />)
    fireEvent.click(cont())
    fireEvent.click(btn('الصحيح'))
    expect(q(/حلّي هالجزء/)).toBeNull()
    fireEvent.click(cont())
    expect(screen.getByText('خلاصة الدرس')).toBeTruthy()
  })

  it('بطاقة «اكشفي» تلتصق بجزء ما قبلها وتنكشف بالنقر', () => {
    render(<LessonView lesson={lesson} />)
    fireEvent.click(cont())
    expect(screen.getByText(/هل تعرفين؟/)).toBeTruthy()
    expect(screen.queryByText('معلومة مخفية')).toBeNull()
    fireEvent.click(screen.getByText(/هل تعرفين؟/))
    expect(screen.getByText('معلومة مخفية')).toBeTruthy()
    fireEvent.click(screen.getByText(/هل تعرفين؟/))
    // AnimatePresence قد يؤخّر الإزالة؛ يكفي أن النص صار يُطلب إخفاؤه
    expect(screen.getByText(/اضغطي للكشف/)).toBeTruthy()
  })

  it('شريط التقدم يتحرك مع الأجزاء', () => {
    const { container } = render(<LessonView lesson={lesson} />)
    const bar = () => (container.querySelector('.progress > div') as HTMLElement).style.width
    expect(parseFloat(bar())).toBeCloseTo(33.33, 1)
    fireEvent.click(cont())
    expect(parseFloat(bar())).toBeCloseTo(33.33, 1) // الجزء ٢ غير محلول
    fireEvent.click(btn('الصحيح'))
    expect(parseFloat(bar())).toBeCloseTo(66.67, 1)
  })
})

describe('LessonView — النجوم والإنهاء', () => {
  const finish = (firstTry: boolean) => {
    fireEvent.click(cont())
    if (!firstTry) fireEvent.click(btn('الخطأ'))
    fireEvent.click(btn('الصحيح'))
    fireEvent.click(cont())
  }

  it('لا نجوم محفوظة قبل نهاية الدرس، والخانات الثلاث ظاهرة دائماً', () => {
    const { container } = render(<LessonView lesson={lesson} />)
    expect(getProgress().stars['lv-1']).toBeUndefined()
    expect(container.querySelector('.topbar .stars')!.textContent).toBe('☆☆☆')
  })

  it('كل الإجابات صحيحة من أول مرة: ٣ نجوم وتُحفظ', () => {
    const { container } = render(<LessonView lesson={lesson} />)
    finish(true)
    expect(screen.getByText(/خلصتِ الدرس/)).toBeTruthy()
    expect(getProgress().stars['lv-1']).toBe(3)
    expect(container.querySelector('.stars.big')!.textContent).toBe('⭐⭐⭐')
    expect(container.querySelector('.topbar .stars')!.textContent).toBe('⭐⭐⭐')
    expect(screen.getByText(/الصحيحة من أول محاولة: ١ من ١/)).toBeTruthy()
  })

  it('خطأ في أول محاولة ثم صحيح: لا تُحتسب (نجمة واحدة)', () => {
    const { container } = render(<LessonView lesson={lesson} />)
    finish(false)
    expect(getProgress().stars['lv-1']).toBe(1)
    expect(container.querySelector('.stars.big')!.textContent).toBe('⭐☆☆')
    expect(screen.getByText(/الصحيحة من أول محاولة: ٠ من ١/)).toBeTruthy()
  })

  it('لا تنقص النجوم المحفوظة سابقاً عند إعادة الدرس بنتيجة أسوأ', () => {
    importJSON(JSON.stringify({ v: 1, stars: { 'lv-1': 3 }, mistakes: {}, exams: {} }))
    render(<LessonView lesson={lesson} />)
    finish(false)
    expect(getProgress().stars['lv-1']).toBe(3)
  })

  it('درس بلا أي سؤال: ٣ نجوم ولا سطر «الصحيحة من أول محاولة»', () => {
    const l: Lesson = { ...lesson, id: 'lv-2', blocks: [{ t: 'say', text: 'أ' }] }
    render(<LessonView lesson={l} />)
    expect(screen.getByText(/خلصتِ الدرس/)).toBeTruthy()
    expect(getProgress().stars['lv-2']).toBe(3)
    expect(screen.queryByText(/الصحيحة من أول محاولة/)).toBeNull()
  })

  it('روابط السابق والتالي تظهر عند الإنهاء فقط', () => {
    nb.mockReturnValue({ prev: { id: 'p', title: 'الدرس السابق' }, next: { id: 'n', title: 'الدرس التالي' } })
    render(<LessonView lesson={lesson} />)
    expect(screen.queryByText(/الدرس التالي/)).toBeNull()
    finish(true)
    expect(screen.getByText(/الدرس التالي/).closest('a')!.getAttribute('href')).toBe('#/lesson/n')
    expect(screen.getByText(/الدرس السابق/).closest('a')!.getAttribute('href')).toBe('#/lesson/p')
  })

  it('آخر درس: زر «الرئيسية» بدل التالي', () => {
    nb.mockReturnValue({ prev: { id: 'p', title: 'السابق' } })
    render(<LessonView lesson={lesson} />)
    finish(true)
    const home = screen.getAllByText('الرئيسية').map((e) => e.closest('a')!.getAttribute('href'))
    expect(home).toContain('#/')
  })
})

describe('LessonView — الأدوات والتدريب', () => {
  it('أداة غير مسجّلة: رسالة واضحة', () => {
    const l: Lesson = { ...lesson, id: 'lv-w0', blocks: [{ t: 'widget', id: 'nope', props: {} }] }
    render(<LessonView lesson={l} />)
    expect(screen.getByText(/أداة غير مسجّلة: nope/)).toBeTruthy()
  })

  it('أداة تظليل تقفل الجزء حتى حلّها', () => {
    const l: Lesson = {
      ...lesson, id: 'lv-w1',
      blocks: [
        { t: 'widget', id: 'highlighter', props: { prompt: 'ظلّلي الفعل', words: ['ذهب', 'الولد'], answer: [0], why: 'فعل.' } },
        { t: 'say', text: 'بعد النشاط' },
      ],
    }
    render(<LessonView lesson={l} />)
    expect(q(/كمّلي/)).toBeNull()
    expect(screen.getByText(/حلّي هالجزء/)).toBeTruthy()
    fireEvent.click(btn('الولد')); fireEvent.click(btn('تحقّقي'))
    expect(q(/كمّلي/)).toBeNull()
    fireEvent.click(btn('الولد')); fireEvent.click(btn('ذهب')); fireEvent.click(btn('تحقّقي'))
    fireEvent.click(cont())
    expect(screen.getByText('بعد النشاط')).toBeTruthy()
  })

  it('التدريب المتجدد: يقفل الجزء حتى نهاية أول جولة وتدخل نتيجته في النجوم', () => {
    const l: Lesson = {
      ...lesson, id: 'lv-p1',
      blocks: [{ t: 'say', text: 'تمهيد' }, { t: 'practice', gen: 'g', n: 2 }],
    }
    render(<LessonView lesson={l} />)
    // تمهيد + تدريب في جزء واحد (التدريب يلتصق بالشرح الذي قبله)
    expect(screen.getByRole('heading', { name: /تدريب متجدد/ })).toBeTruthy()
    expect(getProgress().stars['lv-p1']).toBeUndefined()
    fireEvent.click(btn('ص1')); fireEvent.click(btn(/السؤال التالي/))
    expect(getProgress().stars['lv-p1']).toBeUndefined()
    fireEvent.click(btn('غ2')); fireEvent.click(btn('ص2')); fireEvent.click(btn('عرض النتيجة'))
    expect(screen.getByText(/خلصتِ الدرس/)).toBeTruthy()
    // ١ من ٢ = ٥٠٪ → نجمة واحدة
    expect(getProgress().stars['lv-p1']).toBe(1)
  })

  it('يمرّر الدرس إلى التمرير التلقائي دون أخطاء عند فتح جزء جديد', () => {
    vi.useFakeTimers()
    render(<LessonView lesson={lesson} />)
    fireEvent.click(cont())
    vi.advanceTimersByTime(100)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
