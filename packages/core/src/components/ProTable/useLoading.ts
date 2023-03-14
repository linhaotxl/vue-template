import { ElLoading } from 'element-plus'
import { watch } from 'vue'

import type { TableInstance } from 'element-plus'
import type { Ref } from 'vue'

export type UseLoadingOptions = Omit<
  Parameters<typeof ElLoading.service>[0],
  'target'
> & {
  target: Ref<TableInstance | undefined>

  loading: Ref<boolean>
}

export function useLoading(options: UseLoadingOptions) {
  const { target, loading, ...rest } = options
  let instance: ReturnType<typeof ElLoading.service> | undefined
  let $el: HTMLElement

  watch([target, loading], ([el, loading]) => {
    if (el) {
      $el = el.$el
    }

    loading ? open() : close()
  })

  function open() {
    if (!instance && $el) {
      instance = ElLoading.service({ ...rest, target: $el })
    }
  }

  function close() {
    if (instance) {
      instance.close()
      instance = undefined
    }
  }

  return {
    open,
    close,
  }
}
