import { transformFromAstSync } from '@babel/core'
import { parse } from '@babel/parser'

import { FunctionReassignLint } from '.'

const sourceCode = `
  function foo() {
    foo = bar
  }

  var a = function hello() {
    hello = 123
  }
`
const ast = parse(sourceCode, {
  sourceType: 'unambiguous'
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [FunctionReassignLint],
})!

console.log(code)