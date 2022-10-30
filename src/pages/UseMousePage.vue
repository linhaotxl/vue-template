<template>
  <div relative>
    <div fixed left-30 top-100 text-white>
      <h4>Page</h4>
      <div>x: {{ pageX }}</div>
      <div>y: {{ pageY }}</div>

      <h4>Client</h4>
      <div>x: {{ clientX }}</div>
      <div>y: {{ clientY }}</div>

      <u-mouse v-slot="{ x, y }">
        <h4>Comp Page</h4>
        <div>x: {{ x }}</div>
        <div>y: {{ y }}</div>
      </u-mouse>

      <u-mouse v-slot="{ x, y }" type="client">
        <h4>Comp Client</h4>
        <div>x: {{ x }}</div>
        <div>y: {{ y }}</div>
      </u-mouse>
    </div>

    <div
      ref="dropZone"
      w-300
      h-300
      border
      border-white
      ml-100
      text-white
      flex-center
      flex-col
    >
      <span>请将文件拖入这里</span>
      <span>状态: {{ isOverDropZone }}</span>
    </div>

    <div h-1000 w-full></div>
  </div>
</template>

<script lang="ts" setup name="UseMousePage">
import { ref } from 'vue'
import { useDropZone, useMouse } from '../core'

const { x: pageX, y: pageY } = useMouse()
const { x: clientX, y: clientY } = useMouse({ type: 'client' })

const dropZone = ref<HTMLElement>()
const { isOverDropZone } = useDropZone(dropZone)
</script>
