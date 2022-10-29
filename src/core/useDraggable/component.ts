import { computed, defineComponent, h, ref } from 'vue'
import type { PropType } from 'vue'
import { useDraggable } from './useDraggable'
import type {
  Position,
  ContainerElement,
  DraggableElement,
} from './useDraggable'

const props = {
  initialValue: Object as PropType<Position>,

  preventDefault: Boolean as PropType<boolean>,

  stopPropagation: Boolean as PropType<boolean>,

  draggingElement: Object as PropType<ContainerElement>,

  boundary: Object as PropType<ContainerElement>,

  handle: Object as PropType<DraggableElement>,
}

export const Draggable = defineComponent({
  name: 'Draggable',

  props,

  setup(props, { slots }) {
    const target = ref<HTMLElement | undefined>()

    const boundary = computed(() => props.boundary)
    const draggingElement = computed(() => props.draggingElement || window)
    const handle = computed(() => props.handle || target.value)
    const preventDefault = computed(() => props.preventDefault || false)
    const stopPropagation = computed(() => props.stopPropagation || false)

    const data = useDraggable(target, {
      boundary,
      preventDefault,
      stopPropagation,
      draggingElement,
      handle,
      initialValue: props.initialValue,
    })

    return () => {
      const children = slots.default?.(data)

      return h('div', { ref: target, style: { ...data.style.value } }, children)
    }
  },
})
