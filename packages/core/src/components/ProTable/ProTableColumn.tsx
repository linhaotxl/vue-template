import { ElTableColumn } from 'element-plus'
import { defineComponent } from 'vue'

import { collectSlots } from './utils'

import type { PropType, Slot } from 'vue'

const ProTableColumnProps = {
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

export const ProTableColumn = defineComponent({
  name: 'ProTableColumn',

  props: ProTableColumnProps,

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
