import { useMouse, UseMouseOptions } from './useMouse'
import { defineComponent, PropType } from 'vue'

const props = {
  type: String as PropType<UseMouseOptions['type']>,
}

export const UMouse = defineComponent({
  name: 'UMouse',

  props,

  setup(props, { slots }) {
    const { x, y } = useMouse({ type: props.type })

    return () => {
      return slots.default?.({ x, y })
    }
  },
})
