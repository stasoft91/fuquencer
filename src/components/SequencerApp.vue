<template>
  <div class="sequencer-wrapper" :style="{ '--grid-rows': GRID_ROWS, '--grid-columns': sequencer.sequenceLength }">
    <div class="flex-horizontal">
      <VerticalIndicator
          :polyrythms="sequencer.soundEngine.tracks.map(_=>_.getLoops().value.length)"
          :row-captions="sequencer.soundEngine.tracks.map(_=>_.name)"
          :rows="GRID_ROWS"
          :selected-row="selectedTrackIndex"
          :tracks="sequencer.soundEngine.tracks"
          space="0"
          class="flex-auto"
          @select-row="onSelectTrack"
      />
      <div style="width:100%">
        <DisplayGrid
            :columns="sequencer.sequenceLength"
            :items="sequencer.sequenceGrid"
            :rows="GRID_ROWS"
            @click="changeCellState"
            @wheel="onNoteWheel"
            @ctrl-wheel="onNoteWheel"
            @shift-wheel="onNoteWheel"
            @alt-wheel="onNoteWheel"
        />
        <!--        <HorizontalIndicator :selected-column="sequencer.currentStep" :columns="sequencer.sequenceLength" class="remove-top-padding"/>-->
      </div>
    </div>

    <div class="sequence-control">
      <SimpleButton @click="play">{{ isPlaying ? 'STOP' : 'PLAY' }}</SimpleButton>
      <SimpleButton @click="isSettingsOpen = !isSettingsOpen">SETTINGS</SimpleButton>
    </div>

    <SubPanel
        v-if="sequencer.soundEngine.tracks[selectedTrackIndex]"
        :track="selectedTrack"
        :effects-chain="selectedTrack.middlewares"
        @update:envelope="onEnvelopeUpdate"

        @update:chain="onUpdateEffects"
        @update:sidechain="onSidechain"
        @update:filter="onFilterUpdate"
    ></SubPanel>

    <n-drawer v-model:show="isSettingsOpen" placement="left">
      <n-drawer-content cloasble title="Settings">
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
  </div>
</template>

<script setup lang="ts">
import {computed, h, onMounted, ref, resolveComponent} from 'vue'

import type {GridCell} from '~/lib/Sequencer'
import {AVAILABLE_NOTES, DEFAULT_NOTE, Sequencer} from '~/lib/Sequencer'
import SubPanel from '@/components/SubPanel.vue'
import DisplayGrid from '@/components/DisplayGrid/DisplayGrid.vue'
import VerticalIndicator from '@/components/DisplayGrid/VerticalIndicator.vue'

import type {ADSRType} from '~/lib/SoundEngine'
import {AVAILABLE_EFFECTS, GRID_ROWS, VERSION} from "@/constants";
import type {Track} from "~/lib/Track";
import type {UniversalEffect} from "~/lib/Effects.types";
import {jsonCopy} from "~/lib/utils/jsonCopy";
import {NDrawer, NDrawerContent, NSwitch, useDialog} from "naive-ui";
import * as Tone from "tone/Tone";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import InfoPage from "@/components/ui/InfoPage.vue";

const sequencer = Sequencer.getInstance(16)

// DEVELOPER TEMPORARY
const selectedTrackIndex = ref<number>(0)

const isPlaying = ref(false);

const isSettingsOpen = ref(false);

const onKeyboardSettingsUpdate = () => {
  sequencer.keyboardManager.unregisterEvents()
  sequencer.keyboardManager.registerEvents(selectedTrack.value)
}

const onSelectTrack = (trackIndex: number) => {
  selectedTrackIndex.value = trackIndex
  sequencer.keyboardManager.unregisterEvents()
  sequencer.keyboardManager.registerEvents(selectedTrack.value)
}

const selectedTrack = computed<Track>(() => {
  return sequencer.soundEngine.tracks[selectedTrackIndex.value]
})

const onNoteWheel = (cell: GridCell, event: WheelEvent) => {
  event.preventDefault()
  event.stopPropagation()
  const noteIndex = AVAILABLE_NOTES.indexOf(cell.note)

  if (event.shiftKey) {
    cell.velocity = cell.velocity + (event.deltaY < 0 ? 10 : -10)
    cell.velocity = Math.max(0, Math.min(100, cell.velocity))

  } else if (event.ctrlKey) {
    const newNoteIndex = noteIndex + (event.deltaY < 0 ? 12 : -12)
    cell.note =
      AVAILABLE_NOTES[newNoteIndex] ||
      AVAILABLE_NOTES[event.deltaY < 0 ? 1 : AVAILABLE_NOTES.length - 1]

  } else if (event.altKey) {
    let newDuration = parseInt(cell.duration.split(/[nm]/)[0]) * (event.deltaY < 0 ? 2 : 1 / 2)

    newDuration = Math.max(1, Math.min(64, newDuration))
    cell.duration = `${newDuration}n`
  } else {
    const newNoteIndex = noteIndex + (event.deltaY < 0 ? 1 : -1)
    cell.note =
      AVAILABLE_NOTES[newNoteIndex] ||
      AVAILABLE_NOTES[event.deltaY < 0 ? 1 : AVAILABLE_NOTES.length - 1]
  }

  sequencer.writeCell(Sequencer.cell(cell.row, cell.column, cell))
}

const changeCellState = (row: number, column: number) => {
  sequencer.writeCell(
    Sequencer.cell(row, column, {
      velocity: sequencer.readCell(row, column).velocity > 0 ? 0 : 100,
      note: sequencer.readCell(row, column).note
        ? sequencer.readCell(row, column).note
        : DEFAULT_NOTE
    })
  )
}

const getStyleForCell = (rowNumber: number, columnNumber: number) => {
  return {
    gridRow: rowNumber,
    gridColumn: columnNumber
  }
}

const play = () => {
  if (isPlaying.value) {
    sequencer.stop()
    isPlaying.value = false
    return
  }

  isPlaying.value = true

  if (sequencer.sequenceGrid.value.find(cell => cell.velocity > 0) === undefined) {
    sequencer.regenerateSequence(5, ['C2', 'B2', 'E2', 'F2'])

    sequencer.sequenceGrid.value.filter(cell => cell.row === 1 && cell.column % 4 === 1).forEach(cell => {
      cell.velocity = 100;
    })
  }

  sequencer.play()
}

const onEnvelopeUpdate = (envelope: ADSRType) => {
  const track = sequencer.soundEngine.tracks[selectedTrackIndex.value]

  track.envelope = envelope
}

const onUpdateVolume = (volume: number) => {
  const track = sequencer.soundEngine.tracks[selectedTrackIndex.value]

  track.volume = volume
}

const onSidechain = () => {
  const tracks = sequencer.soundEngine.tracks;

  sequencer.soundEngine.toggleSidechain(tracks[0], tracks[selectedTrackIndex.value])
}

const onFilterUpdate = (frequency: number) => {
  const track = sequencer.soundEngine.tracks[selectedTrackIndex.value]

  track.setFilterCutoff(frequency)
}

const onUpdateEffects = (chain: string[]) => {
  // array of effect names (:string[]) maps to actual effect objects (:UniversalEffect) then goes to initialize in middlewares `set` method
  // jsonCopy to actually have different instances of effects for each track
  const newEffectByName = (effectName: string): UniversalEffect => {
    const track = sequencer.soundEngine.tracks[selectedTrackIndex.value];
    const effect = track.middlewares.find(_ => _.name === effectName)

    if (effect) {
      return effect as UniversalEffect
    }

    return jsonCopy(AVAILABLE_EFFECTS.find(_ => _.name === effectName) as UniversalEffect)
  }

  const effects: UniversalEffect[] = chain.map(newEffectByName)

  sequencer.soundEngine.tracks[selectedTrackIndex.value].clearMiddlewares()
  sequencer.soundEngine.tracks[selectedTrackIndex.value].addMiddleware(effects)
}

const dialog = useDialog()

onMounted(() => {
  dialog.info({
    title: `fuquencer v${VERSION}`,
    content: () => h(resolveComponent('InfoPage')),
    closeOnEsc: false,
    onClose: async () => {
      await Tone.start()
    }
  })
})
</script>

<style scoped lang="scss">
@import '@/assets/variables.scss';

.sequencer-wrapper {
  isolation: isolate;

  --grid-rows: 4;
  --grid-columns: 16;
}

.sequencer-grid {
  flex: 1 0 720px;
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  grid-template-rows: repeat(var(--grid-rows), 1fr) 0.5rem;
  gap: 0.25rem;
  padding: 0.25rem;

  background-color: $color-grey-600;
  border-radius: 4px;
  overflow: hidden;
}

.sequencer-grid__row {
}

.sequencer-grid__cell {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
  background-color: $color-grey-800;
  border: none;
  cursor: pointer;
  padding: 4px;
  height: 2rem;
  outline: none;
}

.sequencer-grid__cell__content {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
  width: 2rem;
}

button.active {
  background-color: $color-grey-300;
}

.indicator {
  background-color: $color-grey-500;
  border: none;
  padding: 4px;
  font-size: 0.25rem;
}

.indicator.active {
  border: none;
  padding: 4px;
  background-color: $color-orange-opaque;
  box-shadow: inset 0 0 2px 2px $color-orange-opaque-lighter100;
}

.sequence-control {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.sequence-control button {
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  height: 2.5rem;
  font-size: 1.25rem;
}

.sequencer {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.flex-horizontal {
  flex: 1 0 720px;

  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
}

.flex-auto {
  flex: 1 0 auto;
}

.remove-top-padding {
  padding-top: 0;
}
</style>