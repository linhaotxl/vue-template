import type { TableInstance } from 'element-plus'
import type { Ref } from 'vue'

export type ProTableRequestParams = {
  pageSize: number
  pageNum: number
  [name: string]: unknown
}

export type ProTableRequestResult<T> = Ref<{
  total: number
  data: T[]
}>

export interface ProTableRequest<T = any> {
  (params: ProTableRequestParams): ProTableRequestResult<T>
}

export interface ProTablePostDataFn<T = object> {
  (dataSource: T[]): T[]
}

export interface ProTableInstance extends TableInstance {
  reload: () => void
}
