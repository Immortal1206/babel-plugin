import { declare } from '@babel/helper-plugin-utils'

export const FunctionReassignLint = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      (file as any).set('errors', [])
    },
    visitor: {
      AssignmentExpression(path, state) {
        const errors = (state.file as any).get('errors')
        const assignTarget = path.get('left').toString()
        const binding = path.scope.getBinding(assignTarget)
        if (binding) {
          if (binding.path.isFunctionDeclaration() || binding.path.isFunctionExpression()) {
            const tmp = Error.stackTraceLimit
            Error.stackTraceLimit = 0
            errors.push(path.buildCodeFrameError('can not reassign to function', Error))
            Error.stackTraceLimit = tmp
          }
        }
      }
    },
    post(file) {
      console.log((file as any).get('errors'))
    }
  }
})