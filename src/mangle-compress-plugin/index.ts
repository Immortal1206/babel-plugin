import { NodePath } from '@babel/core'
import { declare } from '@babel/helper-plugin-utils'

const base54 = (function () {
  const DIGITS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
  return function (num: number) {
    let ret = ''
    do {
      ret = DIGITS.charAt(num % 54) + ret
      num = Math.floor(num / 54)
    } while (num > 0)
    return ret
  }
})()

export const ManglePlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      (file as any).set('uid', 0)
    },
    visitor: {
      Scopable: {
        exit(path, state) {
          let uid = (state.file as any).get('uid')
          Object.entries(path.scope.bindings).forEach(([key, binding]) => {
            if ((binding as any).mangled) return
            (binding as any).mangled = true
            const newName = path.scope.generateUid(base54(uid++))
            binding.path.scope.rename(key, newName)
          });
          (state.file as any).set('uid', uid)
        }
      }
    }
  }
})

function canExistAfterCompletion(path: NodePath) {
  return path.isFunctionDeclaration() || path.isVariableDeclaration({
    kind: 'var'
  })
}
export const CompressPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      (file as any).set('uid', 0)
    },
    visitor: {
      BlockStatement(path) {
        const statementPaths = path.get('body')
        let purge = false
        let completed = false

        for (let i = 0; i < statementPaths.length; i++) {
          if (completed && !canExistAfterCompletion(statementPaths[i])) {
            statementPaths[i].remove()
            continue
          }

          if (statementPaths[i].isCompletionStatement()) {
            purge = true
            completed = true
            continue
          }

          if (purge && !canExistAfterCompletion(statementPaths[i])) {
            statementPaths[i].remove()
          }
        }
      },
      Scopable(path) {
        Object.entries(path.scope.bindings).forEach(([key, binding]) => {
          if (!binding.referenced) {
            if ((binding.path.get('init') as NodePath).isCallExpression()) {
              const comments = (binding.path.get('init') as NodePath).node.leadingComments
              if (comments && comments[0]) {
                if (comments[0].value.includes('PURE')) {
                  binding.path.remove()
                  return
                }
              }
            }
            if (!path.scope.isPure((binding.path.node as any).init)) {
              binding.path.parentPath?.replaceWith(api.types.expressionStatement((binding.path.node as any).init))
            } else {
              binding.path.remove()
            }
          }
        })
      }
    }
  }
})