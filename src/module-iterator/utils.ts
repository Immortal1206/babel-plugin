import { ParserPlugin } from '@babel/parser'
import fs from 'node:fs'
import path from 'node:path'

export const visitedModules = new Set<string>()

export function isDirectory(filePath: string) {
  try {
    return fs.statSync(filePath).isDirectory()
  } catch (e) { }
  return false
}

export function completeModulePath(modulePath: string) {
  const EXTS = ['.tsx', '.ts', '.jsx', '.js']
  if (modulePath.match(/\.[a-zA-Z]+$/)) {
    return modulePath
  }

  function tryCompletePath(resolvePath: (ext: string) => string) {
    for (let i = 0; i < EXTS.length; i++) {
      let tryPath = resolvePath(EXTS[i])
      if (fs.existsSync(tryPath)) {
        return tryPath
      }
    }
  }

  function reportModuleNotFoundError(modulePath: string) {
    throw 'module not found: ' + modulePath
  }

  if (isDirectory(modulePath)) {
    const tryModulePath = tryCompletePath((ext) => path.join(modulePath, 'index' + ext))
    if (!tryModulePath) {
      reportModuleNotFoundError(modulePath)
    } else {
      return tryModulePath
    }
  } else if (!EXTS.some(ext => modulePath.endsWith(ext))) {
    const tryModulePath = tryCompletePath((ext) => modulePath + ext)
    if (!tryModulePath) {
      reportModuleNotFoundError(modulePath)
    } else {
      return tryModulePath
    }
  }
  return modulePath
}

export function resolveBabelSyntaxtPlugins(modulePath: string): ParserPlugin[] {
  const plugins = []
  if (['.tsx', '.jsx'].some(ext => modulePath.endsWith(ext))) {
    plugins.push('jsx')
  }
  if (['.ts', '.tsx'].some(ext => modulePath.endsWith(ext))) {
    plugins.push('typescript')
  }
  return plugins as ParserPlugin[]
}

export function moduleResolver(curModulePath: string, requirePath: string) {

  requirePath = path.resolve(path.dirname(curModulePath), requirePath)

  // 过滤掉第三方模块
  if (requirePath.includes('node_modules')) {
    return ''
  }

  requirePath = completeModulePath(requirePath)

  if (visitedModules.has(requirePath)) {
    return ''
  } else {
    visitedModules.add(requirePath)
  }
  return requirePath
}