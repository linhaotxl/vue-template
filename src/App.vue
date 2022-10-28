<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const routes = router.getRoutes()
</script>

<template>
  <div class="root">
    <div class="header">
      <router-link v-for="route in routes" :key="route.name" :to="route.path">
        {{ route.name }}
      </router-link>

      <router-link to="/sbc"> 403 </router-link>
    </div>

    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.root {
  display: flex;
  overflow: auto;
  padding: 32px;
  height: 100%;
  flex-direction: column;
}

.content {
  flex: 1;
}
</style>
