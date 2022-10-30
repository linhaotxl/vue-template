<template>
  <button type="button" @click="handleChangeTarget">Change Target</button>
  <div flex gap-32>
    <div
      ref="targetLeft"
      w-300
      h-300
      border
      border-dashed
      border-white
      flex-center
      text-white
    >
      <div flex flex-col>
        <span>状态: {{ target === targetLeft }}</span>
        <span>拖入到这里</span>
        <span>是否正在拖入: {{ isOverDropZone }}</span>
        <div v-if="files" flex flex-col>
          <span>文件列表</span>
          <div v-for="file in files" :key="file.name">{{ file.name }}</div>
        </div>
      </div>
    </div>

    <div
      ref="targetRight"
      w-300
      h-300
      border
      border-dashed
      border-white
      flex-center
      text-white
    >
      <div flex flex-col>
        <span>状态: {{ target === targetRight }}</span>
        <span>拖入到这里</span>
        <span>是否正在拖入: {{ isOverDropZone }}</span>
        <div v-if="files" flex flex-col>
          <span>文件列表</span>
          <div v-for="file in files" :key="file.name">{{ file.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="DropZone">
import { useDropZone } from '../core'
import { ref } from 'vue'

const target = ref<HTMLElement | undefined>()
const targetLeft = ref<HTMLElement | undefined>()
const targetRight = ref<HTMLElement | undefined>()

const { isOverDropZone, files } = useDropZone(target, {})

function handleChangeTarget() {
  target.value =
    target.value === targetLeft.value ? targetRight.value : targetLeft.value
}
</script>
