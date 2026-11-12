// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Mistakes } from './Mistakes'
import { getProgress, importJSON, logMistake } from '../lib/storage'

const reset = () => importJSON(JSON.stringify({ v: 1, stars: {}, mistakes: {}, exams: {} }))

beforeEach(() => { localStorage.clear(); reset() })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('Mistakes — سجل الأخطاء', () => {
  it('الحالة الفارغة: رسالة تشجيع ولا بطاقات', () => {
    const { container } = render(<Mistakes />)
    expect(screen.getByText(/لا أخطاء محفوظة/)).toBeTruthy()
    expect(container.querySelectorAll('.mistake')).toHaveLength(0)
  })

  it('رابط العودة للرئيسية', () => {
    render(<Mistakes />)
    expect((screen.getByText(/الرئيسية/) as HTMLAnchorElement).getAttribute('href')).toBe('#/')
  })

  it('يعرض السؤال وما اختارته والصحيح وتفسير الخطأ', () => {
    logMistake('a', { lesson: 'L', q: 'ما الفعل؟', chosen: 'كتاب', correct: 'كتب', why: 'كتاب اسم وليس فعلاً.' })
    render(<Mistakes />)
    expect(screen.getByText('ما الفعل؟')).toBeTruthy()
    expect(document.querySelector('.fb.bad')!.textContent).toContain('كتاب')
    expect(document.querySelector('.fb.bad')!.textContent).toContain('كتاب اسم وليس فعلاً.')
    expect(document.querySelector('.fb.ok')!.textContent).toContain('كتب')
  })

  it('يعرض تكرار الخطأ بالأرقام العربية', () => {
    const rec = { lesson: 'L', q: 'س', chosen: 'أ', correct: 'ب', why: 'w' }
    logMistake('a', rec); logMistake('a', rec); logMistake('a', rec)
    render(<Mistakes />)
    expect(screen.getByText('تكرر الخطأ ٣ مرة')).toBeTruthy()
  })

  it('الأحدث أولاً', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    logMistake('old', { lesson: 'L', q: 'سؤال قديم', chosen: 'أ', correct: 'ب', why: '' })
    vi.setSystemTime(5000)
    logMistake('new', { lesson: 'L', q: 'سؤال جديد', chosen: 'أ', correct: 'ب', why: '' })
    const { container } = render(<Mistakes />)
    const cards = container.querySelectorAll('.mistake')
    expect(cards[0].textContent).toContain('سؤال جديد')
    expect(cards[1].textContent).toContain('سؤال قديم')
  })

  it('«فهمتها، احذفيها» يحذف الخطأ من السجل والعرض', () => {
    logMistake('a', { lesson: 'L', q: 'سؤال أ', chosen: 'x', correct: 'y', why: '' })
    logMistake('b', { lesson: 'L', q: 'سؤال ب', chosen: 'x', correct: 'y', why: '' })
    render(<Mistakes />)
    const del = screen.getAllByRole('button', { name: 'فهمتها، احذفيها' })
    expect(del).toHaveLength(2)
    fireEvent.click(del[0])
    expect(Object.keys(getProgress().mistakes)).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'فهمتها، احذفيها' })).toHaveLength(1)
  })

  it('حذف آخر خطأ يرجع الحالة الفارغة', () => {
    logMistake('a', { lesson: 'L', q: 'س', chosen: 'x', correct: 'y', why: '' })
    render(<Mistakes />)
    fireEvent.click(screen.getByRole('button', { name: 'فهمتها، احذفيها' }))
    expect(screen.getByText(/لا أخطاء محفوظة/)).toBeTruthy()
  })
})
