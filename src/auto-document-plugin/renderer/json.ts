import type { ClassInfo, FunctionInfo, Info } from '../types'

export default function (docs: Info) {
  return JSON.stringify(docs, null, 4)
}
