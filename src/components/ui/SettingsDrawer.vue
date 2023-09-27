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

const sequencer = Sequencer.getInstance()

const store = useSelectedTrackNumber()

const onKeyboardSettingsUpdate = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]
  sequencer.keyboardManager.unregisterEvents()
  sequencer.keyboardManager.registerEvents(selectedTrack)
}

defineProps({
  isSettingsOpen: Boolean,
  selectedTrackIndex: Number,
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
