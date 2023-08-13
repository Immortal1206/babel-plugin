import { join } from 'path'
import { cwd } from 'process'
import { transformFileSync } from '@babel/core'

import { parameterInsertPlugin } from '.'

const { code } = transformFileSync(join(cwd(), './src/parameter-insert-plugin/sourceCode.js'), {
  plugins: [parameterInsertPlugin],
  parserOpts: {
    sourceType: 'unambiguous',
    plugins: ['jsx']
  }
})!

console.log(code)
