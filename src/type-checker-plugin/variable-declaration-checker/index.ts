import { declare } from '@babel/helper-plugin-utils'

import { resolveType, noStackTraceWrapper } from '../utils'

export const TypeCheckerPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      (file as any).set('errors', [])
    },
    visitor: {
      VariableDeclarator(path, state) {
        const errors = (state.file as any).get('errors')

        const idType = resolveType(path.get('id').getTypeAnnotation())
        const initType = resolveType(path.get('init').getTypeAnnotation())

        if (idType !== initType) {
          noStackTraceWrapper((Error: ErrorConstructor) => {
            errors.push(path.get('init').buildCodeFrameError(`${initType} can not assign to ${idType}`, Error))
          })
        }
      }
    },
    post(file) {
      console.log((file as any).get('errors'))
    }
  }
})