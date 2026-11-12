import { useState } from 'react'
import { randomPraise } from '../../lib/feedback'
import { toArabicDigits } from '../../lib/arabicText'

type Props = { prompt: string; words: string[]; answer: number[]; why: string; onSolved?: () => void }

/** نشاط تظليل: اضغطي على الكلمات المطلوبة ثم تحقّقي. لا يكشف الجواب عند الخطأ. */
export function Highlighter({ prompt, words, answer, why, onSolved }: Props) {
  const [on, setOn] = useState<number[]>([])
  const [res, setRes] = useState<null | 'ok' | 'no'>(null)
  const [msg, setMsg] = useState('')
  const toggle = (i: number) => { if (res === 'ok') return; setRes(null); setOn(on.includes(i) ? on.filter((x) => x !== i) : [...on, i]) }
  const check = () => {
    const key = (a: number[]) => [...a].sort((x, y) => x - y).join(',')
    if (key(answer) === key(on)) { setMsg(randomPraise()); setRes('ok'); onSolved?.(); return }
    const need = answer.length
    setMsg(on.length > need
      ? `اخترتِ كلمات أكتر من المطلوب. المطلوب ${toArabicDigits(need)}.`
      : on.length < need
        ? `لسا في كلمات ناقصة. المطلوب ${toArabicDigits(need)}.`
        : 'العدد صح، بس في كلمة مو في مكانها. بدّلي اختيارك.')
    setRes('no')
  }
  return (
    <div className="card widget">
      <h4>{prompt}</h4>
      <div className="chips sentence">
        {words.map((w, i) => (
          <button key={i} className={'chip' + (on.includes(i) ? ' on' : '')} onClick={() => toggle(i)}>{w}</button>
        ))}
      </div>
      <button className="btn" onClick={check} disabled={on.length === 0 || res === 'ok'}>تحقّقي</button>
      {res === 'ok' && <div className="fb ok"><b>{msg}</b>{why}</div>}
      {res === 'no' && <div className="fb bad"><b>لأ، مو هيك 🤔 جرّبي كمان مرة</b>{msg}</div>}
    </div>
  )
}
