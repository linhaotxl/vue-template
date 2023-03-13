<template>
  <el-container class="overflow-auto h-full">
    <el-header> Header </el-header>

    <el-container class="overflow-auto">
      <el-aside width="var(--aside-width)">
        <el-menu
          class="h-full"
          router
          :default-openeds="defaultOpeneds"
          :default-active="defaultActive"
        >
          <recursion-menu :menus="menus" />
        </el-menu>
      </el-aside>

      <el-main class="overflow-auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup name="BasicLayout">
import { useMenu } from '~/hooks'

const { menus, defaultOpeneds, defaultActive } = useMenu()
</script>
