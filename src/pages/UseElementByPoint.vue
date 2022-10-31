<template>
  <div
    ref="boundary"
    fixed
    border
    border-white
    bg-fff5
    z--1
    :style="boundaryStyle"
  ></div>

  <div w-6 h-6 rounded-full fixed bg-f99 :style="dotStyle" z--1></div>
</template>

<script lang="ts" setup name="UseElementByPoint">
import { computed, CSSProperties, Ref, ref } from 'vue'
import { useElementBounding, useElementByPoint, useMouse } from '../core'

const boundary = ref<HTMLElement>()
const { x, y } = useMouse()
const { element } = useElementByPoint({ x, y })
const { left, top, width, height } = useElementBounding(
  element as Ref<HTMLElement | null | undefined>
)

const boundaryStyle = computed<CSSProperties>(() => ({
  left: left.value + 'px',
  top: top.value + 'px',
  width: width.value + 'px',
  height: height.value + 'px',
}))

const dotStyle = computed<CSSProperties>(() => ({
  left: `${x.value - 3}px`,
  top: `${y.value - 3}px`,
}))
</script>
