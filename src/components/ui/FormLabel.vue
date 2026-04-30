<script setup lang="ts">
  withDefaults(
    defineProps<{
      for?: string
      required?: boolean
    }>(),
    {
      for: undefined,
      required: false,
    },
  )
</script>

<template>
  <label :for="$props.for" class="block text-sm font-medium text-slate-700">
    <slot />
    <span v-if="required" class="text-red-500">*</span>
  </label>
</template>
