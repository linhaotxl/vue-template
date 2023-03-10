import { ElCol, ElFormItem } from 'element-plus'
import {
  defineComponent,
  inject,
  computed,
  watch,
  onBeforeUnmount,
  h,
  ref,
} from 'vue'

import {
  proFormBus,
  defaultProFormContext,
  ProFormProvideKey,
  ElFormItemMethods,
} from './constant'
import {
  isNumber,
  isObject,
  isUndefined,
  normalizeCol,
  normalizeFormCol,
} from './utils'
import { valueTypeMap, ValueTypes } from './valueTypes'

import { collectComponentMethods, collectSlots } from '../../utils'

import type {
  ElColProps,
  NormalizeColProps,
  ProFormContext,
  ProFormItemDefaultSlotParams,
  ProFormItemFieldSlotParams,
} from './interface'
import type { FormItemInstance } from 'element-plus'
import type { PropType, VNode } from 'vue'

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

  expose: [...ElFormItemMethods],

  setup(props, { slots }) {
    const { formState, formCol, submitOnChange, onSubmit } =
      inject<ProFormContext>(ProFormProvideKey, defaultProFormContext())

    const formItemRef = ref<FormItemInstance>()

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

    const methods = collectComponentMethods(ElFormItemMethods, formItemRef)

    return {
      ...methods,
      formItemRef,
      values: formState,
      submitOnChange,
      proFormItemCol,
      onSubmit,
    }
  },

  render() {
    const {
      values,
      valueType,
      valueEnum,
      prop,
      submitOnChange,
      fieldProps,
      proFormItemCol,
      onSubmit,
      $slots: slots,
      $attrs: attrs,
    } = this

    // 如果存在默认插槽，则交由默认插槽渲染
    const defaultChildren = slots.default?.({
      values,
    } as ProFormItemDefaultSlotParams)
    if (defaultChildren) {
      return defaultChildren
    }

    // 根据 valueType 获取渲染的子节点
    // const fieldProps = fieldProps
    const children =
      slots.field?.({
        values,
      } as ProFormItemFieldSlotParams) ??
      valueTypeMap[valueType]({
        formState: values,
        props: {
          prop: prop!,
          fieldProps: submitOnChange
            ? {
                ...fieldProps,
                async onChange(...args: unknown[]) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (fieldProps as any)?.onChange?.(...args)
                  onSubmit?.()
                },
              }
            : fieldProps,
          valueEnum: valueEnum,
        },
      })

    // 收集 ElFormItem 插槽
    const childrenSlots = collectSlots(slots, ['label', 'error'])
    childrenSlots.default = () => children as VNode[]

    return (
      <ElCol {...proFormItemCol}>
        <ElFormItem {...attrs} prop={prop} ref="formItemRef">
          {childrenSlots}
        </ElFormItem>
      </ElCol>
    )
  },
})
