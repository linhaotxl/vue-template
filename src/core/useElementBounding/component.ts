import { defineComponent, h, PropType, ref } from 'vue'
import { useElementBounding } from './useElementBounding'

const props = {
  as: {
    type: String as PropType<keyof HTMLElementTagNameMap>,
    default: 'div',
  },

  windowResize: {
    type: Boolean as PropType<boolean>,
    default: true,
  },

  windowScroll: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
}

export const UElementBounding = defineComponent({
  name: 'UElementBounding',

  props,

  setup(props, { slots }) {
    const container = ref<HTMLElement>()
    const rect = useElementBounding(container, {
      windowResize: props.windowResize,
      windowScroll: props.windowScroll,
    })

    return () => {
      return h(props.as, { ref: container }, slots.default?.(rect))
    }
  },
})
