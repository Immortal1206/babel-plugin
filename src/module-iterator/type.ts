
export enum ImportType {
  named = 'named',
  default = 'default',
  namespace = 'namespace'
}

export enum ExportType {
  all = 'all',
  default = 'default',
  named = 'named'
}

interface Export {
  type: ExportType
  exported?: string
  local?: string
  source?: string
}
interface Import {
  type: ImportType
  imported?: string
  local?: string
}

export class DependencyNode {
  public path: string
  public imports: Record<string, Import[]>
  public exports: Export[]
  public subModules: Record<string, DependencyNode> = {}

  constructor(path = '', imports = {}, exports = []) {
    this.path = path
    this.imports = imports
    this.exports = exports
  }
}

