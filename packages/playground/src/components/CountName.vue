<template>
  <el-input :model-value="modelValue.name" @input="handleChangeName" />
  <el-input-number
    :model-value="modelValue.counter"
    @change="handleChangeCount"
  />
</template>

<script lang="ts" setup name="CountName">
type Value = {
  counter?: number
  name?: string
}

const emit = defineEmits<{
  (type: 'update:modelValue', value: Value): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: Value
  }>(),
  {
    modelValue: () => ({
      counter: undefined,
      name: undefined,
    }),
  }
)

function handleChangeName(name: string) {
  emit('update:modelValue', { name, counter: props.modelValue.counter })
}

function handleChangeCount(counter: number | undefined) {
  emit('update:modelValue', { name: props.modelValue.name, counter })
}
</script>
