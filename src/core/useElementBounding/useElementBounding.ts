import { computed, onMounted, Ref, ref, watch } from 'vue'
import { MaybeRef, resolveUnref } from '../shared'
import { useEventListener } from '../useEventListener'

export interface UseElementBoundingOptions {
  /**
   * 是否监听窗口变化事件
   *
   * @default true
   */
  windowResize?: boolean

  /**
   * 是否监听窗口滚动事件
   *
   * @default true
   */
  windowScroll?: boolean

  /**
   * 挂载成功后立即获取
   */
  immediate?: boolean
}

export interface UseElementBoundingReturn {
  x: Ref<number>

  y: Ref<number>

  width: Ref<number>

  height: Ref<number>

  left: Ref<number>

  top: Ref<number>

  right: Ref<number>

  bottom: Ref<number>

  update: () => void
}

export function useElementBounding(
  target: MaybeRef<HTMLElement | undefined | null>,
  options: UseElementBoundingOptions = {}
) {
  const { windowResize = true, windowScroll = true, immediate = true } = options
  const x = ref(0)
  const y = ref(0)
  const width = ref(0)
  const height = ref(0)
  const left = ref(0)
  const top = ref(0)
  const right = ref(0)
  const bottom = ref(0)

  const targetEl = computed(() => resolveUnref(target))

  watch(targetEl, el => {
    el && update()
  })

  windowResize && useEventListener(window, 'resize', update)
  windowScroll && useEventListener(window, 'scroll', update)

  onMounted(() => {
    immediate && update()
  })

  function update() {
    const el = resolveUnref(target)
    if (!el) {
      return
    }

    const rect = el.getBoundingClientRect()

    x.value = rect.x
    y.value = rect.y
    width.value = rect.width
    height.value = rect.height
    left.value = rect.left
    right.value = rect.right
    top.value = rect.top
    bottom.value = rect.bottom
  }

  return {
    update,
    x,
    y,
    width,
    height,
    left,
    top,
    right,
    bottom,
  }
}
