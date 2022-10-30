import { ref, computed, watch, unref, CSSProperties } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useEventListener } from '../useEventListener'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

export interface Position {
  x: number
  y: number
}

export type ContainerElement =
  | Window
  | Document
  | HTMLElement
  | null
  | undefined

export type DraggableElement = HTMLElement | null | undefined

export interface UseDraggableOptions {
  /**
   * 初始位置
   *
   * @default { x: 0, y: 0 }
   */
  initialValue?: MaybeRef<Position>

  /**
   * 拖拽容器
   *
   * @default window
   */
  draggingElement?: MaybeRef<ContainerElement>

  /**
   * 拖拽边界
   *
   * @default true
   */
  boundary?: MaybeRef<ContainerElement>

  /**
   * 是否阻止默认事件
   *
   * @default false
   */
  preventDefault?: MaybeRef<boolean | undefined>

  /**
   * 是否阻止冒泡
   *
   * @default false
   */
  stopPropagation?: MaybeRef<boolean | undefined>

  /**
   * 实际拖转的元素
   */
  handle?: MaybeRef<HTMLElement | undefined | null>
}

export interface UseDraggableReturn {
  /**
   * 是否在拖拽中
   */
  isDragging: ComputedRef<boolean>

  /**
   * 拖拽元素样式
   */
  style: ComputedRef<CSSProperties>
}

function resolveUnref<T>(value: MaybeRef<T>) {
  return unref(value) as T
}

export function useDraggable(
  target: MaybeRef<DraggableElement>,
  options?: UseDraggableOptions
): UseDraggableReturn {
  const {
    initialValue = { x: 0, y: 0 },
    draggingElement = window,
    handle = target,
    stopPropagation = false,
    preventDefault = false,
    boundary,
  } = options || {}

  const targetEl = computed(() => resolveUnref(target))
  const draggingEl = computed(() => resolveUnref(draggingElement))
  const handleEl = computed(() => resolveUnref(handle))

  const boundaryEl = computed(() => resolveUnref(boundary))
  const boundaryRect = ref<DOMRect | undefined>()

  const initial = resolveUnref(initialValue)
  const position = ref(initial)

  const pressed = ref(false)
  const pos: Position = { x: 0, y: 0 }

  watch(
    boundaryEl,
    boundary => {
      if (!boundary) {
        return
      }
      const rect = getBoundingClientRect(boundary)
      position.value = resolvePosition(rect, initial)
      boundaryRect.value = rect
    },
    { immediate: true }
  )

  useEventListener(handleEl, 'pointerdown', onPointerDown)
  useEventListener(draggingEl, 'pointermove', onPointerMove)
  useEventListener(draggingEl, 'pointerup', onPointerUp)

  /**
   * 指针按下事件
   * @param e
   */
  function onPointerDown(e: PointerEvent) {
    pressed.value = true

    // console.log(targetEl.value!, targetEl.value!.offsetLeft)
    // console.log(targetEl.value)
    pos.x = e.pageX - targetEl.value!.offsetLeft
    pos.y = e.pageY - targetEl.value!.offsetTop

    // console.log('pos: ', pos)

    handleAfterEvent(e)
  }

  /**
   * 指针移动事件
   * @param e
   * @returns
   */
  function onPointerMove(e: PointerEvent) {
    if (!pressed.value) {
      return
    }

    // console.log('pageX: ', e.pageX)
    let x = e.pageX - pos.x
    let y = e.pageY - pos.y

    const boundary = boundaryEl.value
    if (boundary) {
      const {
        left,
        top,
        right,
        bottom,
        width: containerWidth,
        height: containerHeight,
      } = boundaryRect.value!
      const { width, height } = getBoundingClientRect(targetEl.value!)

      if (x <= left) {
        x = left
      }

      // console.log(x, width, right)

      if (x + width >= right) {
        x = containerWidth - width + left
      }
      if (y <= top) {
        y = top
      }
      if (y + height >= bottom) {
        y = containerHeight - height + top
      }
    }

    position.value = { x, y }

    handleAfterEvent(e)
  }

  /**
   * 指针松开事件
   * @param e
   */
  function onPointerUp(e: PointerEvent) {
    // console.log('up')
    pressed.value = false
    pos.x = pos.y = 0

    handleAfterEvent(e)
  }

  /**
   * 事件结束后的回调，用于阻止冒泡、默认行为
   * @param e
   */
  function handleAfterEvent(e: PointerEvent) {
    if (unref(preventDefault)) {
      e.preventDefault()
    }
    if (unref(stopPropagation)) {
      console.log('阻止冒泡')
      e.stopPropagation()
    }
  }

  function resolvePosition(rect: DOMRect, pos: Position): Position {
    const { x, y } = pos
    const { left, top } = rect

    return { x: x + left, y: y + top }
  }

  return {
    isDragging: computed(() => !!pressed.value),
    style: computed<CSSProperties>(() => ({
      position: 'fixed',
      left: `${position.value.x}px`,
      top: `${position.value.y}px`,
    })),
  }
}

function getBoundingClientRect(el: Window | Document | HTMLElement): DOMRect {
  if (el === window) {
    return new DOMRect(0, 0, window.innerWidth, window.innerHeight)
  }
  if (el === document) {
    el = document.documentElement
  }
  return (el as HTMLElement).getBoundingClientRect()
}
