<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      modelValue: string | number | null | undefined
      id?: string
      type?: string
      error?: boolean
    }>(),
    {
      id: undefined,
      type: 'text',
      error: false,
    },
  )

  defineEmits<{
    (e: 'update:modelValue', value: string): void
  }>()

  const base =
    'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1'

  const stateClass = computed(() =>
    props.error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500',
  )
</script>

<template>
  <input
    :id="id"
    :type="type"
    :value="modelValue ?? ''"
    :class="[base, stateClass]"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
