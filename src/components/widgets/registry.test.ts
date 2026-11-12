import { describe, expect, it } from 'vitest'
import { WIDGETS } from './registry'
import { allLessons } from '../../content/registry'

describe('سجل الأدوات', () => {
  it('الأدوات الأساسية مسجّلة ومكوّنات صالحة', () => {
    for (const id of ['sorter', 'highlighter', 'orderer']) expect(typeof WIDGETS[id], id).toBe('function')
  })

  it('كل أداة تستدعيها الدروس مسجّلة', () => {
    const used = new Set<string>()
    for (const l of allLessons) for (const b of l.blocks) if (b.t === 'widget') used.add(b.id)
    expect(used.size).toBeGreaterThan(0)
    for (const id of used) expect(WIDGETS[id], 'أداة غير مسجّلة: ' + id).toBeDefined()
  })
})
