import { Annotation } from 'doctrine'

interface BasicInfo {
  name: string
  type?: string
  doc?: /* Annotation[] | */ Annotation
}

export interface FunctionInfo extends BasicInfo {
  params?: BasicInfo[]
  return?: string
}

export interface ClassInfo extends BasicInfo {
  constructorInfo: FunctionInfo
  propertiesInfo: BasicInfo[]
  methodsInfo: FunctionInfo[]
}

export type Info = (ClassInfo | FunctionInfo)[]