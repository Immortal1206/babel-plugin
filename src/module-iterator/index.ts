import fs from 'node:fs'
import path from 'node:path'

import { parse } from '@babel/parser'
import { NodePath, traverse } from '@babel/core'
import * as t from '@babel/types'

import {
  ImportType,
  ExportType,
  DependencyNode
} from './type'
import {
  moduleResolver,
  resolveBabelSyntaxtPlugins
} from './utils'

function traverseJsModule(
  curModulePath: string,
  dependencyGrapthNode: DependencyNode,
  allModules: Record<string, DependencyNode>
) {
  const moduleFileContent = fs.readFileSync(curModulePath, {
    encoding: 'utf-8'
  })
  dependencyGrapthNode.path = curModulePath

  const ast = parse(moduleFileContent, {
    sourceType: 'unambiguous',
    plugins: resolveBabelSyntaxtPlugins(curModulePath)
  })

  traverse(ast, {
    ImportDeclaration(path) {
      const subModulePath = moduleResolver(curModulePath, (path.get('source.value') as any).node)
      if (!subModulePath) {
        return
      }

      const specifierPaths = path.get('specifiers')
      dependencyGrapthNode.imports[subModulePath] = specifierPaths.map(specifierPath => {
        if (specifierPath.isImportSpecifier()) {
          return {
            type: ImportType.named,
            imported: (specifierPath.get('imported').node as t.Identifier).name,
            local: specifierPath.get('local').node.name
          }
        } else if (specifierPath.isImportDefaultSpecifier()) {
          return {
            type: ImportType.default,
            local: specifierPath.get('local').node.name
          }
        } else {
          return {
            type: ImportType.namespace,
            local: specifierPath.get('local').node.name
          }
        }
      })

      const subModule = new DependencyNode()
      traverseJsModule(subModulePath, subModule, allModules)
      dependencyGrapthNode.subModules[subModule.path] = subModule
    },
    ExportDeclaration(path) {
      if (path.isExportNamedDeclaration()) {
        const specifiers = path.get('specifiers')
        dependencyGrapthNode.exports = specifiers.map(specifierPath => ({
          type: ExportType.named,
          exported: (specifierPath.get('exported').node as t.Identifier).name,
          local: ((specifierPath.get('local') as NodePath).node as t.Identifier).name
        }))
      } else if (path.isExportDefaultDeclaration()) {
        let exportName
        const declarationPath = path.get('declaration')
        if (declarationPath.isAssignmentExpression()) {
          exportName = declarationPath.get('left').toString()
        } else {
          exportName = declarationPath.toString()
        }
        dependencyGrapthNode.exports.push({
          type: ExportType.default,
          exported: exportName
        })
      } else {
        // 或者可以读取子模块中的全部导出
        dependencyGrapthNode.exports.push({
          type: ExportType.all,
          source: path.get('source').toString()
        })
      }
    }
  })
  allModules[curModulePath] = dependencyGrapthNode
}

function traverseModule(curModulePath: string) {
  const dependencyGraph = {
    root: new DependencyNode(),
    allModules: {}
  }
  traverseJsModule(curModulePath, dependencyGraph.root, dependencyGraph.allModules)
  return dependencyGraph
}

const dependencyGraph = traverseModule(path.resolve(__dirname, './test-project/index.js'))
console.log(JSON.stringify(dependencyGraph, null, 4))