<template>
  <div flex flex-col gap-32>
    <div ref="box1" w-full h-200 border border-white flex-center flex-col>
      <span>left: {{ box1Left }}</span>
      <span>top: {{ box1Top }}</span>
      <span>right: {{ box1Right }}</span>
      <span>bottom: {{ box1Bottom }}</span>
      <span>width: {{ box1Width }}</span>
      <span>height: {{ box1Height }}</span>
      <span>x: {{ box1X }}</span>
      <span>y: {{ box1Y }}</span>
    </div>

    <u-element-bounding
      v-slot="{ x, y, width, height, left, top, right, bottom, update }"
      class="w-200 h-200 border border-white flex-center flex-col"
      :window-scroll="false"
    >
      <span>left: {{ left }}</span>
      <span>top: {{ top }}</span>
      <span>right: {{ right }}</span>
      <span>bottom: {{ bottom }}</span>
      <span>width: {{ width }}</span>
      <span>height: {{ height }}</span>
      <span>x: {{ x }}</span>
      <span>y: {{ y }}</span>

      <button type="button" @click="update()">Update</button>
    </u-element-bounding>
  </div>

  <div w-full h-1000></div>
</template>

<script lang="ts" setup name="UseElementBoundingPage">
import { ref } from 'vue'
import { useElementBounding } from '../core'

const box1 = ref<HTMLElement>()
const {
  left: box1Left,
  top: box1Top,
  right: box1Right,
  bottom: box1Bottom,
  width: box1Width,
  height: box1Height,
  x: box1X,
  y: box1Y,
} = useElementBounding(box1)
</script>
