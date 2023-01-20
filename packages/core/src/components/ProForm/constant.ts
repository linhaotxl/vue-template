import { useEventBus } from '@vueuse/core'
import { computed } from 'vue'

import type {
  ProFormBusEventType,
  ProFormContext,
  ProFormBusEventPayload,
} from './interface'

export const ProFormProvideKey = Symbol()

export const defaultProFormContext = (): ProFormContext => ({
  formState: {},
  formCol: computed(() => 24),
})

export const proFormBus = useEventBus<
  ProFormBusEventType,
  ProFormBusEventPayload
>('ProForm')
