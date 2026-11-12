import { describe, expect, it } from 'vitest'
import { hl, lang, skill, sorter } from './s2dsl'
import { mc } from './dsl'

describe('s2dsl', () => {
  it('sorter/hl يبنيان كتلتي widget بالخصائص المتوقعة', () => {
    expect(sorter('ع', ['أ', 'ب'], [['س', 1, 'ل']])).toEqual({ t: 'widget', id: 'sorter', props: { title: 'ع', cats: ['أ', 'ب'], items: [{ t: 'س', c: 1, why: 'ل' }] } })
    expect(hl('ظلّلي', ['أ', 'ب'], [1], 'ل')).toEqual({ t: 'widget', id: 'highlighter', props: { prompt: 'ظلّلي', words: ['أ', 'ب'], answer: [1], why: 'ل' } })
  })
  it('lang: شرح ثم أنشطة ثم أسئلة ثم تدريب، والمولّد يُسجَّل في gens', () => {
    const l = lang('x', 'ع', '📘', ['أ', 'ب'], [hl('p', ['a', 'b'], [0], 'w')], [['س؟', 'ص', 'ل', [['خ', 'غ']]]], 'g')
    expect(l.blocks.map((b) => b.t)).toEqual(['say', 'say', 'widget', 'quiz', 'practice'])
    expect(l.gens).toEqual(['g'])
    expect(l.kind).toBe('language')
    expect(l.blocks[3]).toMatchObject({ t: 'quiz', q: { id: mc('س؟', 'ص', 'ل', [['خ', 'غ']]).id } })
  })
  it('skill: نوع skill بلا مولّد', () => {
    const l = skill('y', 'ع', '🎙️', ['أ'], [], [['س؟', 'ص', 'ل', [['خ', 'غ']]]])
    expect(l.kind).toBe('skill')
    expect(l.gens).toBeUndefined()
  })
})
