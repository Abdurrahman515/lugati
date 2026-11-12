import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '../../lib/arabicText'
import { randomPraise } from '../../lib/feedback'

type Item = { t: string; c: number; why: string }
type Props = { title?: string; cats: string[]; items: Item[]; onSolved?: () => void }

/** نشاط تصنيف: اختاري الكلمة ثم اضغطي على الخانة المناسبة. الخطأ لا يكشف الخانة الصحيحة. */
export function Sorter({ title, cats, items, onSolved }: Props) {
  const order = useMemo(() => shuffle(items.map((_, i) => i)), [items])
  const [placed, setPlaced] = useState<Record<number, number>>({})
  const [sel, setSel] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const left = order.filter((i) => placed[i] === undefined)
  const fired = useRef(false)
  useEffect(() => {
    if (left.length === 0 && !fired.current) { fired.current = true; onSolved?.() }
  }, [left.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const put = (c: number) => {
    if (sel === null) { setMsg({ ok: false, text: 'اختاري كلمة أولاً، وبعدين اضغطي على الخانة.' }); return }
    const it = items[sel]
    if (it.c === c) {
      setPlaced({ ...placed, [sel]: c })
      setMsg({ ok: true, text: `${randomPraise()} «${it.t}»: ${it.why}` })
      setSel(null)
    } else {
      setMsg({ ok: false, text: `لأ، مو هون 🤔 «${it.t}» مش من خانة «${cats[c]}». جرّبي خانة تانية.` })
    }
  }

  return (
    <div className="card widget">
      {title && <h4>{title}</h4>}
      <div className="chips">
        {left.map((i) => (
          <button key={i} className={'chip' + (sel === i ? ' on' : '')} onClick={() => { setSel(i); setMsg(null) }}>{items[i].t}</button>
        ))}
        {left.length === 0 && <b>🎉 صنّفتِ كل الكلمات!</b>}
      </div>
      <div className="buckets">
        {cats.map((c, ci) => (
          <button key={ci} className="bucket" onClick={() => put(ci)}>
            <b>{c}</b>
            <span className="chips">
              {order.filter((i) => placed[i] === ci).map((i) => <span key={i} className="chip done">{items[i].t}</span>)}
            </span>
          </button>
        ))}
      </div>
      {msg && <div className={'fb ' + (msg.ok ? 'ok' : 'bad')}>{msg.text}</div>}
    </div>
  )
}
