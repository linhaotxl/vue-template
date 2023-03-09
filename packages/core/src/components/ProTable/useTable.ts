import { ref, watch } from 'vue'

import type { ProTablePostDataFn, ProTableRequest } from './interface'
import type { Ref } from 'vue'

export interface UseTableOptions<T> {
  request?: ProTableRequest<T>
  postData?: ProTablePostDataFn<T>
  onError?: (err: Error) => void
  data?: T[]

  pageSize: number

  params?: object
}

export function useTable<T>(options: UseTableOptions<T>) {
  const {
    request,
    postData,
    onError,
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

  watch(
    params,
    () => {
      goToPage(1)
    },
    { immediate: true }
  )

  // 观察 pageSize 和 pageNumber 的变化，修改时需要发起请求获取数据
  // 这里刷新的时机为 post，当 pageNum 和 pageSize 同时变化时
  // 如果为 pre，那么在 render 前刷新 pre 队列时是不会去重的，所以会触发两次
  // 如果为 post，那么会在 render 后刷新 post 对象，并且会去重
  watch(
    [pageNum, pageSize],
    ([currentPage, currentPageSize]) => {
      console.log('change pageNum: ', currentPage, currentPageSize)
      fetchTableData(currentPage, currentPageSize)
    },
    { flush: 'post' }
  )

  // watch(
  //   loading,
  //   newLoading => {
  //     console.log('newLoading: ', newLoading)
  //   },
  //   { immediate: true }
  // )

  /**
   * 请求 Table 数据
   */
  function fetchTableData(currentPage: number, currentPageSize: number) {
    pageNum.value = currentPage
    pageSize.value = currentPageSize

    if (request) {
      loading.value = true

      request({
        ...params.value,
        pageNum: currentPage,
        pageSize: currentPageSize,
      })
        .then(result => {
          dataSource.value = postData?.(result.data) ?? result.data
          totalPage.value = result.total
        })
        .catch(e => {
          onError?.(e instanceof Error ? e : new Error(e))
        })
        .finally(() => {
          loading.value = false
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
   * 获取指定页数 Table 数据
   */
  async function goToPage(currentPage: number) {
    return await fetchTableData(currentPage, pageSize.value)
  }

  /**
   * 更新 params 重新发起请求
   */
  function updateParams(newParams: object) {
    params.value = newParams
  }

  return {
    dataSource,
    loading,
    pageNum,
    pageSize,
    totalPage,
    fetchTableData,
    reload,
    goToPage,
    updateParams,
  }
}
