<template>
  <n-dynamic-tags
      :render-tag="renderTag"
      :value="props.value"
      @update:value="onUpdateNote"
  >
    <template #input="{ submit, deactivate }">
      <n-auto-complete
          ref="autoCompleteInstRef"
          v-model:value="inputValue"
          :clear-after-select="true"
          :render-label="renderOptions"
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
import {NAutoComplete, NButton, NDynamicTags, NIcon, NTag,} from 'naive-ui'
import {Add as AddIcon} from '@vicons/ionicons5'
import type {Ref} from "vue";
import {computed, h, nextTick, ref, watch} from "vue";
import {generateListOfAvailableNotes} from "~/lib/Sequencer";
import * as Tone from "tone/Tone";
import type {Track} from "~/lib/Track";
import {cloneDeep} from "lodash";
import {SOURCE_TYPES} from "~/lib/SoundEngine";

const autoCompleteInstRef = ref<AutoCompleteInst | null>(null)

const props = defineProps<{
  value: string[]
  isDrum: boolean
  // the 'currently selected' track can be undefined on start or when the track is deleted
  track?: Track
}>()

const inputValue: Ref<string> = ref('')

const emit = defineEmits<{
  (event: 'update:value', notes: string[]): void
}>()

watch(autoCompleteInstRef, (value) => {
  if (value) nextTick(() => value.focus())
})

const options = computed((): AutoCompleteOption[] => {
  return generateListOfAvailableNotes(props.track)
      .filter(
          note => {
            if (props.track?.sourceType.value === SOURCE_TYPES.SMPLR_Drum) {
              return props.track.source.convertNoteToDrum(Tone.Frequency(note).toMidi()) !== undefined
            } else {
              return note.toUpperCase().includes(inputValue.value?.toUpperCase())
            }
          }
      ).map(
          (note) => {
            return {
              label: note,
              value: note
            }
          })
})

const renderOptions = (option: AutoCompleteOption) => {
  return props.track?.source.convertNoteToDrum(Tone.Frequency(option.value).toMidi()) ?? Tone.Frequency(option.value).toNote()
}

const renderTag = (tag: string, index: number) => {
  return h(
      NTag,
      {
        closable: true,
        onClose: () => {
          const tags = cloneDeep(props.value)
          tags.splice(index, 1)
          onUpdateNote(tags)
        }
      },
      {
        default: () => {
          return props.track?.sourceType.value === SOURCE_TYPES.SMPLR_Drum ?
              props.track?.source.convertNoteToDrum(Tone.Frequency(tag).toMidi()) || Tone.Frequency(tag).toNote() :
              Tone.Frequency(tag).toNote()
        }
      }
  )
}

const onUpdateNote = (notes: string[]) => {
  emit('update:value', notes)
}
</script>
