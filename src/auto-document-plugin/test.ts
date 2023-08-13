import fs from 'fs'
import path, { join } from 'path'
import { cwd } from 'process'

import { transformFromAstSync } from '@babel/core'
import { parse } from '@babel/parser'

import { autoDocumentPlugin } from '.'

const sourceCode = fs.readFileSync(join(cwd(), './src/auto-document-plugin/sourceCode.ts'), {
  encoding: 'utf-8'
})

const ast = parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['typescript']
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      autoDocumentPlugin,
      {
        outputDir: path.resolve(__dirname, './docs'),
        format: 'markdown'
      }
    ]
  ]
})!

console.log(code)
