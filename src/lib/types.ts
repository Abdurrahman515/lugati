export type Opt = { t: string; why: string }
export type MC = { kind: 'mc'; id: string; q: string; passage?: string; opts: Opt[]; correct: number }
export type WR = {
  kind: 'wr'; id: string; q: string; passage?: string
  answers: string[]; exact?: boolean
  wrong?: { a: string; why: string }[]
  why: string
}
export type Q = MC | WR

export type Block =
  | { t: 'say'; text: string; emoji?: string }
  | { t: 'reveal'; title: string; text: string }
  | { t: 'widget'; id: string; props: any }
  | { t: 'quiz'; q: Q }
  | { t: 'practice'; gen: string; n: number }
  | { t: 'passage'; title?: string; text: string }

export type LessonKind = 'reading' | 'language' | 'skill'
export type Lesson = {
  id: string
  title: string
  emoji: string
  kind: LessonKind
  blocks: Block[]
  /** معرّفات المولّدات المتجددة المرتبطة بالدرس (تدخل في بنك الاختبارات) */
  gens?: string[]
}
export type Unit = { id: string; title: string; emoji: string; lessons: Lesson[] }
export type Semester = { id: string; title: string; units: Unit[]; exams: ExamConfig[] }
export type ExamConfig = {
  id: string
  title: string
  emoji: string
  kind: 'review' | 'mid' | 'final'
  unitIds: string[]
  n: number
  pass: number // نسبة مئوية
  strict: boolean
  lockHours?: number
  /** بعد أي وحدة يظهر في الصفحة الرئيسية (للمراجعة: داخل الوحدة نفسها) */
  afterUnit?: string
}
