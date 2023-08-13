import { Node, NodePath } from '@babel/core'
import { declare } from '@babel/helper-plugin-utils'
import { addDefault } from '@babel/helper-module-imports'

export const autoTrackPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)
  return {
    visitor: {
      Program(path, state) {
        path.traverse({
          ImportDeclaration(curPath) {
            const requirePath = curPath.get('source').node.value
            if (requirePath === options.trackerPath) {
              const specifierPath = curPath.get('specifiers.0') as NodePath
              if (
                specifierPath.isImportSpecifier() ||
                specifierPath.isImportDefaultSpecifier()
              ) {
                state.trackerImportId = specifierPath.toString()
              } else if (specifierPath.isImportNamespaceSpecifier()) {
                state.trackerImportId = specifierPath.get('local').toString()
              }
              curPath.stop()
            }
          }
        })
        if (!state.trackerImportId) {
          state.trackerImportId = addDefault(path, 'tracker', {
            nameHint: path.scope.generateUid('tracker')
          }).name
        }
        state.trackerAST = api.template.statement(`${state.trackerImportId}()`)()
      },
      'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
        const bodyPath = path.get('body') as NodePath
        if (bodyPath.isBlockStatement()) {
          (bodyPath.node as any).body.unshift(state.trackerAST)
        } else {
          const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({ PREV_BODY: bodyPath.node })
          bodyPath.replaceWith(ast)
        }
      }
    }
  }
})