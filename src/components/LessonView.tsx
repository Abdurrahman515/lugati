import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../lib/types'
import { buildParts } from '../lib/parts'
import type { Item } from '../lib/parts'
import { RichText } from './RichText'
import { QuizCard } from './QuizCard'
import { Practice } from './Practice'
import { WIDGETS } from './widgets/registry'
import { setStars, useProgress } from '../lib/storage'
import { neighbors } from '../content/registry'
import { toArabicDigits } from '../lib/arabicText'
import { starsFor, starsText } from '../lib/feedback'

function Reveal({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card reveal" onClick={() => setOpen(!open)} role="button">
      <div className="reveal-head">🔎 {title} <span className="muted">{open ? '(اضغطي للإخفاء)' : '(اضغطي للكشف)'}</span></div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div className="reveal-body"><RichText text={text} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LessonView({ lesson }: { lesson: Lesson }) {
  const prog = useProgress()
  const parts = useMemo(() => buildParts(lesson.blocks), [lesson])
  const [visible, setVisible] = useState(0)
  const [solved, setSolved] = useState<Record<number, boolean>>({})
  const [first, setFirst] = useState<Record<number, boolean>>({})
  const [practice, setPractice] = useState<Record<number, { score: number; n: number }>>({})
  const lastRef = useRef<HTMLDivElement>(null)
  const savedRef = useRef(false)
  const { prev, next } = neighbors(lesson.id)

  const partDone = (p: number) => !parts[p].gated || !!solved[p]
  const solvePart = (p: number) => setSolved((s) => (s[p] ? s : { ...s, [p]: true }))
  const lastIdx = parts.length - 1
  const finished = visible === lastIdx && partDone(lastIdx)

  // نسبة الإجابات الصحيحة من أول محاولة (أسئلة الدرس + أول جولة تدريب)
  const { right, total } = useMemo(() => {
    let r = Object.values(first).filter(Boolean).length
    let t = Object.keys(first).length
    Object.values(practice).forEach((p) => { r += p.score; t += p.n })
    return { right: r, total: t }
  }, [first, practice])
  const earned = starsFor(right, total)

  useEffect(() => {
    if (finished && !savedRef.current) { savedRef.current = true; setStars(lesson.id, earned) }
  }, [finished, earned, lesson.id])

  useEffect(() => {
    if (visible === 0) return
    const t = setTimeout(() => lastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => clearTimeout(t)
  }, [visible])

  const renderBlock = ({ b, i }: Item, p: number) => {
    switch (b.t) {
      case 'say':
        return (
          <motion.div key={i} className="card say" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {b.emoji && <span className="emoji">{b.emoji}</span>}
            <div><RichText text={b.text} /></div>
          </motion.div>
        )
      case 'passage':
        return (
          <div key={i} className="card passage">
            {b.title && <h4>📜 {b.title}</h4>}
            <RichText text={b.text} />
          </div>
        )
      case 'reveal':
        return <Reveal key={i} title={b.title} text={b.text} />
      case 'widget': {
        const W = WIDGETS[b.id]
        return W ? <W key={i} {...b.props} onSolved={() => solvePart(p)} /> : <div key={i} className="card bad">أداة غير مسجّلة: {b.id}</div>
      }
      case 'quiz':
        return <QuizCard key={i} q={b.q} lessonId={lesson.id} retry
          onDone={(ok) => { setFirst((f) => ({ ...f, [i]: ok })); solvePart(p) }} />
      case 'practice':
        return (
          <div key={i}>
            <h4 className="section">🔁 تدريب متجدد</h4>
            <Practice gen={b.gen} n={b.n} lessonId={lesson.id}
              onComplete={(score, n) => { setPractice((x) => ({ ...x, [i]: { score, n } })); solvePart(p) }} />
          </div>
        )
    }
  }

  const stars = prog.stars[lesson.id] ?? 0
  const canGo = visible < lastIdx && partDone(visible)
  return (
    <div className="page">
      <div className="topbar">
        <a className="back" href="#/">→ الرئيسية</a>
        <span className="stars">{starsText(stars)}</span>
      </div>
      <h1>{lesson.emoji} {lesson.title}</h1>
      <div className="muted">الجزء {toArabicDigits(visible + 1)} من {toArabicDigits(parts.length)}</div>
      <div className="progress"><div style={{ width: `${(100 * (visible + (partDone(visible) ? 1 : 0))) / parts.length}%` }} /></div>

      {parts.slice(0, visible + 1).map((part, p) => (
        <div key={p} className="part" ref={p === visible ? lastRef : undefined}>
          {part.items.map((it) => renderBlock(it, p))}
        </div>
      ))}

      {!partDone(visible) && <div className="muted lockhint">🔒 حلّي هالجزء لتكمّلي</div>}
      {canGo && (
        <motion.button key={visible} className="btn cont" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => setVisible((v) => v + 1)}>
          كمّلي ✨
        </motion.button>
      )}

      {finished && (
        <motion.div className="card done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h3>🎉 خلصتِ الدرس!</h3>
          <p className="stars big">{starsText(earned)}</p>
          <p>{earned === 3 ? 'أسطورة! كل شي ماشي تمام 🏆' : earned === 2 ? 'حلو كتير! بقليل مراجعة بتوصلي للثلاث نجوم 💪' : 'بداية منيحة! جرّبي تعيدي الدرس وبتكسبي نجوم أكتر 🌱'}</p>
          {total > 0 && <p className="muted">الصحيحة من أول محاولة: {toArabicDigits(right)} من {toArabicDigits(total)}</p>}
        </motion.div>
      )}
      {finished && (
        <div className="row nav">
          {prev ? <a className="btn ghost" href={'#/lesson/' + prev.id}>→ {prev.title}</a> : <span />}
          {next ? <a className="btn" href={'#/lesson/' + next.id}>{next.title} ←</a> : <a className="btn" href="#/">الرئيسية</a>}
        </div>
      )}
    </div>
  )
}
