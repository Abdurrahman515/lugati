import type { ReactNode } from 'react'

function inline(line: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(<strong key={key + i}>{tok.slice(2, -2)}</strong>)
    else out.push(<mark key={key + i} className="hl">{tok.slice(2, -2)}</mark>)
    last = m.index + tok.length
    i++
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

/** نص غني: **تغليظ** و[[تمييز]] وسطر جديد. */
export function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((l, i) => (
        <p key={i} className={l.trim() === '' ? 'gap' : undefined}>{inline(l, 'l' + i + '-')}</p>
      ))}
    </>
  )
}
