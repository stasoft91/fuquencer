<template>
  <n-drawer :close-on-esc="false" :show="isSettingsOpen" placement="left" @update-show="onHide">
    <n-drawer-content closable title="Settings">
      <n-switch v-model:value="sequencer.keyboardManager.isAudible" size="large"
                @update:value="onKeyboardSettingsUpdate">
        <template #checked>
          KB Sound On
        </template>
        <template #unchecked>
          KB Sound Off
        </template>
      </n-switch>

      <n-switch v-model:value="sequencer.keyboardManager.isRecording" size="large"
                @update:value="onKeyboardSettingsUpdate">
        <template #checked>
          KB Rec On
        </template>
        <template #unchecked>
          KB Rec Off
        </template>
      </n-switch>

      <n-switch :value="gridStore.isVisualizerActive" size="large" @update:value="onUpdateVisualizer">
        <template #checked>
          Visualizer On
        </template>
        <template #unchecked>
          Visualizer Off
        </template>
      </n-switch>

      <n-input-number v-model:value="sequencer.bpm" :max="300" :min="1" :step="1" size="large">
        <template #suffix>
          BPM
        </template>
      </n-input-number>
    </n-drawer-content>
  </n-drawer>
</template>
<script lang="ts" setup>
import {NDrawer, NDrawerContent, NInputNumber, NSwitch} from "naive-ui";
import {Sequencer} from "~/lib/Sequencer";
import {useSelectedTrackNumber} from "@/stores/trackParameters";
import {useGridEditorStore} from "@/stores/gridEditor";
import {computed} from "vue";

const sequencer = Sequencer.getInstance()

const selectedTrackNumberStore = useSelectedTrackNumber()
const gridStore = useGridEditorStore()

const selectedTrack = computed(() => sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex])

const onKeyboardSettingsUpdate = () => {
  sequencer.keyboardManager.unregisterEvents()
  sequencer.keyboardManager.registerEvents(selectedTrack.value)
}

function onUpdateVisualizer(newValue: boolean) {
  if (newValue) {
    gridStore.isVisualizerActive = true
    sequencer.soundEngine.addFFTAnalyzer(selectedTrack.value)
  } else {
    gridStore.isVisualizerActive = false
    sequencer.soundEngine.stopFFTAnalyzer()
  }
}

defineProps({
  isSettingsOpen: Boolean,
})

const emit = defineEmits([
  'update:isSettingsOpen',
])
const onHide = () => {
  emit('update:isSettingsOpen', false)
}
</script>

<style lang="scss">
.n-drawer-body-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}
</style>
