import { join } from 'path'
import fse from 'fs-extra'
import { declare } from '@babel/helper-plugin-utils'
import type { FlowType, TSType } from '@babel/types'
import doctrine from 'doctrine'

import type { FunctionInfo, ClassInfo, Info } from './types'
import renderer from './renderer'

function parseComment(commentStr: string | null | undefined) {
  if (!commentStr) {
    return
  }
  return doctrine.parse(commentStr, {
    unwrap: true
  })
}

function generate(docs: Info, format = 'json') {
  if (format === 'markdown') {
    return {
      ext: '.md',
      content: renderer.markdown(docs)
    }
  } else if (format === 'html') {
    return {
      ext: '.html',
      content: renderer.html(docs)
    }
  } else {
    return {
      ext: '.json',
      content: renderer.json(docs)
    }
  }
}

function resolveType(tsType: TSType | FlowType) {
  switch (tsType.type) {
    case 'TSStringKeyword':
      return 'string'
    case 'TSNumberKeyword':
      return 'number'
    case 'TSBooleanKeyword':
      return 'boolean'
  }
}

export const autoDocumentPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      (file as any).set('docs', [])
    },
    visitor: {
      FunctionDeclaration(path, state) {
        const docs = (state.file as any).get('docs')
        docs.push({
          type: 'function',
          name: path.get('id').toString(),
          params: path.get('params').map(paramPath => {
            return {
              name: paramPath.toString(),
              type: resolveType(paramPath.getTypeAnnotation())
            }
          }),
          return: resolveType(path.get('returnType').getTypeAnnotation()),
          doc: path.node.leadingComments && parseComment(path.node.leadingComments[0].value)
        });
        (state.file as any).set('docs', docs)
      },
      ClassDeclaration(path, state) {
        const docs = (state.file as any).get('docs')
        const classInfo: ClassInfo = {
          type: 'class',
          name: path.get('id').toString(),
          constructorInfo: {} as FunctionInfo,
          methodsInfo: [],
          propertiesInfo: []
        }
        if (path.node.leadingComments) {
          classInfo.doc = parseComment(path.node.leadingComments[0].value)
        }
        path.traverse({
          ClassProperty(path) {
            classInfo.propertiesInfo.push({
              name: path.get('key').toString(),
              type: resolveType(path.getTypeAnnotation()),
              doc: [path.node.leadingComments, path.node.trailingComments]
                .filter(Boolean)
                .map(comment => comment?.map(c => parseComment(c?.value)))
                .flat()
                .filter(Boolean) as any
            })
          },
          ClassMethod(path) {
            if (path.node.kind === 'constructor') {
              classInfo.constructorInfo = {
                name: 'Constructor',
                params: path.get('params').map(paramPath => {
                  return {
                    name: paramPath.toString(),
                    type: resolveType(paramPath.getTypeAnnotation()),
                    doc: parseComment(path.node.leadingComments?.[0]?.value)
                  }
                })
              }
            } else {
              classInfo.methodsInfo.push({
                name: path.get('key').toString(),
                doc: parseComment(path.node.leadingComments?.[0].value),
                params: path.get('params').map(paramPath => {
                  return {
                    name: paramPath.toString(),
                    type: resolveType(paramPath.getTypeAnnotation())
                  }
                }),
                return: resolveType(path.getTypeAnnotation())
              })
            }
          }
        })
        docs.push(classInfo);
        (state.file as any).set('docs', docs)
      }
    },
    post(file) {
      const docs = (file as any).get('docs')
      const res = generate(docs, options.format)
      fse.ensureDirSync(options.outputDir)
      fse.writeFileSync(join(options.outputDir, 'docs' + res.ext), res.content)
    }
  }
})
