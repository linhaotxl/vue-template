<template>
  <div>
    <h2>Number Storage</h2>

    <div flex gap-16>
      <!-- <button type="button" @click="handleClickNumberStorage">change</button> -->

      <button type="button" @click="handleChangeName">Change Name</button>

      <button type="button" @click="handleChangeProvince">
        Change Province
      </button>
    </div>

    <pre> {{ JSON.stringify(state1, null, 2) }}</pre>
    <!-- <pre> {{ JSON.stringify(state2, null, 2) }}</pre> -->
  </div>
</template>

<script lang="ts" setup name="UseStorage">
import { EventFilter } from '@/core/shared'
import { watch } from 'vue'
import { useStorage } from '../core'
// import { useStorage } from '@vueuse/core'

interface Info {
  address: {
    province: string
    city: string
    area: string
  }
  country: string
  name?: string
}

const debounceFilter: EventFilter = invoke => {
  let timer: number | undefined

  clearTimeout(timer)
  timer = setTimeout(() => {
    invoke()
  }, 10000)
}

const provinces: string[] = ['甘肃省', '浙江省', '陕西省', '四川省', '广东省']

sessionStorage.setItem('key3', 'null')
useStorage('key3', null, sessionStorage)

// const state1 = useStorage<Info>(
//   'key1',
//   {
//     address: {
//       province: '甘肃',
//       city: '兰州市',
//       area: '七里河区',
//     },
//     country: '中国',
//   },
//   sessionStorage,
//   {
//     mergeDefaults: true,
//     eventFilter: debounceFilter,
//   }
// )

// function handleChangeName() {
//   if (state1.value) {
//     state1.value.name = 'Nicholas'
//   }
// }

// let i = 0
// function handleChangeProvince() {
//   if (state1.value) {
//     state1.value.address.province = provinces[i++]
//     if (i === 5) {
//       i = 0
//     }
//   }
// }

// watch(state1, state => {
//   console.log('state1: ', state)
// })
</script>
