// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { allLessons } from './content/registry'

const go = async (hash: string) => {
  await act(async () => {
    location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

beforeEach(() => {
  localStorage.clear()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  Element.prototype.scrollIntoView = vi.fn()
  location.hash = ''
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

const l0 = allLessons[0]
const l1 = allLessons[1]

describe('App — التوجيه بالـ hash', () => {
  it('بلا hash: الصفحة الرئيسية', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /لغتي الخالدة/ })).toBeTruthy()
  })

  it('#/ : الصفحة الرئيسية', () => {
    location.hash = '#/'
    render(<App />)
    expect(screen.getByRole('heading', { name: /لغتي الخالدة/ })).toBeTruthy()
  })

  it('#/lesson/<id> : يفتح الدرس المطلوب', () => {
    location.hash = '#/lesson/' + l0.id
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(l0.title)
    expect(screen.queryByRole('heading', { name: /لغتي الخالدة/ })).toBeNull()
    expect(screen.getByText(/الجزء ١ من/)).toBeTruthy()
  })

  it('درس غير موجود: يرجع للرئيسية', () => {
    location.hash = '#/lesson/لا-يوجد'
    render(<App />)
    expect(screen.getByRole('heading', { name: /لغتي الخالدة/ })).toBeTruthy()
  })

  it('#/exam/<id> : شاشة بداية الاختبار', () => {
    location.hash = '#/exam/rev-u1'
    render(<App />)
    expect(screen.getByRole('heading', { name: /مراجعة الوحدة الأولى/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /ابدئي الاختبار/ })).toBeTruthy()
  })

  it('اختبار غير موجود: يرجع للرئيسية', () => {
    location.hash = '#/exam/nope'
    render(<App />)
    expect(screen.getByRole('heading', { name: /لغتي الخالدة/ })).toBeTruthy()
  })

  it('#/mistakes : سجل الأخطاء', () => {
    location.hash = '#/mistakes'
    render(<App />)
    expect(screen.getByRole('heading', { name: /سجل الأخطاء/ })).toBeTruthy()
  })

  it('مسار مجهول: الرئيسية', () => {
    location.hash = '#/whatever/else'
    render(<App />)
    expect(screen.getByRole('heading', { name: /لغتي الخالدة/ })).toBeTruthy()
  })
})

describe('App — التنقل', () => {
  it('hashchange ينقل بين الصفحات ويعيد التمرير للأعلى', async () => {
    render(<App />)
    await go('#/mistakes')
    expect(screen.getByRole('heading', { name: /سجل الأخطاء/ })).toBeTruthy()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    await go('#/')
    expect(screen.getByRole('heading', { name: /لغتي الخالدة/ })).toBeTruthy()
  })

  it('الانتقال من درس إلى درس يغيّر العنوان', async () => {
    location.hash = '#/lesson/' + l0.id
    render(<App />)
    await go('#/lesson/' + l1.id)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(l1.title)
  })

  it('يزيل مستمع hashchange عند الإزالة', () => {
    const rm = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<App />)
    unmount()
    expect(rm).toHaveBeenCalledWith('hashchange', expect.any(Function))
  })
})
