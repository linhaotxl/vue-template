import { ElTableColumn } from 'element-plus'
import { defineComponent, h } from 'vue'

import { collectSlots } from '../../utils'

import type { PropType } from 'vue'

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
