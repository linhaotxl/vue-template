import { ElLoading } from 'element-plus'
import { watch } from 'vue'

import type { TableInstance } from 'element-plus'
import type { Ref } from 'vue'

export type UseLoadingOptions = Omit<
  Parameters<typeof ElLoading.service>[0],
  'target'
> & {
  target: Ref<TableInstance | undefined>
}

export function useLoading(options: UseLoadingOptions) {
  const { target, ...rest } = options
  let instance: ReturnType<typeof ElLoading.service> | undefined
  let $el: HTMLElement

  watch(target, el => {
    if (el) {
      console.log('el')
      $el = el.$el
    }
  })

  function open() {
    if (!instance && $el) {
      console.log('open loading')
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
