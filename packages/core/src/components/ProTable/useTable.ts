import { ref, watch } from 'vue'

import type { ProTablePostDataFn, ProTableRequest } from './interface'
import type { Ref } from 'vue'

export interface UseTableOptions<T> {
  request?: ProTableRequest<T>
  postData?: ProTablePostDataFn<T>
  data?: T[]

  pageSize: number

  params?: object
}

export function useTable<T>(options: UseTableOptions<T>) {
  const {
    request,
    postData,
    data,
    params: paramsValue,
    pageSize: pageSizeValue,
  } = options

  const pageSize = ref(pageSizeValue)
  const pageNum = ref(1)
  const totalPage = ref(1)
  const dataSource = ref([]) as Ref<T[]>
  const loading = ref(false)
  const params = ref(paramsValue)

  // 观察 pageSize 和 pageNumber 的变化，修改时需要发起请求获取数据
  // 这里刷新的时机为 post，当 pageNum 和 pageSize 同时变化时
  // 如果为 pre，那么在 render 前刷新 pre 队列时是不会去重的，所以会触发两次
  // 如果为 post，那么会在 render 后刷新 post 对象，并且会去重
  watch(
    [pageNum, pageSize],
    ([currentPage, currentPageSize]) => {
      fetchTableData(currentPage, currentPageSize)
    },
    { immediate: true }
  )

  /**
   * 请求 Table 数据
   */
  function fetchTableData(currentPage: number, currentPageSize: number) {
    if (loading.value) return

    if (request) {
      loading.value = true

      const response = request({
        ...params.value,
        pageNum: currentPage,
        pageSize: currentPageSize,
      })

      watch(response, _response => {
        loading.value = false
        const data = _response.data ?? []
        dataSource.value = postData?.(data) ?? data
        totalPage.value = _response.total ?? 1
      })
    } else if (data) {
      dataSource.value = data
    }
  }

  /**
   * 刷新 Table
   */
  async function reload() {
    return await fetchTableData(pageNum.value, pageSize.value)
  }

  /**
   * 更新 params 重新发起请求
   */
  function updateParams(newParams: object) {
    pageNum.value = 1
    params.value = newParams
    reload()
  }

  return {
    dataSource,
    loading,
    pageNum,
    pageSize,
    totalPage,
    fetchTableData,
    reload,
    updateParams,
  }
}
