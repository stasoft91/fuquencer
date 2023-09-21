<template>
  <n-dynamic-tags :value="props.value" @update:value="onUpdateNote">
    <template #input="{ submit, deactivate }">
      <n-auto-complete
          ref="autoCompleteInstRef"
          v-model:value="inputValue"
          :clear-after-select="true"
          :options="options"
          placeholder="Notes"
          size="small"
          @blur="deactivate"
          @select="submit($event)"
      />
    </template>
    <template #trigger="{ activate, disabled }">
      <n-button
          :disabled="disabled"
          dashed
          size="small"
          type="primary"
          @click="activate()"
      >
        <template #icon>
          <NIcon :component="AddIcon"></NIcon>
        </template>
        Add Note
      </n-button>
    </template>
  </n-dynamic-tags>
</template>

<script lang="ts" setup>
import type {AutoCompleteInst, AutoCompleteOption} from 'naive-ui'
import {NAutoComplete, NButton, NDynamicTags, NIcon,} from 'naive-ui'
import {Add as AddIcon} from '@vicons/ionicons5'
import type {Ref} from "vue";
import {computed, nextTick, ref, watch} from "vue";
import {AVAILABLE_NOTES} from "~/lib/Sequencer";

const autoCompleteInstRef = ref<AutoCompleteInst | null>(null)

const props = defineProps<{
  value: string[]
}>()

const inputValue: Ref<string> = ref('')

const emit = defineEmits<{
  (event: 'update:value', notes: string[]): void
}>()

watch(autoCompleteInstRef, (value) => {
  if (value) nextTick(() => value.focus())
})

const options = computed((): AutoCompleteOption[] => {
  return AVAILABLE_NOTES.filter(note => note.includes(inputValue.value?.toUpperCase())).map((note) => {
    return {
      label: note,
      value: note
    }
  })
})

const onUpdateNote = (notes: string[]) => {
  emit('update:value', notes)
}
</script>
