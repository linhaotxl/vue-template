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
  submitOnChange: false,
})

export const proFormBus = useEventBus<
  ProFormBusEventType,
  ProFormBusEventPayload
>('ProForm')

export const ElFormMethods: string[] = [
  'validate',
  'validateField',
  'resetFields',
  'scrollToField',
  'clearValidate',
]

export const ElFormItemMethods: string[] = [
  // 'size',
  // 'validateMessage',
  // 'validateState',
  'validate',
  'resetField',
  'clearValidate',
]
