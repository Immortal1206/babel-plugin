import BabelCore, { PluginObj } from '@babel/core'

const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`)

export function parameterInsertPlugin({
  template,
  types,
}: typeof BabelCore): PluginObj {
  return {
    name: 'parameter-insert',
    visitor: {
      CallExpression(path, state) {
        if ((path.node as any).isNew) return
        const calleeName = path.get('callee').toString()
        if (targetCalleeName.includes(calleeName)) {
          const { line, column } = path.node.loc!.start

          const newNode = template.expression(`console.log("${state.filename || 'unkown filename'}: (${line}, ${column})")`)();
          (newNode as any).isNew = true

          if (path.findParent(path => path.isJSXElement())) {
            const node = types.arrayExpression([newNode, path.node])
            path.replaceWith(node)
            path.skip()
          } else {
            path.insertBefore(newNode)
          }
        }
      }
    }
  }
}