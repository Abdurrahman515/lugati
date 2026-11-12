// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Orderer } from './Orderer'
import { PRAISE } from '../../lib/feedback'

afterEach(cleanup)

const words = ['ذهبَ', 'الولدُ', 'إلى', 'المدرسةِ']
const base = { prompt: 'رتّبي الكلمات', words, why: 'فعل ثم فاعل ثم جار ومجرور.' }
const chip = (n: string) => screen.getByRole('button', { name: n }) as HTMLButtonElement
const check = () => screen.getByRole('button', { name: 'تحقّقي' }) as HTMLButtonElement
const build = (ws: string[]) => ws.forEach((w) => fireEvent.click(chip(w)))

describe('Orderer — نشاط الترتيب', () => {
  it('يعرض كل الكلمات (مخلوطة) وتلميح البداية، وزر التحقق معطّل', () => {
    render(<Orderer {...base} />)
    expect(screen.getByText(/اضغطي على الكلمات بالترتيب الصحيح/)).toBeTruthy()
    for (const w of words) expect(chip(w)).toBeTruthy()
    expect(check().disabled).toBe(true)
  })

  it('الضغط ينقل الكلمة للبناء، والتحقق يُفعَّل عند استعمال كل الكلمات', () => {
    render(<Orderer {...base} />)
    build(['ذهبَ', 'الولدُ', 'إلى'])
    expect(check().disabled).toBe(true)
    build(['المدرسةِ'])
    expect(check().disabled).toBe(false)
    expect(screen.queryByText(/اضغطي على الكلمات بالترتيب الصحيح/)).toBeNull()
  })

  it('الترتيب الصحيح: تشجيع وتفسير وonSolved مرة واحدة وقفل', () => {
    const onSolved = vi.fn()
    const { container } = render(<Orderer {...base} onSolved={onSolved} />)
    build(words)
    fireEvent.click(check())
    const ok = container.querySelector('.fb.ok')!
    expect(PRAISE.some((p) => ok.textContent!.includes(p))).toBe(true)
    expect(ok.textContent).toContain('فعل ثم فاعل')
    expect(onSolved).toHaveBeenCalledTimes(1)
    expect(check().disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'من جديد' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('ترتيب خاطئ بلا كلمة في مكانها: رسالة مناسبة دون كشف الترتيب', () => {
    const onSolved = vi.fn()
    const { container } = render(<Orderer {...base} onSolved={onSolved} />)
    build(['المدرسةِ', 'ذهبَ', 'الولدُ', 'إلى'])
    fireEvent.click(check())
    const bad = container.querySelector('.fb.bad')!
    expect(bad.textContent).toContain('ولا كلمة بمكانها')
    expect(bad.textContent).not.toContain('فعل ثم فاعل')
    expect(onSolved).not.toHaveBeenCalled()
  })

  it('يعدّ الكلمات في مكانها الصحيح: واحدة / عدة', () => {
    const { container } = render(<Orderer {...base} />)
    build(['ذهبَ', 'إلى', 'الولدُ', 'المدرسةِ']) // ذهب (0) ✔، والرابعة المدرسة ✔ → ٢
    fireEvent.click(check())
    expect(container.querySelector('.fb.bad')!.textContent).toContain('٢ كلمات بمكانها الصحيح')
    fireEvent.click(screen.getByRole('button', { name: 'من جديد' }))
    build(['ذهبَ', 'المدرسةِ', 'الولدُ', 'إلى']) // ذهب فقط ✔
    fireEvent.click(check())
    expect(container.querySelector('.fb.bad')!.textContent).toContain('كلمة وحدة بمكانها')
  })

  it('«من جديد» يفرّغ البناء ويخفي الرسالة', () => {
    const { container } = render(<Orderer {...base} />)
    build(['المدرسةِ', 'ذهبَ', 'الولدُ', 'إلى'])
    fireEvent.click(check())
    fireEvent.click(screen.getByRole('button', { name: 'من جديد' }))
    expect(container.querySelector('.fb')).toBeNull()
    expect(screen.getByText(/اضغطي على الكلمات بالترتيب الصحيح/)).toBeTruthy()
    expect(container.querySelectorAll('.chips.build .chip')).toHaveLength(0)
  })

  it('الضغط على كلمة في البناء يعيدها للمجموعة', () => {
    const { container } = render(<Orderer {...base} />)
    build(['ذهبَ', 'الولدُ'])
    expect(container.querySelectorAll('.chips.build .chip')).toHaveLength(2)
    fireEvent.click(container.querySelectorAll('.chips.build .chip')[0])
    expect(container.querySelectorAll('.chips.build .chip')).toHaveLength(1)
  })

  it('يقبل ترتيباً بديلاً صحيحاً من alts', () => {
    const onSolved = vi.fn()
    render(<Orderer {...base} alts={[['الولدُ', 'ذهبَ', 'إلى', 'المدرسةِ']]} onSolved={onSolved} />)
    build(['الولدُ', 'ذهبَ', 'إلى', 'المدرسةِ'])
    fireEvent.click(check())
    expect(onSolved).toHaveBeenCalledTimes(1)
  })
})
