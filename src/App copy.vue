<script setup lang="ts">
import UseHooks from './components/hooks-use.vue'
import UseComponent from './components/use-component.vue'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
// import HelloWorld from './components/HelloWorld.vue'
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

  <!-- <HelloWorld v-hello="true" :msg="'Vite + Vue'" /> -->
</template>

<style scoped>
.root {
  display: flex;
  height: 100%;
  gap: 64px;
}
</style>
