import { useSyncExternalStore } from 'react'

const KEY = 'lugha-7-app:v1'
const UI_KEY = 'lugha-7-app:ui:v1'

export type MistakeRec = { lesson: string; q: string; chosen: string; correct: string; why: string; count: number; ts: number }
export type ExamRec = { best: number; last: number; passed: boolean; attempts: number; lockedUntil?: number; ts: number }
export type Progress = {
  v: 1
  stars: Record<string, number>
  mistakes: Record<string, MistakeRec>
  exams: Record<string, ExamRec>
}
const empty = (): Progress => ({ v: 1, stars: {}, mistakes: {}, exams: {} })

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const p = JSON.parse(raw)
    if (p && p.v === 1) return { ...empty(), ...p }
  } catch { /* تجاهل */ }
  return empty()
}

let state: Progress = read()
const listeners = new Set<() => void>()
function commit(p: Progress) {
  state = p
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* التخزين غير متاح */ }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const getProgress = () => state
export const useProgress = () => useSyncExternalStore(subscribe, getProgress)

export function setStars(lessonId: string, stars: number) {
  if ((state.stars[lessonId] ?? 0) >= stars) return
  commit({ ...state, stars: { ...state.stars, [lessonId]: stars } })
}
export function logMistake(id: string, rec: Omit<MistakeRec, 'count' | 'ts'>) {
  const old = state.mistakes[id]
  commit({ ...state, mistakes: { ...state.mistakes, [id]: { ...rec, count: (old?.count ?? 0) + 1, ts: Date.now() } } })
}
export function clearMistake(id: string) {
  if (!state.mistakes[id]) return
  const m = { ...state.mistakes }
  delete m[id]
  commit({ ...state, mistakes: m })
}
export function recordExam(id: string, pct: number, passed: boolean, lockHours?: number) {
  const old = state.exams[id]
  const rec: ExamRec = {
    best: Math.max(old?.best ?? 0, pct), last: pct, passed: passed || !!old?.passed,
    attempts: (old?.attempts ?? 0) + 1, ts: Date.now(),
    lockedUntil: !passed && lockHours ? Date.now() + lockHours * 3600_000 : undefined,
  }
  commit({ ...state, exams: { ...state.exams, [id]: rec } })
}
export function exportJSON() { return JSON.stringify(state, null, 2) }
export function importJSON(text: string): boolean {
  try {
    const p = JSON.parse(text)
    if (!p || p.v !== 1 || typeof p.stars !== 'object') return false
    commit({ ...empty(), ...p })
    return true
  } catch { return false }
}

export function loadUI(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(UI_KEY) || '{}') } catch { return {} }
}
export function saveUI(u: Record<string, boolean>) {
  try { localStorage.setItem(UI_KEY, JSON.stringify(u)) } catch { /* تجاهل */ }
}
