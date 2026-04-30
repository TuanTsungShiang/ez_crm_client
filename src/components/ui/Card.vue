<script setup lang="ts">
  import { computed } from 'vue'

  type Padding = 'sm' | 'md'

  const props = withDefaults(
    defineProps<{
      padding?: Padding
    }>(),
    {
      padding: 'md',
    },
  )

  const paddingClass: Record<Padding, string> = {
    sm: 'p-4',
    md: 'p-6',
  }

  const classes = computed(() => [
    'rounded-lg border border-slate-200 bg-white shadow-sm',
    paddingClass[props.padding],
  ])
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
