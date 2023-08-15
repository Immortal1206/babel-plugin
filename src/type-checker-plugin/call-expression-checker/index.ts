import { declare } from '@babel/helper-plugin-utils'
import type { NodePath } from '@babel/core'
import type { TSFunctionType } from '@babel/types'

import { resolveType, noStackTraceWrapper } from '../utils'

export const TypeCheckerPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      (file as any).set('errors', [])
    },
    visitor: {
      CallExpression(path, state) {
        const errors = (state.file as any).get('errors')

        const realTypes = path.node.typeParameters?.params.map(item => resolveType(item))

        const argumentsTypes = path.get('arguments').map(item => resolveType(item.getTypeAnnotation()))
        const calleeName = path.get('callee').toString()
        const functionDeclarePath = path.scope.getBinding(calleeName)?.path
        const realTypeMap: Record<string, string | undefined> = {};
        (functionDeclarePath?.node as TSFunctionType).typeParameters?.params.map((item, index) => {
          realTypeMap[item.name] = realTypes?.[index]
        })
        const declareParamsTypes = (functionDeclarePath?.get('params') as NodePath[]).map(
          item => resolveType(item.getTypeAnnotation(), realTypeMap)
        )

        argumentsTypes.forEach((item, index) => {
          if (item !== declareParamsTypes[index]) {
            noStackTraceWrapper(Error => {
              errors.push((path.get('arguments.' + index) as NodePath).buildCodeFrameError(
                `${item} can not assign to ${declareParamsTypes[index]}`,
                Error)
              )
            })
          }
        })
      }
    },
    post(file) {
      console.log((file as any).get('errors'))
    }
  }
})