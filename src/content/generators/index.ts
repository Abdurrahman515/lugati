import type { MC, WR } from '../../lib/types'
import { genGender, genDefin, genRafa, genMubtada, genAmr, genWasl, genQat } from './unit1'
import { genMufrad, genMuthanna, genNasikh, genIstifham } from './unit2'
import { genJam, genTakseer, genHarf, genNida, genTaa } from './unit3'
import { genMabni, genDamir, genJarr, genNahy, genLamsh, genPrefal } from './unit4'
import { genIshara, genIdafa, genJumla, genHamza, genTarqim } from './unit5'
import { genMawsul, genMudari, genIkhtisar } from './unit6'

export const GENS: Record<string, () => MC | WR> = {
  gender: genGender, defin: genDefin, rafa: genRafa, mubtada: genMubtada, amr: genAmr, wasl: genWasl,
  mufrad: genMufrad, muthanna: genMuthanna, nasikh: genNasikh, istifham: genIstifham, qat: genQat,
  jam: genJam, takseer: genTakseer, harf: genHarf, nida: genNida, taa: genTaa,
  mabni: genMabni, damir: genDamir, jarr: genJarr, nahy: genNahy, lamsh: genLamsh, prefal: genPrefal,
  ishara: genIshara, idafa: genIdafa, jumla: genJumla, hamza: genHamza, tarqim: genTarqim,
  mawsul: genMawsul, mudari: genMudari, ikhtisar: genIkhtisar,
}

/** n سؤالاً مختلفاً من مولّد (يتفادى تكرار النص نفسه). */
export function genSet(id: string, n: number): (MC | WR)[] {
  const g = GENS[id]
  if (!g) return []
  const out: (MC | WR)[] = []
  const seen = new Set<string>()
  for (let i = 0; i < n * 12 && out.length < n; i++) {
    const q = g()
    if (!seen.has(q.q)) { seen.add(q.q); out.push(q) }
  }
  return out
}
