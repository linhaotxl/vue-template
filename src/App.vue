<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDarkMode = () => useToggle(isDark)
</script>

<template>
  <main text-center px-16 py-40>
    <span i-logos-unocss text-48 inline-block></span>

    <p mt-15 text-20 font-bold color-gray-400>UnoCSS</p>

    <p inline-flex gap-10 text-16 mt-16>
      <i i-carbon-sun dark:i-carbon-moon icon-btn @click="toggleDarkMode" />

      <a
        icon-btn
        i-carbon-logo-github
        href="https://github.com"
        target="_blank"
        title="Github"
      />
    </p>

    <section
      flex
      flex-wrap
      justify-around
      w-360
      mt-20
      p-10
      rounded-10
      card-shadow
      m-auto
      dark:b
    >
      <div w-50 h-50 b-1 rounded-4 p-10 m-20 flex-center>
        <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
      </div>

      <div w-50 h-50 b-1 rounded-4 p-10 m-20 flex justify-between>
        <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
        <span w-6 h-6 rounded-3 bg-black dark:bg-white self-end></span>
      </div>

      <div w-50 h-50 b-1 rounded-4 p-10 m-20 flex justify-between>
        <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
        <span w-6 h-6 rounded-3 bg-black dark:bg-white self-center></span>
        <span w-6 h-6 rounded-3 bg-black dark:bg-white self-end></span>
      </div>

      <div w-50 h-50 b-1 rounded-4 p-10 m-20 flex flex-col justify-between>
        <div flex justify-between>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
        </div>

        <div flex justify-between>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
        </div>
      </div>

      <div w-50 h-50 b-1 rounded-4 p-10 m-20 flex flex-col justify-between>
        <div flex justify-between>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
        </div>

        <span w-6 h-6 rounded-3 bg-black dark:bg-white self-center></span>

        <div flex justify-between>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
        </div>
      </div>

      <div w-50 h-50 b-1 rounded-4 p-10 m-20 flex justify-between>
        <div flex flex-col justify-between>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
        </div>

        <div flex flex-col justify-between>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
          <span w-6 h-6 rounded-3 bg-black dark:bg-white></span>
        </div>
      </div>
    </section>

    <p class="mt-20 text-14 color-gray-400">Flex骰子</p>
  </main>
</template>
