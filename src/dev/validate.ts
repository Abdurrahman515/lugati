/* تحقق آلي من سلامة المحتوى: npm run validate */
import { SEMESTERS, allLessons } from '../content/registry'
import { GENS, genSet } from '../content/generators'
import { buildExam, lessonPool } from '../content/exams'
import type { Q } from '../lib/types'

const WIDGETS = new Set(['sorter', 'highlighter', 'orderer'])
let errors = 0
const err = (m: string) => { errors++; console.log('❌ ' + m) }

function checkQ(q: Q, where: string) {
  if (!q.q.trim()) err(`${where}: نص سؤال فارغ`)
  if (q.kind === 'mc') {
    if (q.opts.length < 2) err(`${where}: أقل من خيارين: ${q.q}`)
    if (q.correct < 0 || q.correct >= q.opts.length) err(`${where}: فهرس الصحيح خاطئ: ${q.q}`)
    const texts = q.opts.map((o) => o.t.trim())
    if (new Set(texts).size !== texts.length) err(`${where}: خيارات مكررة: ${q.q} => ${texts.join(' | ')}`)
    q.opts.forEach((o) => { if (!o.why.trim() || !o.t.trim()) err(`${where}: خيار بلا تفسير: ${q.q}`) })
    if (q.opts.filter((_, i) => i === q.correct).length !== 1) err(`${where}: أكثر من صحيح`)
  } else if (q.answers.length === 0) err(`${where}: سؤال كتابي بلا جواب`)
}

const ids = new Set<string>()
for (const l of allLessons) {
  if (ids.has(l.id)) err('معرّف درس مكرر ' + l.id)
  ids.add(l.id)
  l.blocks.forEach((b, i) => {
    const w = `${l.id}#${i}`
    if (b.t === 'quiz') checkQ(b.q, w)
    if (b.t === 'widget' && !WIDGETS.has(b.id)) err(`${w}: أداة غير مسجلة ${b.id}`)
    if (b.t === 'practice' && !GENS[b.gen]) err(`${w}: مولّد غير موجود ${b.gen}`)
  })
  ;(l.gens ?? []).forEach((g) => { if (!GENS[g]) err(`${l.id}: gens غير موجود ${g}`) })
  const stat = l.blocks.filter((b) => b.t === 'quiz').length
  if (stat + (l.gens?.length ?? 0) === 0) err(`${l.id}: لا أسئلة`)
  if (l.kind === 'reading') l.blocks.forEach((b) => { if (b.t === 'quiz' && !b.q.passage) err(`${l.id}: سؤال قراءة بلا نص`) })
  if (lessonPool(l).length < 3) err(`${l.id}: بنك أسئلة صغير`)
}
console.log(`دروس: ${allLessons.length}`)

for (const g of Object.keys(GENS)) {
  const seen = new Set<string>()
  for (let i = 0; i < 400; i++) {
    const q = GENS[g]()
    checkQ(q, 'gen:' + g)
    seen.add(q.q)
  }
  console.log(`مولّد ${g}: ${seen.size} نصاً مختلفاً`)
  if (genSet(g, 5).length < 5) err(`gen ${g}: لا يعطي 5 أسئلة مختلفة`)
}

for (const s of SEMESTERS) for (const e of s.exams) {
  for (let t = 0; t < 5; t++) {
    const qs = buildExam(e)
    if (qs.length !== e.n) err(`${e.id}: عدد الأسئلة ${qs.length} بدل ${e.n}`)
    if (new Set(qs.map((q) => q.q)).size !== qs.length) err(`${e.id}: أسئلة مكررة`)
    qs.forEach((q) => checkQ(q, e.id))
  }
  console.log(`اختبار ${e.id}: OK (${e.n})`)
}
console.log(errors ? `\nأخطاء: ${errors}` : '\n✅ كل الفحوص نجحت')
;(globalThis as any).process?.exit(errors ? 1 : 0)
