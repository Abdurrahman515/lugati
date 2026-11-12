// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ExamConfig } from '../lib/types'

const download = vi.fn(async (_n: string, _t: string) => {})
vi.mock('../lib/certificate', async (orig) => ({ ...(await orig<typeof import('../lib/certificate')>()), downloadCertificate: (n: string, t: string) => download(n, t) }))

import { CertificatePanel } from './CertificatePanel'

const exam: ExamConfig = { id: 'mid-x', title: 'اختبار منتصف الفصل الدراسي الثاني', emoji: '🎯', kind: 'mid', unitIds: [], n: 30, pass: 60, strict: true, lockHours: 24 }
const open = () => fireEvent.click(screen.getByRole('button', { name: /شهادة شكر وتقدير/ }))
const input = () => screen.getByLabelText('اسم الطالبة') as HTMLInputElement
const go = () => screen.getByRole('button', { name: /اطبعي الشهادة|عم تتجهّز/ }) as HTMLButtonElement

beforeEach(() => download.mockClear())
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('CertificatePanel', () => {
  it('مغلق افتراضياً، ويفتح النموذج بالضغط', () => {
    render(<CertificatePanel exam={exam} />)
    expect(screen.queryByLabelText('اسم الطالبة')).toBeNull()
    open()
    expect(input()).toBeTruthy()
    expect(go().disabled).toBe(true)
  })
  it('لا يعمل الزر باسم فارغ أو بحرف واحد، ويُظهر تلميحاً', () => {
    render(<CertificatePanel exam={exam} />)
    open()
    fireEvent.change(input(), { target: { value: 'س' } })
    expect(go().disabled).toBe(true)
    expect(screen.getByText(/حرفين على الأقل/)).toBeTruthy()
  })
  it('اسم صالح: يستدعي التوليد بالاسم المنظَّف وعنوان الاختبار ويعرض رسالة النجاح', async () => {
    render(<CertificatePanel exam={exam} />)
    open()
    fireEvent.change(input(), { target: { value: '  سارة   محمد ' } })
    fireEvent.click(go())
    await waitFor(() => expect(screen.getByText(/نزل ملف الشهادة/)).toBeTruthy())
    expect(download).toHaveBeenCalledWith('سارة محمد', exam.title)
  })
  it('Enter يطبع الشهادة أيضاً', async () => {
    render(<CertificatePanel exam={exam} />)
    open()
    fireEvent.change(input(), { target: { value: 'ريم' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1))
  })
  it('فشل التوليد: رسالة خطأ ودون انهيار', async () => {
    download.mockRejectedValueOnce(new Error('x'))
    render(<CertificatePanel exam={exam} />)
    open()
    fireEvent.change(input(), { target: { value: 'ريم' } })
    fireEvent.click(go())
    await waitFor(() => expect(screen.getByText(/صار خطأ/)).toBeTruthy())
  })
  it('تعديل الاسم بعد النجاح يعيد الحالة للبداية', async () => {
    render(<CertificatePanel exam={exam} />)
    open()
    fireEvent.change(input(), { target: { value: 'ريم' } })
    fireEvent.click(go())
    await waitFor(() => expect(screen.getByText(/نزل ملف الشهادة/)).toBeTruthy())
    fireEvent.change(input(), { target: { value: 'ريماس' } })
    expect(screen.queryByText(/نزل ملف الشهادة/)).toBeNull()
  })
})
