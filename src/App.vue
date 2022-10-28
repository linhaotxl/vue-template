<script setup lang="ts">
import UseHooks from './components/hooks-use.vue'
import UseComponent from './components/use-component.vue'
</script>

<template>
  <div class="root">
    <div>
      <use-hooks />
    </div>

    <div>
      <use-component />
    </div>
  </div>
</template>

<style scoped>
.root {
  display: flex;
  height: 100%;
  gap: 64px;
}
</style>
