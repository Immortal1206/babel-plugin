import { transformFromAstSync } from '@babel/core'
import { parse } from '@babel/parser'

import { EqLint } from '.'

const sourceCode = `
const four = /* foo */ add(2, 2)


 a == b
 foo == true
 bananas != 1
 value == undefined
 typeof foo == 'undefined'
 'hello' != 'world'
 0 == 0
 true == true
 null == undefined
`

const ast = parse(sourceCode, {
  sourceType: 'unambiguous',
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[EqLint, {
    fix: true
  }]],
  comments: true
})!

console.log(code)