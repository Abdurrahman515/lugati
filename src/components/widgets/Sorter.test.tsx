// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Sorter } from './Sorter'
import { PRAISE } from '../../lib/feedback'

afterEach(cleanup)

const cats = ['اسم', 'فعل']
const items = [
  { t: 'كتاب', c: 0, why: 'يدل على شيء.' },
  { t: 'كتب', c: 1, why: 'يدل على حدث.' },
]
const chip = (n: string) => screen.getByRole('button', { name: n }) as HTMLButtonElement
const bucket = (c: HTMLElement, i: number) => c.querySelectorAll('.bucket')[i] as HTMLButtonElement

describe('Sorter — نشاط التصنيف', () => {
  it('يعرض العنوان والكلمات والخانات', () => {
    const { container } = render(<Sorter title="صنّفي" cats={cats} items={items} />)
    expect(screen.getByText('صنّفي')).toBeTruthy()
    expect(chip('كتاب')).toBeTruthy()
    expect(chip('كتب')).toBeTruthy()
    expect(container.querySelectorAll('.bucket')).toHaveLength(2)
  })

  it('الضغط على خانة دون اختيار كلمة: طلب اختيار كلمة أولاً', () => {
    const { container } = render(<Sorter cats={cats} items={items} />)
    fireEvent.click(bucket(container, 0))
    expect(container.querySelector('.fb.bad')!.textContent).toContain('اختاري كلمة أولاً')
  })

  it('خانة خاطئة: رسالة لا تكشف الخانة الصحيحة، وتبقى الكلمة', () => {
    const { container } = render(<Sorter cats={cats} items={items} />)
    fireEvent.click(chip('كتاب'))
    fireEvent.click(bucket(container, 1))
    const t = container.querySelector('.fb.bad')!.textContent!
    expect(t).toContain('«كتاب» مش من خانة «فعل»')
    expect(t).not.toContain('يدل على شيء.')
    expect(chip('كتاب')).toBeTruthy()
  })

  it('خانة صحيحة: تشجيع وتفسير، وتنتقل الكلمة إلى الخانة', () => {
    const { container } = render(<Sorter cats={cats} items={items} />)
    fireEvent.click(chip('كتاب'))
    fireEvent.click(bucket(container, 0))
    const ok = container.querySelector('.fb.ok')!
    expect(PRAISE.some((p) => ok.textContent!.includes(p))).toBe(true)
    expect(ok.textContent).toContain('يدل على شيء.')
    expect(screen.queryByRole('button', { name: 'كتاب' })).toBeNull()
    expect(bucket(container, 0).querySelector('.chip.done')!.textContent).toBe('كتاب')
  })

  it('اختيار كلمة جديدة يمسح الرسالة السابقة', () => {
    const { container } = render(<Sorter cats={cats} items={items} />)
    fireEvent.click(chip('كتاب')); fireEvent.click(bucket(container, 1))
    expect(container.querySelector('.fb')).not.toBeNull()
    fireEvent.click(chip('كتب'))
    expect(container.querySelector('.fb')).toBeNull()
  })

  it('تصنيف الكل: رسالة إتمام وonSolved مرة واحدة فقط', () => {
    const onSolved = vi.fn()
    const { container } = render(<Sorter cats={cats} items={items} onSolved={onSolved} />)
    fireEvent.click(chip('كتاب')); fireEvent.click(bucket(container, 0))
    expect(onSolved).not.toHaveBeenCalled()
    fireEvent.click(chip('كتب')); fireEvent.click(bucket(container, 1))
    expect(screen.getByText(/صنّفتِ كل الكلمات/)).toBeTruthy()
    expect(onSolved).toHaveBeenCalledTimes(1)
  })
})
