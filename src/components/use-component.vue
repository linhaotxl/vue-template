<script lang="ts" setup>
import { ref } from 'vue'
import { genData, itemHeight } from './utils'
import type { VirtualListInstance } from '../core/useVirtualList'

const initialData = genData(100)

const allItems = ref(initialData)

const virtualList = ref<VirtualListInstance | null>(null)

const index = ref<number>()
const containerHeight = ref(500)
const length = ref(initialData.length)

const handleScrollTo = () => {
  virtualList.value?.scrollTo(index.value!)
}

const handleChangeLength = () => {
  allItems.value = genData(length.value)
}
</script>

<template>
  <h2>Virtual List - Component</h2>

  <div class="input">
    <span>Jump to index</span>
    <input v-model="index" placeholder="Index" type="number" />
    <button type="button" @click="handleScrollTo">Go</button>
  </div>

  <div class="input">
    <span>Change Element Size</span>
    <input v-model="containerHeight" placeholder="size" type="number" />
  </div>

  <div class="input">
    <span>Change Source Length</span>
    <input v-model="length" placeholder="length" type="number" />
    <button type="button" @click="handleChangeLength">Change Length</button>
  </div>

  <VirtualList
    ref="virtualList"
    :item-height="i => itemHeight(i) + 16"
    :source="allItems"
    class="container"
    :style="{ height: `${containerHeight}px` }"
  >
    <template #default="{ index, data }">
      <div class="item" :style="{ height: `${data.height}px` }">
        Row {{ index }} {{ data.label }}
      </div>
    </template>
  </VirtualList>
</template>

<style scoped>
.container {
  padding: 0.5rem;
  width: 400px;

  /* height: 100%; */
  border: 1px solid #ffffffcc;
  box-sizing: border-box;
}

.item {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  border: 1px solid #ffffffee;
  box-sizing: border-box;
}

.input {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}
</style>
