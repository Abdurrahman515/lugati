import type { Block } from './types'

export type Item = { b: Block; i: number }
/** جزء من الدرس: يُقرأ ثم تضغط الطالبة «كمّلي». إن كان فيه سؤال/نشاط فلا يُفتح الجزء التالي قبل حلّه. */
export type Part = { items: Item[]; gated: boolean }

export const isGate = (b: Block) => b.t === 'quiz' || b.t === 'widget' || b.t === 'practice'

/**
 * قاعدة التقسيم:
 * - كل «شرح» أو «نص» جزء مستقل، وبطاقات «اكشفي» تلتصق بما قبلها.
 * - السؤال/النشاط/التدريب يلتصق بالشرح الذي يسبقه مباشرة، وإلا يكون جزءاً وحده.
 */
export function buildParts(blocks: Block[]): Part[] {
  const parts: Part[] = []
  blocks.forEach((b, i) => {
    const last = parts[parts.length - 1]
    if (b.t === 'reveal' && last) { last.items.push({ b, i }); return }
    if (isGate(b)) {
      const tail = last?.items[last.items.length - 1]
      if (last && !last.gated && tail?.b.t === 'say') { last.items.push({ b, i }); last.gated = true; return }
      parts.push({ items: [{ b, i }], gated: true })
      return
    }
    parts.push({ items: [{ b, i }], gated: false })
  })
  return parts
}
