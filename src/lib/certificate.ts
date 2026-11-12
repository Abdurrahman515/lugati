/// <reference types="vite/client" />
/* توليد شهادة الشكر والتقدير محلياً (دون اتصال): رسم على canvas بخط Tajawal ثم حفظه في PDF أفقي A4.
 * الرسم على canvas يضمن وصل الحروف العربية وتشكيلها بدقة، ولا يحتاج أي طلب شبكة. */
import tajawalBoldUrl from '@fontsource/tajawal/files/tajawal-arabic-700-normal.woff2?url'
import tajawalRegularUrl from '@fontsource/tajawal/files/tajawal-arabic-400-normal.woff2?url'

/** مقاس A4 أفقي بدقة ٣٠٠ نقطة في البوصة. */
export const CERT_W = 3508
export const CERT_H = 2480
export const CERT_FAMILY = 'LughaCertTajawal'
export const NAME_MIN = 2
export const NAME_MAX = 40

const PINK = { deep: '#b8184f', main: '#d6336c', soft: '#f06595', light: '#faa2c1', pale: '#ffdeeb', bg1: '#fffafc', bg2: '#ffe8f1', ink: '#5c2a41' }

/** ينظّف الاسم: يزيل المسافات الزائدة ويوحّدها. يرجع null إن لم يصلح. */
export function sanitizeName(raw: string): string | null {
  const s = raw.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim()
  if (s.length < NAME_MIN || s.length > NAME_MAX) return null
  return s
}

/** اسم ملف آمن للتنزيل. */
export function certFileName(name: string): string {
  const safe = name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-')
  return `شهادة-شكر-وتقدير-${safe}.pdf`
}

/** نصوص الشهادة: لا درجة ولا خانة توقيع، فقط شكر وتقدير. */
export function certificateText(examTitle: string) {
  return {
    title: 'شهادة شكر وتقدير',
    lead: 'تُقدَّم هذه الشهادة إلى الطالبة المتميزة',
    body: 'شكراً وتقديراً لجهدها واجتهادها، ولنجاحها في',
    exam: examTitle,
    closing: 'نتمنى لكِ دوام التوفيق والتميّز',
  }
}

/** أكبر حجم خط (بين min وstart) يجعل النص داخل العرض المسموح. measure(px) ترجع عرض النص بهذا الحجم. */
export function fitFontSize(measure: (px: number) => number, maxWidth: number, start: number, min: number): number {
  let px = start
  while (px > min && measure(px) > maxWidth) px -= 4
  return Math.max(px, min)
}

type Ctx = CanvasRenderingContext2D

function flower(ctx: Ctx, cx: number, cy: number, r: number, petals: number, fill: string, center: string) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = fill
  for (let i = 0; i < petals; i++) {
    ctx.save()
    ctx.rotate((i * 2 * Math.PI) / petals)
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.55, r * 0.28, r * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle = center
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function star(ctx: Ctx, cx: number, cy: number, rOut: number, rIn: number, points: number) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn
    const a = (Math.PI * i) / points - Math.PI / 2
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a)
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function corner(ctx: Ctx, x: number, y: number, sx: number, sy: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sx, sy)
  ctx.strokeStyle = PINK.soft
  ctx.lineWidth = 8
  for (const r of [110, 160, 210]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI / 2); ctx.stroke() }
  flower(ctx, 70, 70, 80, 8, PINK.light, PINK.main)
  ctx.restore()
}

function divider(ctx: Ctx, cx: number, y: number, half: number) {
  ctx.save()
  ctx.strokeStyle = PINK.soft
  ctx.lineWidth = 6
  ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - 60, y); ctx.moveTo(cx + 60, y); ctx.lineTo(cx + half, y); ctx.stroke()
  ctx.fillStyle = PINK.main
  ctx.beginPath(); ctx.moveTo(cx, y - 28); ctx.lineTo(cx + 28, y); ctx.lineTo(cx, y + 28); ctx.lineTo(cx - 28, y); ctx.closePath(); ctx.fill()
  ctx.restore()
}

/** يرسم الشهادة كاملة. الخط يجب أن يكون محمّلاً قبل الاستدعاء. */
export function drawCertificate(ctx: Ctx, name: string, examTitle: string): void {
  const t = certificateText(examTitle)
  const cx = CERT_W / 2

  const g = ctx.createLinearGradient(0, 0, 0, CERT_H)
  g.addColorStop(0, PINK.bg1); g.addColorStop(1, PINK.bg2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CERT_W, CERT_H)

  ctx.strokeStyle = PINK.main; ctx.lineWidth = 22
  ctx.strokeRect(80, 80, CERT_W - 160, CERT_H - 160)
  ctx.strokeStyle = PINK.light; ctx.lineWidth = 8
  ctx.strokeRect(140, 140, CERT_W - 280, CERT_H - 280)
  corner(ctx, 140, 140, 1, 1); corner(ctx, CERT_W - 140, 140, -1, 1)
  corner(ctx, 140, CERT_H - 140, 1, -1); corner(ctx, CERT_W - 140, CERT_H - 140, -1, -1)

  // وسام علوي
  ctx.fillStyle = PINK.pale; ctx.strokeStyle = PINK.main; ctx.lineWidth = 10
  ctx.beginPath(); ctx.arc(cx, 380, 130, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.fillStyle = PINK.main; star(ctx, cx, 380, 95, 45, 8); ctx.fill()
  ctx.fillStyle = PINK.pale; star(ctx, cx, 380, 40, 18, 8); ctx.fill()

  ctx.direction = 'rtl'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = PINK.deep
  ctx.font = `700 270px ${CERT_FAMILY}`
  ctx.fillText(t.title, cx, 760)
  divider(ctx, cx, 860, 900)

  ctx.fillStyle = PINK.ink
  ctx.font = `400 112px ${CERT_FAMILY}`
  ctx.fillText(t.lead, cx, 1040)

  const maxName = CERT_W - 700
  const namePx = fitFontSize((px) => { ctx.font = `700 ${px}px ${CERT_FAMILY}`; return ctx.measureText(name).width }, maxName, 300, 120)
  ctx.font = `700 ${namePx}px ${CERT_FAMILY}`
  ctx.fillStyle = PINK.main
  ctx.fillText(name, cx, 1340)
  const nameW = Math.min(maxName, Math.max(1500, ctx.measureText(name).width + 300))
  ctx.strokeStyle = PINK.light; ctx.lineWidth = 8
  ctx.beginPath(); ctx.moveTo(cx - nameW / 2, 1410); ctx.lineTo(cx + nameW / 2, 1410); ctx.stroke()

  ctx.fillStyle = PINK.ink
  ctx.font = `400 112px ${CERT_FAMILY}`
  ctx.fillText(t.body, cx, 1640)
  const examPx = fitFontSize((px) => { ctx.font = `700 ${px}px ${CERT_FAMILY}`; return ctx.measureText(t.exam).width }, CERT_W - 700, 170, 90)
  ctx.font = `700 ${examPx}px ${CERT_FAMILY}`
  ctx.fillStyle = PINK.deep
  ctx.fillText(t.exam, cx, 1850)

  flower(ctx, cx - 800, 2090, 70, 8, PINK.light, PINK.main)
  flower(ctx, cx + 800, 2090, 70, 8, PINK.light, PINK.main)
  ctx.fillStyle = PINK.ink
  ctx.font = `400 100px ${CERT_FAMILY}`
  ctx.fillText(t.closing, cx, 2120)
}

let fontReady: Promise<void> | null = null
/** يحمّل خط Tajawal من حزمة npm المضمّنة في التطبيق (لا اتصال بالإنترنت). */
export function loadCertFonts(): Promise<void> {
  if (!fontReady) {
    fontReady = (async () => {
      const faces = [
        new FontFace(CERT_FAMILY, `url(${tajawalBoldUrl})`, { weight: '700' }),
        new FontFace(CERT_FAMILY, `url(${tajawalRegularUrl})`, { weight: '400' }),
      ]
      for (const f of faces) { await f.load(); document.fonts.add(f) }
    })().catch((e) => { fontReady = null; throw e })
  }
  return fontReady
}

type CanvasLike = { toDataURL(type?: string, quality?: number): string }

/** يضع صورة الشهادة في صفحة PDF أفقية A4 تملأها كاملة. */
export async function canvasToPdf(canvas: CanvasLike): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210)
  return pdf.output('blob')
}

/** المسار الكامل: تحميل الخط ← رسم ← PDF. */
export async function makeCertificatePdf(name: string, examTitle: string): Promise<Blob> {
  await loadCertFonts()
  const canvas = document.createElement('canvas')
  canvas.width = CERT_W
  canvas.height = CERT_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas غير متاح')
  drawCertificate(ctx, name, examTitle)
  return canvasToPdf(canvas)
}

/** ينزّل ملف PDF للشهادة. */
export async function downloadCertificate(name: string, examTitle: string): Promise<void> {
  const blob = await makeCertificatePdf(name, examTitle)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = certFileName(name)
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}
