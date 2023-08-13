import path from 'path'

import fse from 'fs-extra'
import { declare } from '@babel/helper-plugin-utils'
import generate from '@babel/generator'
import type { BabelFile, NodePath } from '@babel/core'

let intlIndex = 0
function nextIntlKey() {
  ++intlIndex
  return `intl${intlIndex}`
}

export const autoI18nPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  if (!options.outputDir) {
    throw new Error('outputDir in empty')
  }

  function getReplaceExpression(path: NodePath, value: string, intlUid: string): null | any {
    const expressionParams = path.isTemplateLiteral() ? path.node.expressions.map(item => generate(item).code) : null
    let replaceExpression = (api.template.ast(
      `${intlUid}.t('${value}'${expressionParams ? ',' + expressionParams.join(',') : ''})`
    ) as any).expression
    if (path.findParent(p => p.isJSXAttribute()) && !path.findParent(p => p.isJSXExpressionContainer())) {
      --intlIndex
      return null
      // replaceExpression = api.types.jsxExpressionContainer(replaceExpression)
    }
    return replaceExpression
  }

  function save(file: BabelFile, key: string, value: string) {
    const allText = (file as any).get('allText')
    allText[key] = value;
    (file as any).set('allText', allText)
  }

  return {
    pre(file) {
      (file as any).set('allText', {})
    },
    visitor: {
      Program: {
        enter(path, state) {
          let imported
          path.traverse({
            ImportDeclaration(p) {
              const source = p.node.source.value
              if (source === 'intl') {
                imported = true
                state.intlUid = p.get('specifiers.0').toString()
              }
            },
            'StringLiteral|TemplateLiteral'(path) {
              if (path.node.leadingComments) {
                path.node.leadingComments = path.node.leadingComments.filter((comment, index) => {
                  if (comment.value.includes('i18n-disable')) {
                    (path.node as any).skipTransform = true
                    return false
                  }
                  return true
                })
              }
              if (path.findParent(p => p.isImportDeclaration())) {
                (path.node as any).skipTransform = true
              }
            }
          })
          if (!imported) {
            const uid = path.scope.generateUid('intl')
            const importAst = api.template.ast(`import ${uid} from 'intl'`)
            path.node.body.unshift(importAst as any)
            state.intlUid = uid
          }
        }
      },
      StringLiteral(path, state) {
        if ((path.node as any).skipTransform) {
          return
        }
        let key = nextIntlKey()

        const replaceExpression = getReplaceExpression(path, key, state.intlUid as string)
        if (replaceExpression) {
          save(state.file, key, path.node.value)
          path.replaceWith(replaceExpression)
          path.skip()
        }
      },
      TemplateLiteral(path, state) {
        if ((path.node as any).skipTransform) {
          return
        }
        const value = path.get('quasis').map(item => item.node.value.raw).join('{placeholder}')
        if (value) {
          let key = nextIntlKey()

          const replaceExpression = getReplaceExpression(path, key, state.intlUid as string)
          if (replaceExpression) {
            save(state.file, key, value)
            path.replaceWith(replaceExpression)
            path.skip()
          }
        }
      },
    },
    post(file) {
      const allText: Record<string, any> = (file as any).get('allText')

      const content = `const resource = ${JSON.stringify(allText, null, 2)}\nexport default resource`
      fse.ensureDirSync(options.outputDir)
      fse.writeFileSync(path.join(options.outputDir, 'zh_CN.js'), content)
      fse.writeFileSync(path.join(options.outputDir, 'en_US.js'), content)
    }
  }
})
