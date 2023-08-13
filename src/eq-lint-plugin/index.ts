import { declare } from '@babel/helper-plugin-utils'

export const EqLint = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      (file as any).set('errors', [])
    },
    visitor: {
      BinaryExpression(path, state) {
        const errors = (state.file as any).get('errors')
        if (['==', '!='].includes(path.node.operator)) {
          const left = path.get('left')
          const right = path.get('right')
          if (!(
            left.isLiteral() &&
            right.isLiteral() &&
            typeof (left.node as any).value === typeof (right.node as any).value
          )) {
            const tmp = Error.stackTraceLimit
            Error.stackTraceLimit = 0
            errors.push(path.buildCodeFrameError(
              `please replace ${path.node.operator} with ${path.node.operator + '='}`,
              Error
            ))
            Error.stackTraceLimit = tmp

            if ((state.opts as any).fix) {
              path.node.operator = path.node.operator + '=' as any
            }
          }
        }
      }
    },
    post(file) {
      console.log((file as any).get('errors'))
    }
  }
})