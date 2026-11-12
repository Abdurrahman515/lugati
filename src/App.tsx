import { useEffect, useState } from 'react'
import { Home } from './components/Home'
import { LessonView } from './components/LessonView'
import { ExamView } from './components/ExamView'
import { Mistakes } from './components/Mistakes'
import { findExam, findLesson } from './content/registry'

function useHash() {
  const [h, setH] = useState(location.hash || '#/')
  useEffect(() => {
    const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return h
}

export default function App() {
  const h = useHash()
  const parts = h.replace(/^#\/?/, '').split('/')
  if (parts[0] === 'lesson') {
    const l = findLesson(parts[1])
    if (l) return <LessonView key={l.id} lesson={l} />
  }
  if (parts[0] === 'exam') {
    const e = findExam(parts[1])
    if (e) return <ExamView key={e.id} exam={e} />
  }
  if (parts[0] === 'mistakes') return <Mistakes />
  return <Home />
}
