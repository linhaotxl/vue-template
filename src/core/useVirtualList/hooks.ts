import { computed, shallowRef, ref, onMounted } from 'vue'
import type { Ref, HTMLAttributes, ComputedRef } from 'vue'

export interface UseVirtualListOptions {
  /**
   * 项目高度
   */
  itemHeight: number | ItemSize

  /**
   * 可视区域前后保留的项目个数
   *
   * @default 10
   */
  overscan?: number
}

export interface UseVirtualListReturn<T> {
  /**
   * 可视区的数据
   */
  list: Ref<VirtualItem<T>[]>

  /**
   * 容器节点的 props
   */
  containerProps: ContainerProps

  /**
   * 包裹节点的 props
   */
  wrapperProps: ComputedRef<WrapperProps>

  /**
   * 跳转至指定节点
   * @param {number} 节点索引
   */
  scrollTo(index: number): void
}

export type ItemSize = (index: number) => number

export type WrapperProps = HTMLAttributes

export interface ContainerProps extends HTMLAttributes {
  ref: Ref<HTMLElement | undefined>
}

export interface VirtualItem<T> {
  index: number
  data: T
}

type MaybeRef<T> = T | Ref<T>

export function useVirtualList<T>(
  source: MaybeRef<T[]>,
  options: UseVirtualListOptions
): UseVirtualListReturn<T> {
  console.log(1, source)
  const { overscan = 10, itemHeight } = options || {}

  const currentList = ref([]) as Ref<VirtualItem<T>[]>
  const container = ref<HTMLElement>()
  const startIndex = ref(0)
  const endIndex = ref(0)
  const sourceRef = shallowRef(source)
  const scrollTop = ref(0)

  // 列表总长度
  const totalHeight = computed(() => {
    const sourceList = sourceRef.value
    if (typeof itemHeight === 'number') {
      return sourceList.length * itemHeight
    }
    return sourceList.reduce((p, _, i) => (p += itemHeight(i)), 0)
  })

  /**
   * 滑动到 scrollTop 时的 startIndex
   * @param scrollTop
   * @returns
   */
  function getStartIndex(scrollTop: number) {
    // 固定高度: 滚动距离 / 高度
    if (typeof itemHeight === 'number') {
      return Math.floor(scrollTop / itemHeight)
    }

    // 动态高度
    // 遍历整个列表，直至高度 >= 滚动距离，此时的索引作为 startIndex
    let sum = 0
    let startIndex = 0
    const sourceList = sourceRef.value
    for (let i = 0; i < sourceList.length; ++i) {
      const height = itemHeight(i)
      sum += height

      if (sum >= scrollTop) {
        startIndex = i
        break
      }
    }
    return startIndex
  }

  /**
   * 获取可视区域内可以显示的个数
   * @param clientHeight
   * @returns
   */
  function getAreaCount(clientHeight: number) {
    // 固定高度
    // 容器高度 / 项目高度
    if (typeof itemHeight === 'number') {
      return Math.ceil(clientHeight / itemHeight)
    }

    // 动态高度
    // 从 startIndex 开始遍历，直至项目高度超过容器高度，将此时的索引 - 开始索引作为个数
    let count = 0
    let height = 0
    const _startIndex = startIndex.value
    const sourceList = sourceRef.value
    for (let i = _startIndex; i < sourceList.length; ++i) {
      height += itemHeight(i)

      if (height >= clientHeight) {
        count = i - _startIndex
        break
      }
    }
    return count
  }

  /**
   * 获取指定位置距离顶部的偏移
   * @param index
   * @returns
   */
  function getScrollTop(index: number) {
    // 固定高度
    // 开始索引 * 项目高度
    if (typeof itemHeight === 'number') {
      return index * itemHeight
    }

    // 动态高度
    // 计算 index 之前的每一个项目高度
    let offset = 0
    for (let i = index - 1; i >= 0; --i) {
      offset += itemHeight(i)
    }
    return offset
  }

  /**
   * 计算可视区域的列表
   * @returns
   */
  function calculateAreaData() {
    const element = container.value
    if (!element) {
      return
    }

    const sourceList = sourceRef.value

    // 1. 根据 scrollTop 计算 startIndex
    const _startIndex = getStartIndex(element.scrollTop)

    // 2. 可视区域可以显示的个数
    const areaCount = getAreaCount(element.clientHeight)

    // 3. startIndex 往前推 aboveCount，计算出 above 区域显示的个数，最小也要在 0
    const start = _startIndex - overscan
    const from = Math.max(0, start)

    // 4. endIndex 往后推 belowCount，计算出 bwlow 区域显示的个数，最大也只能是数组的长度
    const end = _startIndex + areaCount + overscan
    const to = Math.min(sourceList.length, end)

    // 5. 更新 startIndex 和 endIndex
    startIndex.value = from
    endIndex.value = to

    scrollTop.value = element.scrollTop

    // 6. 截取 startIndex 和 endIndex 之前的数据
    currentList.value = sourceList.slice(from, to).map((data, index) => ({
      data,
      index: from + index,
    }))
  }

  /**
   * 跳转到指定节点
   * @param index 指定节点索引
   */
  function scrollTo(index: number) {
    const element = container.value
    if (element) {
      element.scrollTop = getScrollTop(index)
    }
  }

  const offset = computed(() => getScrollTop(startIndex.value))
  const wrapperProps = computed<WrapperProps>(() => ({
    style: {
      width: '100%',
      height: `${totalHeight.value - offset.value}px`,
      marginTop: `${offset.value}px`,
    },
  }))

  const containerProps: ContainerProps = {
    style: { overflowY: 'auto' },
    ref: container,
    onScroll() {
      calculateAreaData()
    },
  }

  onMounted(() => {
    calculateAreaData()
  })

  return {
    list: currentList,
    wrapperProps,
    containerProps,
    scrollTo,
  }
}
