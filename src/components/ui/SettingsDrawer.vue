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
    </n-drawer-content>
  </n-drawer>
</template>
<script lang="ts" setup>
import {NDrawer, NDrawerContent, NSwitch} from "naive-ui";
import {Sequencer} from "~/lib/Sequencer";
import {useSelectedTrackNumber} from "@/stores/trackParameters";

const sequencer = Sequencer.getInstance()

const store = useSelectedTrackNumber()

const onKeyboardSettingsUpdate = () => {
  const selectedTrack = sequencer.soundEngine.tracks[store.selectedTrackIndex]
  sequencer.keyboardManager.unregisterEvents()
  sequencer.keyboardManager.registerEvents(selectedTrack)
}

const props = defineProps({
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
