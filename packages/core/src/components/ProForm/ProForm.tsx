import { ElForm, ElRow } from 'element-plus'
import { defineComponent, computed, h, ref } from 'vue'

import { ProFormMethhods } from './constant'
import { commonEmits, commonProps } from './props'
import { useForm } from './useForm'
import { normalizeFormCol } from './utils'

import type { NormalizeColProps, ElColProps } from './interface'
import type { FormProps } from 'element-plus'
import type { PropType, ExtractPropTypes } from 'vue'

const props = {
  ...commonProps,

  /**
   * tools 所在的 col props
   */
  toolsCol: [Number, Object] as PropType<number | ElColProps>,
}

export type ProFormProps = Partial<ExtractPropTypes<typeof props>> & FormProps

export const ProForm = defineComponent({
  name: 'ProForm',

  props,

  emits: [...commonEmits],

  expose: [...ProFormMethhods],

  setup(props, { slots, emit }) {
    const toolsColProps = computed(() => {
      const toolColProps: NormalizeColProps = {}
      normalizeFormCol(props.toolsCol || props.col, toolColProps)
      return toolColProps
    })
    const formRef = ref()
    const { values, methodsMap, renderSubmitter, setFieldValues } = useForm({
      formRef,
      props,
      submitterSlot: slots.submitter,
      emit,
    })
    return {
      ...methodsMap,
      values,
      formRef,
      toolsColProps,
      renderSubmitter,
      setFieldValues,
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
