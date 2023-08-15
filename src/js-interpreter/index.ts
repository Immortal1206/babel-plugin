import type { Visitor, Node } from '@babel/core'
import type * as t from '@babel/types'
import { parse } from '@babel/parser'
import { codeFrameColumns } from '@babel/code-frame'
import chalk from 'chalk'

const sourceCode = `
  const  a = 2
  // let a = 'sss'
  function add(a, b) {
    return a + b
  }
  console.log(add(1, 2))
`

const ast = parse(sourceCode, { sourceType: 'unambiguous' })

class Scope {
  public parent?: Scope
  private declarations: Record<string, any>
  constructor(parentScope?: Scope) {
    this.parent = parentScope
    this.declarations = {}
  }

  set(name: string, value: any) {
    this.declarations[name] = value
  }

  getLocal(name: string) {
    return this.declarations[name]
  }

  get(name: string) {
    let res = this.getLocal(name)
    if (res === undefined && this.parent) {
      res = this.parent.get(name)
    }
    return res
  }

  has(name: string) {
    return !!this.getLocal(name)
  }
}

function getIdentifierValue(node: Node, scope?: Scope) {
  if (node.type === 'Identifier') {
    return scope?.get(node.name)
  } else {
    return evaluator.evaluate(node, scope)
  }
}
const evaluator = (function () {
  type AstInterPreter = Partial<Record<keyof Visitor, (this: any, node: any, scope?: Scope) => any>>
  const astInterpreters: AstInterPreter = {
    Program(node: t.Program, scope) {
      node.body.forEach(item => {
        evaluate(item, scope)
      })
    },
    VariableDeclaration(node: t.VariableDeclaration, scope) {
      node.declarations.forEach((item) => {
        evaluate(item, scope)
      })
    },
    VariableDeclarator(node: t.VariableDeclarator, scope) {
      const declareName = evaluate(node.id, scope)
      if (scope?.get(declareName)) {
        throw Error('duplicate declare variable：' + declareName)
      } else {
        scope?.set(declareName, evaluate(node.init!, scope))
      }
    },
    ExpressionStatement(node: t.ExpressionStatement, scope) {
      return evaluate(node.expression, scope)
    },
    MemberExpression(node: t.MemberExpression, scope) {
      const obj = scope?.get(evaluate(node.object))
      return obj[evaluate(node.property)]
    },
    FunctionDeclaration(node: t.FunctionDeclaration, scope) {
      const declareName = evaluate(node.id!)
      if (scope?.get(declareName)) {
        throw Error('duplicate declare variable：' + declareName)
      } else {
        scope?.set(declareName, function (this: any, ...args: any[]) {
          const funcScope = new Scope()
          funcScope.parent = scope

          node.params.forEach((item, index) => {
            funcScope.set((item as any).name, args[index])
          })
          funcScope.set('this', this)
          return evaluate(node.body, funcScope)
        })
      }
    },
    ReturnStatement(node: t.ReturnStatement, scope) {
      return evaluate(node.argument!, scope)
    },
    BlockStatement(node: t.BlockStatement, scope) {
      for (let i = 0; i < node.body.length; i++) {
        if (node.body[i].type === 'ReturnStatement') {
          return evaluate(node.body[i], scope)
        }
        evaluate(node.body[i], scope)
      }
    },
    CallExpression(node: t.CallExpression, scope) {
      const args = node.arguments.map(item => {
        if (item.type === 'Identifier') {
          return scope?.get(item.name)
        }
        return evaluate(item, scope)
      })
      if (node.callee.type === 'MemberExpression') {
        const fn = evaluate(node.callee, scope)
        const obj = evaluate(node.callee.object, scope)
        return fn.apply(obj, args)
      } else {
        const fn = scope?.get(evaluate(node.callee, scope))
        return fn.apply(null, args)
      }
    },
    BinaryExpression(node: t.BinaryExpression, scope) {
      const leftValue = getIdentifierValue(node.left, scope)
      const rightValue = getIdentifierValue(node.right, scope)
      switch (node.operator) {
        case '+':
          return leftValue + rightValue
        case '-':
          return leftValue - rightValue
        case '*':
          return leftValue * rightValue
        case '/':
          return leftValue / rightValue
        default:
          throw Error('upsupported operator：' + node.operator)
      }
    },
    Identifier(node: t.Identifier, scope) {
      return node.name
    },
    NumericLiteral(node: t.NumericLiteral, scope) {
      return node.value
    }
  }

  const evaluate = (node: Node, scope?: Scope) => {
    try {
      return astInterpreters[node.type]?.(node, scope)
    } catch (e: any) {
      if (e && e.message && e.message.includes('astInterpreters[node.type] is not a function')) {
        console.error('unsupported ast type: ' + node.type)
        console.error(codeFrameColumns(sourceCode, node.loc!, {
          highlightCode: true
        }))
      } else {
        console.error(node.type + ':', e.message)
        console.error(codeFrameColumns(sourceCode, node.loc!, {
          highlightCode: true
        }))
      }
    }
  }
  return {
    evaluate
  }
})()

const globalScope = new Scope()
globalScope.set('console', {
  log: function (...args: any[]) {
    console.log(chalk.green(...args))
  },
  error: function (...args: any[]) {
    console.log(chalk.red(...args))
  },
})
evaluator.evaluate(ast.program, globalScope)
