// export type
import type { PresetName } from './presets'
import type { Arrayable } from '@antfu/utils'

export type ImportNameAlias = [string, string]

/**
 * key: 是模块名
 * value:
 *  导入成员的字符串列表
 *  导入成员可重写本地名称的列表
 */
export type ImportsMap = Record<string, (string | ImportNameAlias)[]>

type ModuleId = string
type ImportName = string
export interface ImportCommon {
  /**
   * 导入的模块名
   */
  from: ModuleId
}

export interface Import extends ImportCommon {
  /**
   * 导入的名称
   */
  name: ImportName

  /**
   * 重写为本地的名称
   */
  as: ImportName
}

export interface Options {
  imports?: Arrayable<PresetName | ImportsMap>
}
