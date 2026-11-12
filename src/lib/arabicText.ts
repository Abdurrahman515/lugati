const TASHKEEL = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g
const TATWEEL = /\u0640/g

export function stripTashkeel(s: string) {
  return s.replace(TASHKEEL, '').replace(TATWEEL, '')
}

/** تطبيع قبل المقارنة. hamza=true يوحّد الهمزات والياء/الألف المقصورة والتاء المربوطة. */
export function normalizeArabic(s: string, opts: { hamza?: boolean } = {}) {
  const { hamza = true } = opts
  let r = stripTashkeel(s).replace(/\s+/g, ' ').trim()
  if (hamza) {
    r = r.replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  }
  return r
}

/** exact=true: المهارة إملائية بذاتها فلا تُوحَّد الهمزات ولا التاء ولا الألف المقصورة. */
export function sameAnswer(user: string, answers: string[], exact = false) {
  const u = normalizeArabic(user, { hamza: !exact })
  return answers.some((a) => normalizeArabic(a, { hamza: !exact }) === u)
}

const DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
export function toArabicDigits(n: number | string) {
  return String(n).replace(/[0-9]/g, (d) => DIGITS[Number(d)])
}

export function shuffle<T>(a: T[]): T[] {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}
export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
export const sample = <T,>(a: T[], n: number): T[] => shuffle(a).slice(0, n)

export function hash(s: string) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return 'q' + (h >>> 0).toString(36)
}
