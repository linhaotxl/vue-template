<template>
  <h3>Counter</h3>
  <button @click="handlePause">pause</button>
  <button @click="handleResume">resume</button>
  <div>actived: {{ isActive }}</div>
  <div>{{ counter }}</div>
</template>

<script lang="ts" setup name="UseRafFn">
import { ref } from 'vue'
import { useRafFn } from '../core'
const counter = ref(0)
const { isActive, pause, resume } = useRafFn(update, { immediate: false })

function update() {
  console.log('update')
  counter.value++
}

function handlePause() {
  pause()
}

function handleResume() {
  resume()
}
</script>
