<script setup lang="ts">
import { useVirtualList } from '../core/useVirtualList'
import { ref } from 'vue'
import { genData, itemHeight } from './utils'

const initialData = genData(100)

const allItems = ref(initialData)

const index = ref<number>()
const containerHeight = ref(500)
const length = ref(initialData.length)

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  allItems,
  {
    itemHeight: i => itemHeight(i) + 16,
    overscan: 20,
  }
)
const handleScrollTo = () => {
  scrollTo(index.value!)
}

const handleChangeLength = () => {
  allItems.value = genData(length.value)
}
</script>

<template>
  <h2>Virtual List - Hooks</h2>

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

  <div
    class="container"
    v-bind="containerProps"
    :style="{ height: `${containerHeight}px` }"
  >
    <div class="wrap" v-bind="wrapperProps">
      <div
        v-for="{ data, index } in list"
        :key="index"
        :style="{ height: `${data.height}px` }"
        class="item"
      >
        <!-- {{ data.label }} -->
        Row {{ index }} {{ data.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 0.5rem;
  width: 400px;
  height: 100%;
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
