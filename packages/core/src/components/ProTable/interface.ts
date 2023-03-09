export type ProTableRequestParams = {
  pageSize: number
  pageNum: number
  [name: string]: unknown
}

export type ProTableRequestResult<T> = {
  total: number
  data: T[]
  hasMore: boolean
}

export interface ProTableRequest<T = object> {
  (params: ProTableRequestParams): Promise<ProTableRequestResult<T>>
}

export interface ProTablePostDataFn<T = object> {
  (dataSource: T[]): T[]
}

// export type ProTablePostDataFn = <T>() => T[]
