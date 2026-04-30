<script setup lang="ts">
  import type { RegisterSchemaField } from '@/api/types'
  import Button from '@/components/ui/Button.vue'
  import FormInput from '@/components/ui/FormInput.vue'
  import FormLabel from '@/components/ui/FormLabel.vue'

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
        <FormLabel :for="field.name" :required="field.required">
          {{ field.label }}
        </FormLabel>
        <FormInput
          :id="field.name"
          :type="field.type"
          :placeholder="field.placeholder"
          :required="field.required"
          :model-value="(modelValue[field.name] as string | number | null | undefined) ?? ''"
          :error="!!fieldError(field.name)"
          @update:model-value="updateField(field.name, $event)"
        />
        <p v-if="field.hint && !fieldError(field.name)" class="text-xs text-slate-500">
          {{ field.hint }}
        </p>
      </template>

      <p v-if="fieldError(field.name)" class="text-xs text-red-500">
        {{ fieldError(field.name) }}
      </p>
    </div>

    <Button type="submit" :disabled="submitting" class="w-full">
      {{ submitting ? '處理中…' : '送出' }}
    </Button>
  </form>
</template>
