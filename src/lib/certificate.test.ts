/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { CERT_FAMILY, CERT_H, CERT_W, NAME_MAX, canvasToPdf, certFileName, certificateText, drawCertificate, fitFontSize, sanitizeName } from './certificate'

describe('sanitizeName', () => {
  it('يوحّد المسافات ويقصّ الأطراف', () => expect(sanitizeName('  سارة   محمد \n')).toBe('سارة محمد'))
  it('يرفض الفارغ والحرف الواحد والطويل جداً', () => {
    expect(sanitizeName('')).toBeNull()
    expect(sanitizeName('   ')).toBeNull()
    expect(sanitizeName('س')).toBeNull()
    expect(sanitizeName('ا'.repeat(NAME_MAX + 1))).toBeNull()
    expect(sanitizeName('ا'.repeat(NAME_MAX))).not.toBeNull()
  })
  it('يحذف محارف التحكم', () => expect(sanitizeName('سا\u0000رة')).toBe('سا رة'))
})

describe('certFileName / certificateText', () => {
  it('اسم الملف ينتهي بـ .pdf ولا يحوي محارف ممنوعة في أسماء الملفات', () => {
    const f = certFileName('سارة / محمد:*؟')
    expect(f.endsWith('.pdf')).toBe(true)
    expect(f).not.toMatch(/[\\/:*?"<>|]/)
  })
  it('نص الشهادة شكر وتقدير فقط: لا درجة ولا توقيع ولا أرقام', () => {
    const all = Object.values(certificateText('اختبار منتصف الفصل الدراسي الثاني')).join(' ')
    expect(all).toContain('شهادة شكر وتقدير')
    expect(all).toContain('اختبار منتصف الفصل الدراسي الثاني')
    expect(all).not.toMatch(/درجة|علامة|توقيع|التوقيع|المدير|٪|%|[0-9٠-٩]/)
  })
})

describe('fitFontSize', () => {
  it('يبقى الحجم الأقصى إن اتسع النص', () => expect(fitFontSize((px) => px * 2, 1000, 300, 100)).toBe(300))
  it('يصغّر حتى يتسع', () => {
    const px = fitFontSize((p) => p * 10, 2000, 300, 100)
    expect(px * 10).toBeLessThanOrEqual(2000)
    expect(px).toBeGreaterThanOrEqual(100)
  })
  it('لا ينزل عن الحد الأدنى', () => expect(fitFontSize((p) => p * 1000, 10, 300, 120)).toBe(120))
})

/** ctx وهمي يسجّل ما يُرسم، لفحص مواضع النصوص دون متصفح. */
function fakeCtx() {
  const texts: { t: string; x: number; y: number; font: string; dir: string; align: string }[] = []
  const grad = { addColorStop() {} }
  const ctx: any = {
    font: '', direction: '', textAlign: '', fillStyle: '', strokeStyle: '', lineWidth: 0, textBaseline: '',
    fillText(t: string, x: number, y: number) { texts.push({ t, x, y, font: ctx.font, dir: ctx.direction, align: ctx.textAlign }) },
    measureText: (t: string) => ({ width: t.length * (parseInt(/(\d+)px/.exec(ctx.font)?.[1] ?? '10') * 0.5) }),
    createLinearGradient: () => grad,
  }
  for (const m of ['fillRect', 'strokeRect', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'ellipse', 'fill', 'stroke', 'save', 'restore', 'translate', 'rotate', 'scale']) ctx[m] = () => {}
  return { ctx, texts }
}

describe('drawCertificate', () => {
  it('يرسم العنوان والاسم واسم الاختبار بخط Tajawal من اليمين لليسار وفي المنتصف', () => {
    const { ctx, texts } = fakeCtx()
    drawCertificate(ctx, 'سارة العتيبي', 'اختبار نهاية العام الدراسي')
    const got = texts.map((x) => x.t)
    expect(got).toContain('شهادة شكر وتقدير')
    expect(got).toContain('سارة العتيبي')
    expect(got).toContain('اختبار نهاية العام الدراسي')
    for (const x of texts) {
      expect(x.dir).toBe('rtl')
      expect(x.align).toBe('center')
      expect(x.x).toBe(CERT_W / 2)
      expect(x.y).toBeLessThan(CERT_H)
      expect(x.font).toContain(CERT_FAMILY)
    }
  })
  it('الاسم الطويل يُصغَّر ليبقى داخل الإطار', () => {
    const { ctx, texts } = fakeCtx()
    const name = 'ا'.repeat(NAME_MAX)
    drawCertificate(ctx, name, 'اختبار منتصف الفصل الدراسي الأول')
    const n = texts.find((x) => x.t === name)!
    const px = parseInt(/(\d+)px/.exec(n.font)![1])
    expect(px).toBeLessThan(300)
    expect(px * 0.5 * name.length).toBeLessThanOrEqual(CERT_W - 700)
  })
})

describe('canvasToPdf', () => {
  // صورة JPEG صغيرة صالحة
  const JPG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=' 
  it('يُخرج PDF صالحاً بصفحة واحدة أفقية A4', async () => {
    const blob = await canvasToPdf({ toDataURL: () => JPG })
    expect(blob.type).toBe('application/pdf')
    const txt = Buffer.from(await blob.arrayBuffer()).toString('latin1')
    expect(txt.startsWith('%PDF')).toBe(true)
    expect(txt.match(/\/Type\s*\/Page\b/g)).toHaveLength(1)
    const mb = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(txt)!
    expect(Number(mb[1])).toBeGreaterThan(Number(mb[2])) // عرض > ارتفاع: أفقي
    expect(Number(mb[1])).toBeCloseTo(841.89, 1)
    expect(Number(mb[2])).toBeCloseTo(595.28, 1)
  })
})

// رسم حقيقي بمحرك Skia إن توفرت @napi-rs/canvas (devDependency اختيارية)
const napi = await import('@napi-rs/canvas').catch(() => null)
describe.skipIf(!napi)('رسم حقيقي بخط Tajawal', () => {
  it('يرسم صورة بالمقاس الكامل غير فارغة، وتتحول إلى PDF أفقي', async () => {
    const { createCanvas, GlobalFonts } = napi!
    const dir = new URL('../../node_modules/@fontsource/tajawal/files/', import.meta.url).pathname
    GlobalFonts.registerFromPath(dir + 'tajawal-arabic-700-normal.woff2', CERT_FAMILY)
    GlobalFonts.registerFromPath(dir + 'tajawal-arabic-400-normal.woff2', CERT_FAMILY)
    const c = createCanvas(CERT_W, CERT_H)
    drawCertificate(c.getContext('2d') as any, 'سارة محمد العتيبي', 'اختبار منتصف الفصل الدراسي الثاني')
    expect(c.width).toBe(CERT_W)
    const px = c.getContext('2d').getImageData(CERT_W / 2, 700, 400, 120).data
    const colors = new Set<number>()
    for (let i = 0; i < px.length; i += 4) colors.add((px[i] << 16) | (px[i + 1] << 8) | px[i + 2])
    expect(colors.size).toBeGreaterThan(5) // نص مرسوم فوق الخلفية
    const blob = await canvasToPdf({ toDataURL: (t, q) => c.toDataURL(t as 'image/jpeg', (q ?? 0.9) * 100) })
    expect(blob.size).toBeGreaterThan(20_000)
  })
})
