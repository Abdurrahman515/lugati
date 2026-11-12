import type { ComponentType } from 'react'
import { Sorter } from './Sorter'
import { Highlighter } from './Highlighter'
import { Orderer } from './Orderer'

/** سجل الأدوات: أي أداة جديدة تُسجَّل هنا وإلا لا يستدعيها الدرس. */
export const WIDGETS: Record<string, ComponentType<any>> = {
  sorter: Sorter,
  highlighter: Highlighter,
  orderer: Orderer,
}
