import type { ExamConfig, Lesson, Semester, Unit } from '../lib/types'
import u1quran from './lessons/u1-quran'
import u1sadaqa from './lessons/u1-sadaqa'
import u1ukh from './lessons/u1-ukhuwwa'
import u1akh from './lessons/u1-akhlaq'
import u1jad from './lessons/u1-jadati'
import u1gender from './lessons/u1-gender'
import u1defin from './lessons/u1-defin'
import u1mub from './lessons/u1-mubtada'
import u1amr from './lessons/u1-amr'
import u1wasl from './lessons/u1-wasl'
import u1raq from './lessons/u1-raqaa'
import u1hiw from './lessons/u1-hiwar'
import u1end from './lessons/u1-ending'
import u2khatam from './lessons/u2-khatam'
import u2shal from './lessons/u2-shallal'
import u2sama from './lessons/u2-sama'
import u2imam from './lessons/u2-imam'
import u2umm from './lessons/u2-umm-salama'
import u2mufrad from './lessons/u2-mufrad'
import u2muth from './lessons/u2-muthanna'
import u2nas from './lessons/u2-nasikh'
import u2ist from './lessons/u2-istifham'
import u2qat from './lessons/u2-qat'
import u2alif from './lessons/u2-alif'
import u2hiw from './lessons/u2-hiwar'
import u2khi from './lessons/u2-kitabat-hiwar'
import u3afal from './lessons/u3-afal'
import u3fur from './lessons/u3-fursan'
import u3beer from './lessons/u3-beer'
import u3ayn from './lessons/u3-ayneyk'
import u3dir from './lessons/u3-diriyah'
import u3jam from './lessons/u3-jam-salim'
import u3tak from './lessons/u3-takseer'
import u3harf from './lessons/u3-harf'
import u3nida from './lessons/u3-nida'
import u3taa from './lessons/u3-taa'
import u3raz from './lessons/u3-raa-zay'
import u3khu from './lessons/u3-khutba'
import u3ist from './lessons/u3-istimara'
import u4risala from './lessons/u4-risala'
import u4marab from './lessons/u4-marab'
import u4damair from './lessons/u4-damair'
import u4bisata from './lessons/u4-bisata'
import u4jarr from './lessons/u4-jarr'
import u4tabtasim from './lessons/u4-tabtasim'
import u4nahy from './lessons/u4-nahy'
import u4lamsh from './lessons/u4-lamsh'
import u4prefal from './lessons/u4-prefal'
import u4ruqaa from './lessons/u4-ruqaa-waw'
import u4nadwa from './lessons/u4-nadwa'
import u4rasael from './lessons/u4-rasael'
import u4shamaa from './lessons/u4-shamaa'
import u4mujtamaan from './lessons/u4-mujtamaan'
import u5maa from './lessons/u5-maa'
import u5ishara from './lessons/u5-ishara'
import u5asaken from './lessons/u5-asaken'
import u5idafa from './lessons/u5-idafa'
import u5shifaa from './lessons/u5-shifaa'
import u5ismiya from './lessons/u5-ismiya'
import u5hamza from './lessons/u5-hamza-alif'
import u5tarqim from './lessons/u5-tarqim'
import u5ruqaa from './lessons/u5-ruqaa-dal'
import u5khutba from './lessons/u5-khutba'
import u5rasael from './lessons/u5-rasael'
import u5riyada from './lessons/u5-riyada'
import u5ward from './lessons/u5-ward'
import u6lulu from './lessons/u6-lulu'
import u6mawsul from './lessons/u6-mawsul'
import u6amal from './lessons/u6-amal'
import u6mudari from './lessons/u6-mudari'
import u6ibda from './lessons/u6-ibda'
import u6filiya from './lessons/u6-filiya'
import u6hamza from './lessons/u6-hamza-waw'
import u6ikhtisar from './lessons/u6-ikhtisar'
import u6ruqaa from './lessons/u6-ruqaa-ba'
import u6muqabala from './lessons/u6-muqabala'
import u6talkhis from './lessons/u6-talkhis'
import u6ruaa from './lessons/u6-ruaa'
import u6hiraf from './lessons/u6-hiraf'

const units1: Unit[] = [
  { id: 'u1', title: 'الوحدة الأولى: القيم الإسلامية', emoji: '🕌', lessons: [
    u1quran, u1gender, u1defin, u1sadaqa, u1mub, u1ukh, u1amr, u1wasl, u1akh, u1raq, u1hiw, u1end, u1jad] },
  { id: 'u2', title: 'الوحدة الثانية: الأعلام', emoji: '🔭', lessons: [
    u2khatam, u2mufrad, u2muth, u2shal, u2nas, u2sama, u2ist, u2qat, u2imam, u2alif, u2hiw, u2khi, u2umm] },
  { id: 'u3', title: 'الوحدة الثالثة: الوطن', emoji: '🇸🇦', lessons: [
    u3afal, u3jam, u3tak, u3fur, u3harf, u3beer, u3nida, u3taa, u3ayn, u3raz, u3khu, u3ist, u3dir] },
]

/** نطاق اختبار منتصف الفصل: الوحدتان ١ و٢ (افتراض قابل للتعديل هنا). */
export const MID_UNITS = ['u1', 'u2']

const exams1: ExamConfig[] = [
  { id: 'rev-u1', title: 'مراجعة الوحدة الأولى', emoji: '📝', kind: 'review', unitIds: ['u1'], n: 16, pass: 70, strict: false },
  { id: 'rev-u2', title: 'مراجعة الوحدة الثانية', emoji: '📝', kind: 'review', unitIds: ['u2'], n: 16, pass: 70, strict: false },
  { id: 'rev-u3', title: 'مراجعة الوحدة الثالثة', emoji: '📝', kind: 'review', unitIds: ['u3'], n: 16, pass: 70, strict: false },
  { id: 'mid-s1', title: 'اختبار منتصف الفصل الدراسي الأول', emoji: '🎯', kind: 'mid', unitIds: MID_UNITS, n: 30, pass: 60, strict: true, lockHours: 24, afterUnit: MID_UNITS[MID_UNITS.length - 1] },
  { id: 'final-s1', title: 'اختبار نهاية الفصل الدراسي الأول', emoji: '🏁', kind: 'final', unitIds: ['u1', 'u2', 'u3'], n: 60, pass: 60, strict: true, lockHours: 24 },
]

const units2: Unit[] = [
  { id: 'u4', title: 'الوحدة الرابعة: الحياة الاجتماعية', emoji: '🤝', lessons: [
    u4risala, u4marab, u4damair, u4bisata, u4jarr, u4tabtasim, u4nahy, u4lamsh, u4prefal, u4ruqaa, u4nadwa, u4rasael, u4shamaa, u4mujtamaan] },
  { id: 'u5', title: 'الوحدة الخامسة: البيئة والصحة', emoji: '🌿', lessons: [
    u5maa, u5ishara, u5asaken, u5idafa, u5shifaa, u5ismiya, u5hamza, u5tarqim, u5ruqaa, u5khutba, u5rasael, u5riyada, u5ward] },
  { id: 'u6', title: 'الوحدة السادسة: حرف وهوايات', emoji: '🎨', lessons: [
    u6lulu, u6mawsul, u6amal, u6mudari, u6ibda, u6filiya, u6hamza, u6ikhtisar, u6ruqaa, u6muqabala, u6talkhis, u6ruaa, u6hiraf] },
]

/** نطاق اختبار منتصف الفصل الثاني: الوحدتان ٤ و٥ (افتراض قابل للتعديل هنا). */
export const MID_UNITS_S2 = ['u4', 'u5']

const exams2: ExamConfig[] = [
  { id: 'rev-u4', title: 'مراجعة الوحدة الرابعة', emoji: '📝', kind: 'review', unitIds: ['u4'], n: 16, pass: 70, strict: false },
  { id: 'rev-u5', title: 'مراجعة الوحدة الخامسة', emoji: '📝', kind: 'review', unitIds: ['u5'], n: 16, pass: 70, strict: false },
  { id: 'rev-u6', title: 'مراجعة الوحدة السادسة', emoji: '📝', kind: 'review', unitIds: ['u6'], n: 16, pass: 70, strict: false },
  { id: 'mid-s2', title: 'اختبار منتصف الفصل الدراسي الثاني', emoji: '🎯', kind: 'mid', unitIds: MID_UNITS_S2, n: 30, pass: 60, strict: true, lockHours: 24, afterUnit: MID_UNITS_S2[MID_UNITS_S2.length - 1] },
  { id: 'final-s2', title: 'اختبار نهاية العام الدراسي', emoji: '🏁', kind: 'final', unitIds: ['u4', 'u5', 'u6'], n: 60, pass: 60, strict: true, lockHours: 24 },
]

export const SEMESTERS: Semester[] = [
  { id: 's1', title: 'الفصل الدراسي الأول', units: units1, exams: exams1 },
  { id: 's2', title: 'الفصل الدراسي الثاني', units: units2, exams: exams2 },
]

export const allLessons: Lesson[] = SEMESTERS.flatMap((s) => s.units.flatMap((u) => u.lessons))
export const findLesson = (id: string) => allLessons.find((l) => l.id === id)
export const findExam = (id: string) => SEMESTERS.flatMap((s) => s.exams).find((e) => e.id === id)
export function neighbors(id: string) {
  const i = allLessons.findIndex((l) => l.id === id)
  return { prev: allLessons[i - 1], next: allLessons[i + 1] }
}
