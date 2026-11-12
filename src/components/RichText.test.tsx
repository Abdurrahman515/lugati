// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { RichText } from './RichText'

afterEach(cleanup)

describe('RichText', () => {
  it('يعرض النص العادي في فقرة واحدة', () => {
    const { container } = render(<RichText text="جملة بسيطة" />)
    expect(container.querySelectorAll('p')).toHaveLength(1)
    expect(container.textContent).toBe('جملة بسيطة')
  })

  it('**تغليظ** يصير strong دون الأقواس', () => {
    const { container } = render(<RichText text="هذا **مهم** جداً" />)
    const s = container.querySelector('strong')
    expect(s?.textContent).toBe('مهم')
    expect(container.textContent).toBe('هذا مهم جداً')
  })

  it('[[تمييز]] يصير mark.hl دون الأقواس', () => {
    const { container } = render(<RichText text="ابحثي عن [[الفاعل]] هنا" />)
    const m = container.querySelector('mark.hl')
    expect(m?.textContent).toBe('الفاعل')
    expect(container.textContent).toBe('ابحثي عن الفاعل هنا')
  })

  it('يدعم عدة علامات في السطر نفسه', () => {
    const { container } = render(<RichText text="**أ** و[[ب]] و**ج**" />)
    expect(container.querySelectorAll('strong')).toHaveLength(2)
    expect(container.querySelectorAll('mark.hl')).toHaveLength(1)
  })

  it('كل سطر فقرة، والسطر الفارغ فقرة gap', () => {
    const { container } = render(<RichText text={'سطر ١\n\nسطر ٢'} />)
    const ps = container.querySelectorAll('p')
    expect(ps).toHaveLength(3)
    expect(ps[0].className).toBe('')
    expect(ps[1].className).toBe('gap')
    expect(ps[2].textContent).toBe('سطر ٢')
  })

  it('النجمتان غير المغلقتين تبقيان كنص عادي', () => {
    const { container } = render(<RichText text="نص ** مفتوح" />)
    expect(container.querySelector('strong')).toBeNull()
    expect(container.textContent).toBe('نص ** مفتوح')
  })

  it('لا يُدخل HTML خاماً (يُعرض كنص)', () => {
    const { container } = render(<RichText text="<b>x</b>" />)
    expect(container.querySelector('b')).toBeNull()
    expect(container.textContent).toBe('<b>x</b>')
  })
})
