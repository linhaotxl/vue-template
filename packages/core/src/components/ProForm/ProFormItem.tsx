import { ElCol, ElFormItem } from 'element-plus'
import {
  defineComponent,
  inject,
  computed,
  watch,
  onBeforeUnmount,
  h,
} from 'vue'

import {
  proFormBus,
  defaultProFormContext,
  ProFormProvideKey,
} from './constant'
import {
  isNumber,
  isObject,
  isUndefined,
  normalizeCol,
  normalizeFormCol,
} from './utils'
import { valueTypeMap, ValueTypes } from './valueTypes'

import type {
  ElColProps,
  NormalizeColProps,
  ProFormContext,
  ProFormItemDefaultSlotParams,
  ProFormItemFieldSlotParams,
} from './interface'
import type { PropType } from 'vue'

const props = {
  valueType: {
    type: String as PropType<ValueTypes>,
    default: ValueTypes.Text,
  },

  valueEnum: Array as PropType<{ label: string; value: unknown }[]>,

  prop: String as PropType<string>,

  fieldProps: Object as PropType<Record<string, unknown>>,

  col: [Number, Object] as PropType<number | ElColProps>,
}

export const ProFormItem = defineComponent({
  name: 'ProFormItem',

  props,

  setup(props, { attrs, slots }) {
    const { formState, formCol } = inject<ProFormContext>(
      ProFormProvideKey,
      defaultProFormContext()
    )

    // el-col props
    // 如果 ProFormItem 传递了 col，则对其格式化，否则使用 ProForm 上的 col
    const proFormItemCol = computed(() => {
      const col = props.col
      if (isNumber(col) || isObject(col)) {
        return normalizeCol(col)
      }
      return normalizeCol(formCol.value)
    })

    // 监听 col 的变化
    watch(
      () => props.col,
      col => {
        // 如果存在 default 插槽，什么也不做，交由 default 插槽的 ProFormItem 处理
        if (slots.default) {
          return
        }
        const colProps: NormalizeColProps = {}

        // 如果没有传递 col，则使用 ProForm 的 col
        if (isUndefined(col)) {
          const formColValue = formCol.value
          normalizeFormCol(formColValue, colProps)
        } else {
          normalizeFormCol(col, colProps)
        }

        // console.log(111)
        // col 发生变化时，需要通知 ProForm
        proFormBus.emit('colSize', {
          prop: props.prop as string,
          col: colProps,
        })
      },
      { immediate: true }
    )

    onBeforeUnmount(() => {
      // 如果存在 default 插槽，什么也不做，交由 default 插槽的 ProFormItem 处理
      if (slots.default) {
        return
      }

      // 通知 ProForm，ProFormItem 卸载了，需要清除 col 的信息
      proFormBus.emit('colSize', {
        prop: props.prop as string,
        col: null,
      })

      // 通知 ProForm，ProFormItem 卸载了，需要清除 formState 中的值
      proFormBus.emit('preserve', props.prop)
    })

    return () => {
      // 如果存在默认插槽，则交由默认插槽渲染
      const defaultChildren = slots.default?.({
        values: formState,
      } as ProFormItemDefaultSlotParams)
      if (defaultChildren) {
        return defaultChildren
      }

      // 根据 valueType 获取渲染的子节点
      const children =
        slots.field?.({ values: formState } as ProFormItemFieldSlotParams) ??
        valueTypeMap[props.valueType]({ formState, props })

      return (
        <ElCol {...proFormItemCol.value}>
          <ElFormItem {...attrs} prop={props.prop}>
            {children}
          </ElFormItem>
        </ElCol>
      )
    }
  },
})
