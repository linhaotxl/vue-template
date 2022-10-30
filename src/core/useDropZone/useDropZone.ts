import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { resolveUnref } from '../shared/index'
import type { MaybeRef } from '../shared'
import { useEventListener } from '../useEventListener'

export interface UseDropZoneOptions {
  /**
   * 拖入目标元素内的事件
   */
  onDragEnter?: (e: DragEvent) => void

  /**
   * 在目标元素内拖动的事件
   */
  onDragOver?: (e: DragEvent) => void

  /**
   * 拖出目标元素的事件
   */
  onDragLeave?: (e: DragEvent) => void

  /**
   * 在目标元素内放下拖拽元素的事件
   */
  onDrop?: (e: DragEvent) => void
}

export interface UseDropZoneReturn {
  /**
   * 是否在目标元素内拖动
   */
  isOverDropZone: Ref<boolean>

  /**
   * 拖入的文件列表
   */
  files: Ref<File[] | null>
}

export function useDropZone(
  target: MaybeRef<HTMLElement | undefined | null>,
  options: UseDropZoneOptions = {}
): UseDropZoneReturn {
  const { onDragEnter, onDragOver, onDragLeave, onDrop } = options
  const isOverDropZone = ref(false)
  const files = ref<File[] | null>(null)

  useEventListener(target, 'dragenter', handleDragEnter)
  useEventListener(target, 'dragover', handleDragOver)
  useEventListener(target, 'dragleave', handleDragLeave)
  useEventListener(target, 'drop', handleDrop)

  const targetEl = computed(() => resolveUnref(target))

  // target 变化时清空数据
  watch(targetEl, () => {
    isOverDropZone.value = false
    files.value = null
  })

  /**
   * 拖入目标元素内的事件
   * @param e
   */
  function handleDragEnter(e: DragEvent) {
    e.preventDefault()
    isOverDropZone.value = true
    onDragEnter?.(e)
  }

  /**
   * 在目标元素内拖动的事件
   * @param e
   */
  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    onDragOver?.(e)
  }

  /**
   * 拖出目标元素的事件
   * @param e
   */
  function handleDragLeave(e: DragEvent) {
    isOverDropZone.value = false
    onDragLeave?.(e)
  }

  /**
   * 在目标元素内放下拖拽元素的事件
   * @param e
   */
  function handleDrop(e: DragEvent) {
    e.preventDefault()

    const dragFiles = Array.from(e.dataTransfer?.files ?? [])
    onDrop?.(e)

    isOverDropZone.value = false
    files.value = dragFiles.length === 0 ? null : dragFiles
  }

  return {
    isOverDropZone,
    files,
  }
}
