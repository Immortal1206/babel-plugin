import { transformFromAstSync } from '@babel/core'
import { parse } from '@babel/parser'

import { TypeCheckerPlugin } from '.'

const sourceCode = `
  let name: string = 111
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