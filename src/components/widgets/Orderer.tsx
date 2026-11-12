import { useMemo, useState } from 'react'
import { shuffle, toArabicDigits } from '../../lib/arabicText'
import { randomPraise } from '../../lib/feedback'

type Props = { prompt: string; words: string[]; why: string; alts?: string[][]; onSolved?: () => void }

/** نشاط ترتيب: كوّني جملة مفيدة بالضغط على الكلمات بالترتيب. لا يكشف الترتيب الصحيح عند الخطأ. */
export function Orderer({ prompt, words, why, alts = [], onSolved }: Props) {
  const pool = useMemo(() => shuffle(words.map((w, i) => ({ w, i }))), [words])
  const [built, setBuilt] = useState<number[]>([])
  const [res, setRes] = useState<null | 'ok' | 'no'>(null)
  const [msg, setMsg] = useState('')
  const left = pool.filter((p) => !built.includes(p.i))
  const txt = built.map((i) => words[i]).join(' ')
  const check = () => {
    const cands = [words, ...alts]
    if (cands.some((a) => a.join(' ') === txt)) { setMsg(randomPraise()); setRes('ok'); onSolved?.(); return }
    const best = Math.max(...cands.map((a) => built.filter((bi, k) => a[k] === words[bi]).length))
    setMsg(best === 0
      ? 'ولا كلمة بمكانها هلق. جرّبي تبدأي من أول وجديد.'
      : best === 1 ? 'في كلمة وحدة بمكانها الصحيح. غيّري الباقي.'
        : `في ${toArabicDigits(best)} كلمات بمكانها الصحيح. غيّري الباقي.`)
    setRes('no')
  }
  return (
    <div className="card widget">
      <h4>{prompt}</h4>
      <div className="chips build">
        {built.length === 0 && <span className="muted">اضغطي على الكلمات بالترتيب الصحيح…</span>}
        {built.map((i) => <button key={i} className="chip on" onClick={() => { if (res !== 'ok') { setBuilt(built.filter((x) => x !== i)); setRes(null) } }}>{words[i]}</button>)}
      </div>
      <div className="chips">
        {left.map((p) => <button key={p.i} className="chip" onClick={() => { setBuilt([...built, p.i]); setRes(null) }}>{p.w}</button>)}
      </div>
      <div className="row">
        <button className="btn" onClick={check} disabled={left.length > 0 || res === 'ok'}>تحقّقي</button>
        <button className="btn ghost" onClick={() => { if (res !== 'ok') { setBuilt([]); setRes(null) } }} disabled={res === 'ok'}>من جديد</button>
      </div>
      {res === 'ok' && <div className="fb ok"><b>{msg}</b>{why}</div>}
      {res === 'no' && <div className="fb bad"><b>لأ، مو هيك 🤔 جرّبي كمان مرة</b>{msg}</div>}
    </div>
  )
}
