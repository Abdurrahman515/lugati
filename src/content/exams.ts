import type { ExamConfig, Lesson, Q } from '../lib/types'
import { allLessons, SEMESTERS } from './registry'
import { genSet } from './generators'
import { prepare } from '../lib/prepare'
import { shuffle } from '../lib/arabicText'

/** بنك أسئلة الدرس: أسئلته الثابتة + عينة جديدة من مولّداته كل مرة. */
export function lessonPool(l: Lesson, perGen = 6): Q[] {
  const stat = l.blocks.flatMap((b) => (b.t === 'quiz' ? [b.q] : []))
  const gen = (l.gens ?? []).flatMap((g) => genSet(g, perGen))
  return shuffle([...stat, ...gen])
}

export function lessonsInScope(cfg: ExamConfig): Lesson[] {
  const set = new Set(cfg.unitIds)
  return SEMESTERS.flatMap((s) => s.units.filter((u) => set.has(u.id)).flatMap((u) => u.lessons))
}

/** يوزّع الأسئلة على دروس النطاق بالتناوب حتى لا يطغى درس على آخر. */
export function buildExam(cfg: ExamConfig): Q[] {
  const lessons = lessonsInScope(cfg)
  const pools = lessons.map((l) => lessonPool(l, 8))
  const out: Q[] = []
  const seen = new Set<string>()
  let progress = true
  while (out.length < cfg.n && progress) {
    progress = false
    for (const p of pools) {
      while (p.length) {
        const q = p.pop()!
        if (!seen.has(q.q)) { seen.add(q.q); out.push(q); progress = true; break }
      }
      if (out.length >= cfg.n) break
    }
  }
  // إن نقص العدد نكمل من مولّدات النطاق
  if (out.length < cfg.n) {
    const gens = Array.from(new Set(lessons.flatMap((l) => l.gens ?? [])))
    for (let k = 0; k < 20 && out.length < cfg.n && gens.length; k++) {
      for (const g of gens) for (const q of genSet(g, 3)) {
        if (out.length < cfg.n && !seen.has(q.q)) { seen.add(q.q); out.push(q) }
      }
    }
  }
  return shuffle(out).slice(0, cfg.n).map(prepare)
}
export { allLessons }
