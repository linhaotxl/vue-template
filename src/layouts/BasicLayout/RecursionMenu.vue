<template>
  <template v-for="menu in menus" :key="menu.name">
    <el-sub-menu v-if="menu.children" :key="menu.name" :index="menu.name">
      <template #title>{{ menu.title }}</template>

      <recursion-menu :menus="menu.children" />
    </el-sub-menu>

    <el-menu-item v-else :index="menu.name">{{ menu.title }}</el-menu-item>
  </template>
</template>

<script lang="ts" setup name="RecursionMenu">
import type { MenuOption } from '~/hooks'
defineProps<{
  menus: MenuOption[]
}>()
</script>
