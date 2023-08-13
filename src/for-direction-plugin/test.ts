import { transformFromAstSync } from '@babel/core'
import { parse } from '@babel/parser'
import { ForDirectionLint } from '.'

const sourceCode = `
for (var i = 0; i < 10; i++) {
}

for (var i = 10; i >= 0; i--) {
}
for (var i = 0; i < 10; i--) {
}

for (var i = 10; i >= 0; i++) {
}
for (var i = 0; i < 10; i-= 1) {
}

for (var i = 10; i >= 0; i+=1) {
}
`

const ast = parse(sourceCode, {
  sourceType: 'unambiguous',
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      ForDirectionLint,
      { fix: true }
    ]
  ],
  comments: true
})!

console.log(code)