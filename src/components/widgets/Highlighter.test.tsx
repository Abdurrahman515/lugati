// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Highlighter } from './Highlighter'
import { PRAISE } from '../../lib/feedback'

afterEach(cleanup)

const props = { prompt: 'ظلّلي الأفعال', words: ['ذهب', 'الولد', 'إلى', 'المدرسة', 'ورجع'], answer: [0, 4], why: 'الفعل يدل على حدث.' }
const chip = (n: string) => screen.getByRole('button', { name: n }) as HTMLButtonElement
const check = () => screen.getByRole('button', { name: 'تحقّقي' }) as HTMLButtonElement

describe('Highlighter — نشاط التظليل', () => {
  it('يعرض المطلوب وكل الكلمات، وزر التحقق معطّل قبل أي اختيار', () => {
    render(<Highlighter {...props} />)
    expect(screen.getByText('ظلّلي الأفعال')).toBeTruthy()
    for (const w of props.words) expect(chip(w)).toBeTruthy()
    expect(check().disabled).toBe(true)
  })

  it('الضغط يفعّل الكلمة وإعادة الضغط تلغيها', () => {
    render(<Highlighter {...props} />)
    fireEvent.click(chip('ذهب'))
    expect(chip('ذهب').className).toContain('on')
    expect(check().disabled).toBe(false)
    fireEvent.click(chip('ذهب'))
    expect(chip('ذهب').className).not.toContain('on')
    expect(check().disabled).toBe(true)
  })

  it('الصحيح (بأي ترتيب اختيار): تشجيع + تفسير + onSolved مرة واحدة + قفل', () => {
    const onSolved = vi.fn()
    const { container } = render(<Highlighter {...props} onSolved={onSolved} />)
    fireEvent.click(chip('ورجع'))
    fireEvent.click(chip('ذهب'))
    fireEvent.click(check())
    const ok = container.querySelector('.fb.ok')!
    expect(PRAISE.some((p) => ok.textContent!.includes(p))).toBe(true)
    expect(ok.textContent).toContain('الفعل يدل على حدث.')
    expect(onSolved).toHaveBeenCalledTimes(1)
    expect(check().disabled).toBe(true)
    fireEvent.click(chip('الولد'))
    expect(chip('الولد').className).not.toContain('on')
    expect(onSolved).toHaveBeenCalledTimes(1)
  })

  it('كلمات أكثر من المطلوب: رسالة بالعدد المطلوب بالأرقام العربية دون كشف الأجوبة', () => {
    const onSolved = vi.fn()
    const { container } = render(<Highlighter {...props} onSolved={onSolved} />)
    for (const w of ['ذهب', 'ورجع', 'الولد']) fireEvent.click(chip(w))
    fireEvent.click(check())
    const bad = container.querySelector('.fb.bad')!
    expect(bad.textContent).toContain('أكتر من المطلوب')
    expect(bad.textContent).toContain('٢')
    expect(onSolved).not.toHaveBeenCalled()
  })

  it('كلمات أقل من المطلوب', () => {
    const { container } = render(<Highlighter {...props} />)
    fireEvent.click(chip('ذهب'))
    fireEvent.click(check())
    expect(container.querySelector('.fb.bad')!.textContent).toContain('ناقصة')
  })

  it('العدد صحيح والاختيار خاطئ: لا يكشف الكلمة الصحيحة', () => {
    const { container } = render(<Highlighter {...props} />)
    fireEvent.click(chip('ذهب'))
    fireEvent.click(chip('الولد'))
    fireEvent.click(check())
    const t = container.querySelector('.fb.bad')!.textContent!
    expect(t).toContain('العدد صح')
    expect(t).not.toContain('ورجع')
    expect(t).not.toContain('الفعل يدل على حدث.')
  })

  it('تعديل الاختيار بعد الخطأ يخفي رسالة الخطأ ويسمح بالمحاولة', () => {
    const onSolved = vi.fn()
    const { container } = render(<Highlighter {...props} onSolved={onSolved} />)
    fireEvent.click(chip('ذهب')); fireEvent.click(check())
    expect(container.querySelector('.fb.bad')).not.toBeNull()
    fireEvent.click(chip('ورجع'))
    expect(container.querySelector('.fb.bad')).toBeNull()
    fireEvent.click(check())
    expect(onSolved).toHaveBeenCalledTimes(1)
  })
})
