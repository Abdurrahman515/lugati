/// <reference types="vite/client" />
/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// كل ملفات المصدر (عدا الاختبارات) كنص خام
const raw = import.meta.glob('/src/**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const files = Object.entries(raw).filter(([p]) => !p.endsWith('.test.ts') && !p.endsWith('.test.tsx'))
const pkgRaw = (import.meta.glob('/package.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>)['/package.json']
const only = (ext: RegExp) => files.filter(([p]) => ext.test(p))

describe('قواعد المشروع', () => {
  it('RTL: لا dir="ltr" ولا direction: ltr في أي ملف', () => {
    for (const [p, src] of files) {
      expect(src, p).not.toMatch(/dir\s*=\s*["'{]\s*["']?ltr/i)
      expect(src, p).not.toMatch(/direction\s*:\s*ltr/i)
    }
  })
  it('لا اعتماد على الصوت (speechSynthesis)', () => {
    for (const [p, src] of files) expect(src, p).not.toMatch(/speechSynthesis|SpeechSynthesisUtterance/)
  })
  it('localStorage يُستعمل في storage.ts فقط', () => {
    for (const [p, src] of only(/\.(ts|tsx)$/)) if (!p.endsWith('/lib/storage.ts')) expect(src, p).not.toMatch(/localStorage/)
  })
  it('مفاتيح التخزين المعتمدة موجودة', () => {
    const st = raw['/src/lib/storage.ts']
    expect(st).toContain('lugha-app:v1')
    expect(st).toContain('lugha-app:ui:v1')
  })
  it('لا تكرار لدوال التطبيع: stripTashkeel معرّفة في arabicText.ts فقط', () => {
    for (const [p, src] of only(/\.(ts|tsx)$/)) if (!p.endsWith('/lib/arabicText.ts')) expect(src, p).not.toMatch(/(function|const)\s+stripTashkeel/)
  })
  it('لا عبارات فصحى جافة في واجهة الـ feedback', () => {
    for (const p of ['/src/components/QuizCard.tsx', '/src/components/Practice.tsx', '/src/components/widgets/Highlighter.tsx', '/src/components/widgets/Orderer.tsx', '/src/components/widgets/Sorter.tsx']) {
      expect(raw[p], p).not.toMatch(/ليست هذه الإجابة|ليس تماماً|فكّري مرة أخرى|انتهت الجولة/)
    }
  })
  it('القيم الرقمية الظاهرة تمر عبر toArabicDigits في العروض الأساسية', () => {
    for (const p of ['/src/components/LessonView.tsx', '/src/components/Practice.tsx']) expect(raw[p], p).toContain('toArabicDigits')
  })
  it('لا تعتمد الأدوات الجديدة على مكتبات غير مثبتة (framer-motion/lucide/react فقط)', () => {
    const ok = /^(react|react-dom|react-dom\/client|framer-motion|lucide-react|vitest|vite|\.|\/)/
    for (const [p, src] of only(/\.(ts|tsx)$/)) {
      const okCert = /^@fontsource\/tajawal\/files\/tajawal-arabic-(400|700)-normal\.woff2\?url$/
      for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        if (p === '/src/lib/certificate.ts' && okCert.test(m[1])) continue
        expect(m[1], `${p}: ${m[1]}`).toMatch(ok)
      }
    }
  })
  it('الخط: النسخ (Noto Naskh Arabic) هو الخط الوحيد، ويُعرَّف مرة واحدة في index.css', () => {
    // vitest لا يعيد نص CSS عبر ?raw، فنقرأه من القرص
    const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8')
    expect(css).toMatch(/--font\s*:\s*'Noto Naskh Arabic'/)
    expect(css).toMatch(/body\{[^}]*font-family:var\(--font\)/)
    expect(css).toMatch(/button,input,textarea,select\{font-family:inherit\}/)
    for (const [p, src] of files) {
      const decls = src.match(/font-family\s*:[^;}]+/g) ?? []
      if (p !== '/src/App.css') expect(decls, p).toHaveLength(0)
      // خط الشهادة (Tajawal) محصور في src/lib/certificate.ts، ولا يمس خط التطبيق
      if (p === '/src/lib/certificate.ts') continue
      expect(src, p).not.toMatch(/fontFamily|Tajawal|Segoe UI|sans-serif/i)
    }
    const own = css.match(/font-family\s*:[^;}]+/g) ?? []
    expect(own.filter((d) => !/var\(--font\)|inherit/.test(d))).toEqual([])
    expect(css).not.toMatch(/Tajawal|Segoe UI|sans-serif/i)
  })
  it('الخط: main.tsx يستورد خط النسخ من الحزمة (يعمل دون اتصال)، وpackage.json يعلنه اعتمادية', () => {
    const main = raw['/src/main.tsx']
    for (const f of ['arabic-400', 'arabic-700']) expect(main).toContain(`@fontsource/noto-naskh-arabic/${f}.css`)
    const pkg = JSON.parse(pkgRaw) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@fontsource/noto-naskh-arabic']).toBeDefined()
  })
  it('الشهادة: Tajawal وjspdf اعتماديتان مثبتتان، وTajawal لا يظهر إلا في وحدة الشهادة', () => {
    const pkg = JSON.parse(pkgRaw) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@fontsource/tajawal']).toBe('5.3.0') // إصدار مثبّت بدقة (بلا ^ أو ~)
    expect(pkg.dependencies['jspdf']).toBeDefined()
    const cert = raw['/src/lib/certificate.ts']
    expect(cert).toContain('@fontsource/tajawal/files/tajawal-arabic-700-normal.woff2')
    expect(cert).toContain('@fontsource/tajawal/files/tajawal-arabic-400-normal.woff2')
    expect(cert).toMatch(/orientation:\s*'landscape'/)
    expect(cert).not.toMatch(/https?:\/\//) // لا طلبات شبكة: التوليد محلي بالكامل
    for (const [p, src] of files) if (p !== '/src/lib/certificate.ts') expect(src, p).not.toMatch(/Tajawal/i)
  })
})
