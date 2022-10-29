<script setup lang="ts">
import { ref } from 'vue'
import { Draggable } from './core/useDraggable'
import { useDraggable } from './core/useDraggable'
// import { useDraggable } from '@vueuse/core'

const box1 = ref<HTMLElement | undefined>()
const header = ref<HTMLElement | undefined>()

const content1 = ref<HTMLElement | undefined>()
const content3 = ref<HTMLElement | undefined>()

const { style: style1 } = useDraggable(box1, {
  boundary: content1,
  handle: header,
})

/**
 * 修改组件的 Boundary
 */
const compBoundary = ref<HTMLElement | Window | undefined>(content3.value)
function handleChangeCompBoundary() {
  compBoundary.value = compBoundary.value === window ? content3.value : window
}

const compDraggingElement = ref<HTMLElement | Window | undefined>(window)
function handleChangeCompDragging() {
  compDraggingElement.value =
    compDraggingElement.value === window ? content3.value : window
}

const compBox = ref<HTMLElement | undefined>()
const compHeaderHandle = ref<HTMLElement | undefined>()
const compHandle = ref<HTMLElement | undefined>(compHeaderHandle.value)
function handleCompHandle() {
  compHandle.value =
    compHandle.value === compBox.value ? compHeaderHandle.value : compBox.value
}

const compStoppropagation = ref(false)
function handleChangeCompStop() {
  compStoppropagation.value = !compStoppropagation.value
}

window.addEventListener('pointerdown', () => {
  console.log('冒泡的 pointerdown 事件')
})
</script>

<template>
  <div class="root">
    <div ref="content1" class="content">
      <div ref="box1" class="box" :style="style1">
        <h3 ref="header" class="header">基本信息</h3>
        <div class="info">
          <span>姓名：IconMan</span>
        </div>
      </div>
    </div>

    <div ref="content3" class="content">
      <button type="button" @click="handleChangeCompBoundary">
        Change Boundary
      </button>

      <button type="button" @click="handleChangeCompDragging">
        Change Dragging
      </button>

      <button type="button" @click="handleCompHandle">Change Handle</button>

      <button type="button" @click="handleChangeCompStop">Change Stop</button>

      <Draggable
        v-slot="{ isDragging }"
        :initial-value="{ x: 10, y: 10 }"
        :boundary="compBoundary"
        :handle="compHandle"
        :dragging-element="compDraggingElement"
        :stop-propagation="compStoppropagation"
      >
        <div ref="compBox" class="box">
          <h3 ref="compHeaderHandle" class="header">基本信息</h3>
          <div class="info">
            <div>姓名：IconMan</div>
            <div>拖拽：{{ isDragging }}</div>
          </div>
        </div>
      </Draggable>
    </div>
  </div>
</template>

<style scoped>
.root {
  display: flex;
  padding: 16px;
  width: 100%;
  height: 100%;
  gap: 16px;
  box-sizing: border-box;
}

.content {
  padding: 16px;
  width: 500px;
  height: 400px;
  border: 1px solid #ffffff;
}

.box {
  padding: 8px 16px;
  width: 100px;
  height: 100px;
  font-size: 12px;
  color: #333333;
  background-color: #ffffffee;
}

.info {
  display: flex;
  align-items: center;
}

.header {
  cursor: move;
}
</style>
