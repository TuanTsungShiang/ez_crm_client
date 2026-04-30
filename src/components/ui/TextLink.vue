<script setup lang="ts">
  import { computed } from 'vue'
  import { RouterLink, type RouteLocationRaw } from 'vue-router'

  type Variant = 'subtle' | 'primary'

  const props = withDefaults(
    defineProps<{
      to?: RouteLocationRaw
      href?: string
      variant?: Variant
    }>(),
    {
      to: undefined,
      href: undefined,
      variant: 'subtle',
    },
  )

  const variantClass: Record<Variant, string> = {
    subtle: 'text-sm text-slate-500 hover:text-slate-700',
    primary: 'text-sm text-blue-600 hover:underline',
  }

  const classes = computed(() => variantClass[props.variant])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <slot />
  </RouterLink>
  <a v-else-if="href" :href="href" :class="classes">
    <slot />
  </a>
  <span v-else :class="classes">
    <slot />
  </span>
</template>
