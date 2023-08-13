import { readFileSync } from 'fs'
import { join } from 'path'
import { cwd } from 'process'

import { transformFromAstSync } from '@babel/core'
import * as parser from '@babel/parser'

import { autoTrackPlugin } from '.'

const sourceCode = readFileSync(join(cwd(), './src/auto-track-plugin/sourceCode.js'), {
  encoding: 'utf-8'
})

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous'
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[autoTrackPlugin, { trackerPath: 'tracker' }]],
})!

console.log(code)