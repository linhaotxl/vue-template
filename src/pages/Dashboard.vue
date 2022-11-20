<template>
  <h2>Dashboard Layout</h2>

  <hello-world :msg="'2'" />

  <TextCompTsx />

  <el-link href="https://element.eleme.io" target="_blank">default</el-link>

  <router-view />
</template>

<script lang="ts" setup name="DashboardLayout"></script>
