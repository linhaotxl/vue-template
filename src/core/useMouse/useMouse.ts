import { ref } from 'vue'
import type { Ref } from 'vue'
import { useEventListener } from '../useEventListener'

export interface UseMouseOptions {
  /**
   * 鼠标位置通过页面(page)获取还是通过可视区(client)获取
   *
   * @default 'page'
   */
  type?: 'page' | 'client'
}

export interface UseMouseReturn {
  /**
   * 横坐标位置
   */
  x: Ref<number>

  /**
   * 纵坐标位置
   */
  y: Ref<number>
}

export function useMouse(options: UseMouseOptions = {}): UseMouseReturn {
  const { type = 'page' } = options

  const x = ref(0)
  const y = ref(0)

  useEventListener(window, 'mousemove', handleMouseMove)
  useEventListener(window, 'dragover', handleMouseMove)

  function handleMouseMove(e: MouseEvent) {
    const _x = type === 'page' ? e.pageX : e.clientX
    const _y = type === 'page' ? e.pageY : e.clientY

    x.value = _x
    y.value = _y
  }

  return { x, y }
}
