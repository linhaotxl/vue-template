export type ProTableRequestParams = {
  pageSize: number
  pageNum: number
  [name: string]: unknown
}

export type ProTableRequestResult = {
  total: number
  data: object[]
  hasMore: boolean
}

export type ProTableRequest = (
  params: ProTableRequestParams
) => Promise<ProTableRequestResult>
