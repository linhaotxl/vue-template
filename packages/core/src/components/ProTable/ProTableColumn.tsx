import { ElTableColumn } from 'element-plus'
import { defineComponent, h } from 'vue'

import { collectSlots } from '../../utils'

import type { TableColumnCtx } from 'element-plus'
import type { PropType, ExtractPropTypes } from 'vue'

const props = {
  prop: String,

  hideInTable: {
    type: Boolean as PropType<boolean>,
    default: false,
  },

  hideInSearch: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
}

export type ProTableColumnProps<T> = Partial<ExtractPropTypes<typeof props>> &
  TableColumnCtx<T>

export const ProTableColumn = defineComponent({
  name: 'ProTableColumn',

  props,

  setup(props, { attrs, slots }) {
    return () => {
      const childSlots = collectSlots(slots, ['default', 'header'])

      return (
        <ElTableColumn {...attrs} prop={props.prop}>
          {childSlots}
        </ElTableColumn>
      )
    }
  },
})
