<script setup lang="ts">
  import type { RegisterSchemaField } from '@/api/types'

  const props = defineProps<{
    fields: RegisterSchemaField[]
    modelValue: Record<string, unknown>
    errors?: Record<string, string[]>
    submitting?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: Record<string, unknown>): void
    (e: 'submit'): void
  }>()

  function updateField(name: string, value: unknown) {
    emit('update:modelValue', { ...props.modelValue, [name]: value })
  }

  function handleSubmit() {
    emit('submit')
  }

  function fieldError(name: string): string | null {
    return props.errors?.[name]?.[0] ?? null
  }
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div v-for="field in fields" :key="field.name" class="space-y-1">
      <!-- checkbox 另外渲染 -->
      <label v-if="field.type === 'checkbox'" class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          :checked="!!modelValue[field.name]"
          @change="updateField(field.name, ($event.target as HTMLInputElement).checked)"
        />
        <span class="text-slate-700">{{ field.label }}</span>
      </label>

      <!-- 其他 input -->
      <template v-else>
        <label :for="field.name" class="block text-sm font-medium text-slate-700">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>
        <input
          :id="field.name"
          :type="field.type"
          :placeholder="field.placeholder"
          :required="field.required"
          :value="modelValue[field.name] ?? ''"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{ 'border-red-400': fieldError(field.name) }"
          @input="updateField(field.name, ($event.target as HTMLInputElement).value)"
        />
        <p v-if="field.hint && !fieldError(field.name)" class="text-xs text-slate-500">
          {{ field.hint }}
        </p>
      </template>

      <p v-if="fieldError(field.name)" class="text-xs text-red-500">
        {{ fieldError(field.name) }}
      </p>
    </div>

    <button
      type="submit"
      :disabled="submitting"
      class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
    >
      {{ submitting ? '處理中…' : '送出' }}
    </button>
  </form>
</template>
