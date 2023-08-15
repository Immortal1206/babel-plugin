import { transformFromAstSync } from '@babel/core'
import { parse } from '@babel/parser'

import { TypeCheckerPlugin } from '.'

const sourceCode = `
  function add(a: number, b: number): number{
    return a + b
  }
  add(1, '2')
  function add1<T>(a: T, b: T) {
    return a + b
  }
  add1<string>(1, '2')
`

const ast = parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['typescript']
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [TypeCheckerPlugin],
  comments: true
})!

console.log(code)