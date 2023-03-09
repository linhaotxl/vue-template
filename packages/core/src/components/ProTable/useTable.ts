import { ref, watch } from 'vue'

import type { ProTableRequest } from './interface'
import type { PaginationProps } from 'element-plus'

export interface UseTableOptions {
  request?: ProTableRequest

  data?: object[]

  // pagination: false | PaginationProps

  pageSize: number

  params?: object
}

export function useTable(options: UseTableOptions) {
  const {
    request,
    data,
    params: paramsValue,
    pageSize: pageSizeValue,
  } = options

  const pageSize = ref(pageSizeValue)
  const pageNum = ref(1)
  const dataSource = ref<object[]>([])
  const loading = ref(false)
  const params = ref(paramsValue)

  watch(
    () => params,
    newParams => {
      params.value = newParams
      goToPage(1)
    }
  )

  /**
   * 请求 Table 数据
   */
  async function fetchTableData(currentPage: number) {
    loading.value = true
    pageNum.value = currentPage

    if (request) {
      const result = await request({
        ...params.value,
        pageNum: pageNum.value,
        pageSize: currentPage,
      })

      dataSource.value = result.data
      if (result.hasMore) {
        pageNum.value++
      }
    } else if (data) {
      dataSource.value = data
    }

    loading.value = false
  }

  /**
   * 刷新 Table
   */
  async function reload() {
    return await fetchTableData(pageNum.value)
  }

  /**
   * 获取指定页数 Table 数据
   */
  async function goToPage(currentPage: number) {
    return await fetchTableData(currentPage)
  }

  return {
    dataSource,
    loading,
    pageNum,
    pageSize,
    fetchTableData,
    reload,
    goToPage,
  }
}
