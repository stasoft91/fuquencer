<template>
  <div class="fader-control">
    <label :id="id">{{ label }}</label>
    <FaderInput v-model.number="value"
                :min="min"
                :max="max"
                :id="id"
                :default-value="defaultValue"
    />

    <n-input-number
        class="input"
        :show-button="isInputFieldButtonsVisible"
        v-model:value="value"
        :format="(val) => (val || 0).toFixed(1)"
        :step="step"
        :min="min"
        :max="max"
        placeholder="42.0"
        @mouseleave="isInputFieldButtonsVisible = false"
        @mouseenter="isInputFieldButtonsVisible = true"
    />

    <div class="buttons">
      <SimpleButton icon="/icons/link.svg" @click="onLinkClick"></SimpleButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import FaderInput from "@/components/ui/FaderInput.vue";
import {NInputNumber} from 'naive-ui'
import {ref} from "vue";
import SimpleButton from "@/components/ui/SimpleButton.vue";

const value = defineModel<number>()

const isInputFieldButtonsVisible = ref(false)

type Props = {
  id?: string,
  label: string,
  min?: number,
  max?: number,
  defaultValue?: number,
  step?: number,
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  id: 'fader-input',
  label: 'Fader Input',
  step: 0.1,
})

const emit = defineEmits<{
  (event: 'update:model-value', payload: number): void
  (event: 'click:link'): void
}>()

const onLinkClick = () => {
  emit('click:link')
}
</script>

<style lang="scss" scoped>
.fader-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
</style>
