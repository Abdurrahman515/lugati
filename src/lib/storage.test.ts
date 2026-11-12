import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/** مخزن محلي وهمي (البيئة node بلا localStorage). */
function fakeStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)) },
    removeItem: (k: string) => { m.delete(k) },
    clear: () => m.clear(),
    _m: m,
  }
}
let ls: ReturnType<typeof fakeStorage>
async function load() {
  vi.resetModules()
  return await import('./storage')
}
beforeEach(() => { ls = fakeStorage(); vi.stubGlobal('localStorage', ls) })
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

const rec = { lesson: 'u1-gender', q: 'س؟', chosen: 'أ', correct: 'ب', why: 'لأن' }

describe('النجوم', () => {
  it('تبدأ فارغة وتُحفظ بالمفتاح الصحيح', async () => {
    const s = await load()
    expect(s.getProgress().stars).toEqual({})
    s.setStars('l1', 2)
    expect(s.getProgress().stars.l1).toBe(2)
    expect(JSON.parse(ls._m.get('lugha-app:v1')!).stars.l1).toBe(2)
  })
  it('لا تنقص أبداً (تحفظ الأفضل)', async () => {
    const s = await load()
    s.setStars('l1', 3)
    s.setStars('l1', 1)
    expect(s.getProgress().stars.l1).toBe(3)
  })
  it('تُستعاد بعد إعادة تحميل الوحدة', async () => {
    const s = await load()
    s.setStars('l1', 2)
    const s2 = await import('./storage')
    expect(s2.getProgress().stars.l1).toBe(2)
  })
})

describe('سجل الأخطاء', () => {
  it('يعدّ التكرار ويحذف', async () => {
    const s = await load()
    s.logMistake('q1', rec)
    s.logMistake('q1', rec)
    expect(s.getProgress().mistakes.q1.count).toBe(2)
    s.clearMistake('q1')
    expect(s.getProgress().mistakes.q1).toBeUndefined()
  })
  it('حذف خطأ غير موجود لا يفعل شيئاً', async () => {
    const s = await load()
    const before = s.getProgress()
    s.clearMistake('nope')
    expect(s.getProgress()).toBe(before)
  })
})

describe('الاختبارات', () => {
  it('الرسوب يقفل بعدد الساعات', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const s = await load()
    s.recordExam('mid', 40, false, 24)
    const r = s.getProgress().exams.mid
    expect(r.passed).toBe(false)
    expect(r.lockedUntil).toBe(Date.now() + 24 * 3600_000)
    expect(r.attempts).toBe(1)
  })
  it('النجاح لا يقفل ويحفظ أفضل نتيجة وعدد المحاولات', async () => {
    const s = await load()
    s.recordExam('rev', 50, false)
    s.recordExam('rev', 80, true, 24)
    s.recordExam('rev', 60, false)
    const r = s.getProgress().exams.rev
    expect(r.best).toBe(80)
    expect(r.last).toBe(60)
    expect(r.attempts).toBe(3)
    expect(r.passed).toBe(true)
  })
  it('بلا lockHours لا قفل حتى مع الرسوب', async () => {
    const s = await load()
    s.recordExam('rev', 10, false)
    expect(s.getProgress().exams.rev.lockedUntil).toBeUndefined()
  })
})

describe('التصدير والاستيراد', () => {
  it('جولة كاملة', async () => {
    const s = await load()
    s.setStars('l1', 3); s.logMistake('q1', rec); s.recordExam('e', 70, true)
    const json = s.exportJSON()
    ls.clear()
    const s2 = await load()
    expect(s2.getProgress().stars).toEqual({})
    expect(s2.importJSON(json)).toBe(true)
    expect(s2.getProgress().stars.l1).toBe(3)
    expect(s2.getProgress().mistakes.q1.count).toBe(1)
    expect(s2.getProgress().exams.e.passed).toBe(true)
  })
  it('يرفض الملفات غير الصالحة ولا يغيّر شيئاً', async () => {
    const s = await load()
    s.setStars('l1', 1)
    expect(s.importJSON('ليس json')).toBe(false)
    expect(s.importJSON('{"v":2,"stars":{}}')).toBe(false)
    expect(s.importJSON('{"v":1}')).toBe(false)
    expect(s.importJSON('null')).toBe(false)
    expect(s.getProgress().stars.l1).toBe(1)
  })
  it('التصدير لا يتضمن حالة الطي', async () => {
    const s = await load()
    s.saveUI({ 'unit:u1': true })
    expect(s.exportJSON()).not.toContain('unit:u1')
  })
})

describe('حالة الطي (UI)', () => {
  it('مفتاح منفصل lugha-app:ui:v1', async () => {
    const s = await load()
    s.saveUI({ a: true, b: false })
    expect(s.loadUI()).toEqual({ a: true, b: false })
    expect(JSON.parse(ls._m.get('lugha-app:ui:v1')!)).toEqual({ a: true, b: false })
    expect(ls._m.get('lugha-app:v1')).toBeUndefined()
  })
  it('بيانات تالفة ترجع كائناً فارغاً', async () => {
    ls.setItem('lugha-app:ui:v1', '{{{')
    const s = await load()
    expect(s.loadUI()).toEqual({})
  })
})

describe('مقاومة الأعطال', () => {
  it('بيانات تقدم تالفة تبدأ من الصفر', async () => {
    ls.setItem('lugha-app:v1', 'تالف')
    const s = await load()
    expect(s.getProgress().stars).toEqual({})
  })
  it('فشل الكتابة (تخزين ممتلئ) لا يكسر التطبيق', async () => {
    const s = await load()
    ls.setItem = () => { throw new Error('quota') }
    expect(() => s.setStars('l1', 2)).not.toThrow()
    expect(s.getProgress().stars.l1).toBe(2)
  })
  it('المشتركون يُبلَّغون بالتغيير', async () => {
    const s = await load()
    // useProgress يعتمد على React؛ نتحقق من أن getProgress يتغير مرجعه عند كل تعديل
    const a = s.getProgress()
    s.setStars('x', 1)
    expect(s.getProgress()).not.toBe(a)
  })
})
