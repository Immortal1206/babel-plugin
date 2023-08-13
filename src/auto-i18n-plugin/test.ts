import fs from 'fs'
import { join, resolve } from 'path'
import { cwd } from 'process'

import { transformFromAstSync } from '@babel/core'
import { parse } from '@babel/parser'

import { autoI18nPlugin } from '.'

const sourceCode = fs.readFileSync(join(cwd(), './src/auto-i18n-plugin/sourceCode.js'), {
  encoding: 'utf-8'
})

const ast = parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      autoI18nPlugin,
      {
        outputDir: resolve(__dirname, './output')
      }
    ]
  ]
})!

console.log(code)
