import { parse } from '@babel/parser'
import { transformFromAstSync } from '@babel/core'
import { CompressPlugin, ManglePlugin } from '.'

const sourceCode = `
    function func() {
        const num1 = 1
        const num2 = 2
        const num3 = /*@__PURE__*/add(1, 2)
        const num4 = add(3, 4)
        console.log(num2)
        return num2
        return num1
        console.log(num1)
        function add (aaa, bbb) {
            return aaa + bbb
        }
    }
    func()
`

const ast = parse(sourceCode, {
  sourceType: 'unambiguous'
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    // [ManglePlugin],
    [CompressPlugin]
  ],
  generatorOpts: {
    comments: false,
    // compact: true
  }
})!

console.log(code)


