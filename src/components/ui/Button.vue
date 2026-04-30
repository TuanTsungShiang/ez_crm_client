<script setup lang="ts">
  import { computed } from 'vue'
  import { RouterLink, type RouteLocationRaw } from 'vue-router'

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid'
  type Size = 'sm' | 'md'

  const props = withDefaults(
    defineProps<{
      variant?: Variant
      size?: Size
      to?: RouteLocationRaw
      type?: 'button' | 'submit' | 'reset'
      disabled?: boolean
    }>(),
    {
      variant: 'primary',
      size: 'md',
      to: undefined,
      type: 'button',
      disabled: false,
    },
  )

  const base =
    'inline-flex items-center justify-center rounded-md font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed'

  const sizeClass: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  }

  const variantClass: Record<Variant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-slate-300',
    secondary:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400 disabled:opacity-50',
    ghost:
      'border-0 bg-transparent text-slate-500 shadow-none hover:text-slate-700 focus:ring-slate-400 disabled:opacity-50',
    danger:
      'border border-red-200 bg-white text-red-600 hover:bg-red-50 focus:ring-red-400 disabled:opacity-50',
    'danger-solid': 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  }

  const classes = computed(() => [base, sizeClass[props.size], variantClass[props.variant]])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <slot />
  </RouterLink>
  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
