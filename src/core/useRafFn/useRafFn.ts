import { Ref, ref } from 'vue'

export interface UseRafFnOptions {
  /**
   * 是否立即执行
   *
   * @default true
   */
  immediate?: boolean
}

export interface UseRafFnReturn {
  /**
   * 是否正在执行状态
   */
  isActive: Ref<boolean>

  /**
   * 恢复方法
   */
  resume: () => void

  /**
   * 暂停方法
   */
  pause: () => void
}

export function useRafFn(fn: () => void, options: UseRafFnOptions = {}) {
  const { immediate = true } = options
  const isActive = ref(false)
  let rafId: number | undefined

  /**
   * 循环执行 fn
   */
  function loop() {
    fn()
    rafId = window.requestAnimationFrame(loop)
  }

  /**
   * 恢复方法
   */
  function resume() {
    if (!isActive.value && rafId === undefined) {
      isActive.value = true
      loop()
    }
  }

  /**
   * 暂停方法
   */
  function pause() {
    if (isActive.value && rafId !== undefined) {
      window.cancelAnimationFrame(rafId)
      rafId = undefined
      isActive.value = false
    }
  }

  if (immediate) {
    resume()
  }

  return {
    isActive,
    resume,
    pause,
  }
}
