import { ElForm, ElRow } from 'element-plus'
import { computed, defineComponent, h, ref } from 'vue'

import { ElFormMethods } from './constant'
import { commonEmits, commonProps } from './props'
import { useForm } from './useForm'
import { colRanges, hasOwn, normalizeFormCol } from './utils'

import type { ElColProps, NormalizeColProps } from './interface'
import type { ExtractPropTypes, PropType } from 'vue'

const props = {
  ...commonProps,

  /**
   * 每个 ProFormItem 所在的 col
   */
  col: {
    type: [Number, Object] as PropType<number | ElColProps>,
    default: 4,
  },
}

export type QueryFilterProps = Partial<ExtractPropTypes<typeof props>>

export const QueryFilter = defineComponent({
  name: 'QueryFilter',

  props,

  emits: [...commonEmits],

  expose: [...ElFormMethods],

  setup(props, { slots, emit }) {
    const formRef = ref()
    const { values, formItemCols, methodsMap, renderSubmitter } = useForm({
      formRef,
      props,
      submitterSlot: slots.submitter,
      emit,
    })

    // 计算 submitter col props
    const toolsColProps = computed(() => {
      // 格式化 QueryFilter 的 props.col
      const formCol: NormalizeColProps = Object.create(null)
      normalizeFormCol(props.col, formCol)

      // 创建最终 submitter 的 col props 对象
      const submitterColProps: NormalizeColProps = Object.create(null)

      // 遍历所有的 ProFormItem，累加每一个 ProFormItem 的占位
      for (const prop in formItemCols) {
        // 获取 ProFormItem 的 col
        const colProps = formItemCols[prop]

        // 累加每一个 ProFormItem 的位置（包括 span + offset）
        accumulProFormItemCol(formCol, colProps, submitterColProps)

        // 遍历处理响应式的布局，同样累加在 toolColProps 中
        colRanges.forEach(range => {
          if (hasOwn(colProps, range)) {
            accumulProFormItemCol(
              formCol[range]!,
              colProps[range]!,
              (submitterColProps[range] ||= Object.create(null))
            )
          }
        })
      }

      return submitterColProps
    })

    /**
     * 累加每一个 ProFormItem 的 col，最终计算在 toolColProps
     * @param formCol QueryFilter 的 col
     * @param colProps ProFormItem 的 col
     * @param submitterColProps submitter 的 col
     */
    function accumulProFormItemCol(
      formCol: NormalizeColProps,
      colProps: NormalizeColProps,
      submitterColProps: NormalizeColProps
    ) {
      // submitter 的宽度是 form 上的 col 设置的宽度
      submitterColProps.span = formCol.span || 0
      // submitter 偏移最开始是一行宽度 - 自身宽度
      if (typeof submitterColProps.offset !== 'number') {
        submitterColProps.offset ||= 24 - submitterColProps.span
      }

      // 获取 ProFormItem 的宽度，此时已经是格式化好的，可以直接获取
      const colSpan = colProps.span || 0

      // 上一次剩余的偏移数 - 当前宽度
      submitterColProps.offset = submitterColProps.offset - colSpan

      if (submitterColProps.offset < 0) {
        if (Math.abs(submitterColProps.offset) > submitterColProps.span) {
          // 不需要换新行，可以在当前行挤挤：一行宽度 - item 宽度 - 提交栏自身宽度
          submitterColProps.offset = 24 - colSpan - submitterColProps.span
        } else {
          // 换新行：偏移就是一行宽度 - 提交栏自身宽度
          submitterColProps.offset = 24 - submitterColProps.span
        }
      }
    }

    return {
      ...methodsMap,
      values,
      formRef,
      toolsColProps,
      renderSubmitter,
    }
  },

  render() {
    const children = this.$slots.default?.()

    return (
      <ElForm {...this.$attrs} model={this.values} ref="formRef">
        <ElRow>
          {children}
          {this.renderSubmitter(this.toolsColProps)}
        </ElRow>
      </ElForm>
    )
  },
})
