import { declare } from '@babel/helper-plugin-utils'
import type { AssignmentExpression, BinaryExpression, UpdateExpression } from '@babel/types'

export const ForDirectionLint = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      (file as any).set('errors', [])
    },
    visitor: {
      ForStatement(path, state) {
        const errors = (state.file as any).get('errors')
        const testOperator = (path.node.test as BinaryExpression)?.operator
        const udpateOperator = (path.node.update as UpdateExpression | AssignmentExpression).operator

        let sholdUpdateOperator: string[] = []
        if (['<', '<='].includes(testOperator)) {
          sholdUpdateOperator = ['++', '+=']
        } else if (['>', '>='].includes(testOperator)) {
          sholdUpdateOperator = ['--', '-=']
        }

        if (!sholdUpdateOperator.includes(udpateOperator)) {
          const tmp = Error.stackTraceLimit
          Error.stackTraceLimit = 0
          errors.push(path.get('update').buildCodeFrameError("for direction error", Error))
          Error.stackTraceLimit = tmp
          if (!(state.opts as any).fix) return
          if (udpateOperator === '--') (path.node.update as UpdateExpression).operator = '++'
          if (udpateOperator === '++') (path.node.update as UpdateExpression).operator = '--'
          if (udpateOperator === '+=') (path.node.update as AssignmentExpression).operator = '-='
          if (udpateOperator === '-=') (path.node.update as AssignmentExpression).operator = '+='
        }
      }
    },
    post(file) {
      console.log((file as any).get('errors'))
    }
  }
})