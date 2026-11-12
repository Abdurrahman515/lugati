import { pick } from './arabicText'

/** عبارات التشجيع عند الجواب الصحيح (فصحى مبسطة بلمسة سورية، بصيغة المؤنث). */
export const PRAISE = ['هيك بدها 👏', 'أحسنتِ! 🌟', 'كفو عليكِ 💪', 'أسطورة 🏆', 'يسلمو إيديكِ 🙌']
/** عبارات الدعم عند الخطأ (لا تكشف الجواب). */
export const RETRY = ['لأ، مو هيك 🤔 جرّبي كمان مرة', 'قريبة! فكّري شوي وجرّبي تاني 💭', 'ولا يهمّك، حاولي مرة تانية 💪']

export const randomPraise = () => pick(PRAISE)
export const randomRetry = () => pick(RETRY)

/** ثلاث خانات دائماً: ⭐⭐☆ */
export const starsText = (n: number) => '⭐'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n))

/** يحذف بادئة «صحيح:» الآتية من المولّدات (تكفي عبارة التشجيع). */
export const cleanWhy = (s: string) => s.replace(/^صحيح:\s*/, '')

/**
 * تفسير الخيار الخاطئ دون كشف الجواب: المولّدات تكتب «…. أما «س» فهو كذا…»
 * وما بعد «أما» يكشف الصحيح، فنقتطع عندها.
 */
export function hintOnly(why: string): string {
  const m = why.search(/(^|[\s.؛،:])أما\s/)
  const cut = m >= 0 ? why.slice(0, m) : why
  const t = cut.replace(/[\s؛،:]+$/, '').trim()
  return t.length >= 3 ? t : ''
}

/** عدد نجوم الدرس من الإجابات الصحيحة من أول محاولة (٩٠٪ → ٣، ٧٠٪ → ٢، غير ذلك → ١، ولا أسئلة → ٣). */
export function starsFor(right: number, total: number): 1 | 2 | 3 {
  if (total <= 0) return 3
  const r = right / total
  return r >= 0.9 ? 3 : r >= 0.7 ? 2 : 1
}
