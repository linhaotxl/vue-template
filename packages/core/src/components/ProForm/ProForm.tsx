import { ElForm, ElRow } from 'element-plus'
import { defineComponent, computed } from 'vue'

import { commonEmits, commonProps } from './props'
import { useForm } from './useForm'
import { normalizeFormCol } from './utils'

import type { NormalizeColProps, ElColProps } from './interface'
import type { PropType } from 'vue'

const props = {
  ...commonProps,

  /**
   * tools 所在的 col props
   */
  toolsCol: [Number, Object] as PropType<number | ElColProps>,
}

export const ProForm = defineComponent({
  name: 'ProForm',

  props,

  emits: [...commonEmits],

  setup(props, { attrs, slots, emit }) {
    const toolsColProps = computed(() => {
      const toolColProps: NormalizeColProps = {}
      normalizeFormCol(props.toolsCol || props.col, toolColProps)
      return toolColProps
    })

    const { values, formRef, renderSubmitter } = useForm({
      props,
      toolsColProps,
      submitterSlot: slots.submitter,
      emit,
    })

    return () => {
      const children = slots.default?.()

      return (
        <ElForm {...attrs} model={values} ref={formRef}>
          <ElRow>
            <>
              {children}
              {renderSubmitter()}
            </>
          </ElRow>
        </ElForm>
      )
    }
  },
})
