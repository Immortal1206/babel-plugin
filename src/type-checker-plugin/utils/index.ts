import type { FlowType, TSType } from '@babel/types'

export function resolveType(targetType: TSType | FlowType, referencedType: Record<string, string | undefined> = {}) {
  switch (targetType.type) {
    case 'StringTypeAnnotation':
    case 'TSStringKeyword':
      return 'string'
    case 'TSTypeReference':
      return referencedType[(targetType.typeName as any).name]
    case 'NumberTypeAnnotation':
    case 'TSNumberKeyword':
      return 'number'
  }
}

export function noStackTraceWrapper(cb: (err: ErrorConstructor) => void) {
  const tmp = Error.stackTraceLimit
  Error.stackTraceLimit = 0
  cb && cb(Error)
  Error.stackTraceLimit = tmp
}