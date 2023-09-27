<template>
  <div :style="{ '--grid-rows': GRID_ROWS, '--grid-columns': GRID_COLS }" class="sequencer-wrapper">
    <div class="flex-horizontal">
      <VerticalIndicator
          :key="`${sequencer.isPlaying}_${sequencer.soundEngine.tracks.value.length}`"
          :polyrhythms="sequencer.soundEngine.tracks.value.map(_=>_.getLoops().value.length)"
          :rows="sequencer.soundEngine.tracks.value.length"
          :selected-row="selectedTrackIndex"
          :tracks="sequencer.soundEngine.tracks.value"
          space="0"
          @select-row="onSelectTrack"
          @add-track="onAddTrack"
      />
      <div class="flex-auto">
        <DisplayGrid
            :is-playing="sequencer.isPlaying"
            :columns="GRID_COLS"
            :tracks="sequencer.soundEngine.tracks.value"
            :items="sequencer.sequenceGrid.value"
            :rows="GRID_ROWS"
            @click="changeCellState"
            @wheel="onNoteWheel"
            @ctrl-wheel="onNoteWheel"
            @shift-wheel="onNoteWheel"
            @alt-wheel="onNoteWheel"
        />
      </div>
    </div>

    <div class="sequence-control">
      <SimpleButton @click="play">{{ sequencer.isPlaying ? 'STOP' : 'PLAY' }}</SimpleButton>
    </div>

    <MixerDisplay :key="sequencer.isPlaying ? 'playing' : 'stopped'"></MixerDisplay>

    <SubPanel
        v-if="sequencer.soundEngine.tracks.value[selectedTrackIndex]"
        :effects-chain="sequencer.soundEngine.tracks.value[selectedTrackIndex].middlewares"
        :track="sequencer.soundEngine.tracks.value[selectedTrackIndex]"
        @update:envelope="onEnvelopeUpdate"

        @update:chain="onUpdateEffects"
        @update:sidechain="onSidechain"
    ></SubPanel>


  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'

import {AVAILABLE_NOTES, Sequencer} from '~/lib/Sequencer'
import SubPanel from '@/components/SubPanel.vue'
import DisplayGrid from '@/components/DisplayGrid/DisplayGrid.vue'
import VerticalIndicator from '@/components/DisplayGrid/VerticalIndicator.vue'

import type {ADSRType} from '~/lib/SoundEngine'
import {TrackTypes} from "~/lib/SoundEngine";
import {AVAILABLE_EFFECTS, GRID_COLS, GRID_ROWS} from "@/constants";
import {Track} from "~/lib/Track";
import type {UniversalEffect} from "~/lib/Effects.types";
import {jsonCopy} from "~/lib/utils/jsonCopy";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import MixerDisplay from "@/components/MixerDisplay.vue";
import {useSelectedTrackNumber} from "@/stores/trackParameters";
import * as Tone from "tone/Tone";
import {GridCell} from "~/lib/GridCell";
import AbstractSource from "~/lib/AbstractSource";

const sequencer = Sequencer.getInstance()

const store = useSelectedTrackNumber()

const selectedTrackIndex = computed(() => store.selectedTrackIndex);

const selectedTrack = computed<Track>(() => {
  return sequencer.soundEngine.tracks.value[selectedTrackIndex.value]
});

const onSelectTrack = (trackIndex: number) => {
  store.setTrackIndex(trackIndex);
  sequencer.keyboardManager.unregisterEvents()
  sequencer.keyboardManager.registerEvents(selectedTrack.value)
}

const onNoteWheel = (cell: GridCell, event: WheelEvent) => {
  event.preventDefault()
  event.stopPropagation()

  const newCell = new GridCell(cell)

  const noteIndex = AVAILABLE_NOTES.indexOf(newCell.notes[0])

  if (event.shiftKey) {
    newCell.velocity = newCell.velocity + (event.deltaY < 0 ? 10 : -10)
    newCell.velocity = Math.max(0, Math.min(100, newCell.velocity))

  } else if (event.ctrlKey) {
    // don't allow to change note if there are multiple notes
    if (newCell.notes.length > 1) {
      return
    }

    const newNoteIndex = noteIndex + (event.deltaY < 0 ? 12 : -12)
    newCell.notes = [
      AVAILABLE_NOTES[newNoteIndex] ||
      AVAILABLE_NOTES[event.deltaY < 0 ? 1 : AVAILABLE_NOTES.length - 1]
    ]

  } else if (event.altKey) {
    if (!newCell.velocity) {
      return
    }

    let add = Tone.Time('16n')

    if (event.deltaY > 0 && Tone.Time(newCell.duration).toSeconds() === Tone.Time('32n').toSeconds()) {
      add = Tone.Time('64n')
    }

    if (event.deltaY > 0 && Tone.Time(newCell.duration).toSeconds() === Tone.Time('16n').toSeconds()) {
      add = Tone.Time('32n')
    }

    if (event.deltaY < 0 && Tone.Time(newCell.duration).toSeconds() === Tone.Time('64n').toSeconds()) {
      add = Tone.Time('32n')
    }

    if (event.deltaY < 0 && Tone.Time(newCell.duration).toSeconds() === Tone.Time('32n').toSeconds()) {
      add = Tone.Time('16n')
    }

    let newDuration = Tone.Time(newCell.duration).toSeconds() + (event.deltaY < 0 ? 1 : -1) * add.toSeconds()

    newDuration = Math.max(
        Tone.Time('64n').toSeconds(),
        Math.min(
            Tone.Time('1m').toSeconds(),
            newDuration
        )
    )

    newCell.duration = Tone.Time(newDuration).toSeconds() as Tone.Unit.Time

  } else {
    // don't allow to change note if there are multiple notes
    if (newCell.notes.length > 1) {
      return
    }

    const newNoteIndex = noteIndex + (event.deltaY < 0 ? 1 : -1)
    newCell.notes = [
      AVAILABLE_NOTES[newNoteIndex] ||
      AVAILABLE_NOTES[event.deltaY < 0 ? 1 : AVAILABLE_NOTES.length - 1]
    ]
  }

  // тут всё плохо, когда пишем клетку по колесику то просираем реактивность у Skip а она нужна для хранения количесвта прошедших скипов ?
  sequencer.writeCell(newCell)
}

const changeCellState = (row: number, column: number) => {
  const cell = sequencer.readCell(row, column)
  const trackLength = sequencer.soundEngine.tracks.value[selectedTrackIndex.value].length
  if (trackLength < column) {
    return
  }

  const newVelocity = sequencer.readCell(row, column).velocity > 0 ? 0 : 100;

  sequencer.writeCell(
      new GridCell({
        ...cell,
        velocity: newVelocity
      })
  )
}

const play = async () => {
  if (sequencer.isPlaying) {
    sequencer.stop()
    return
  }

  if (!sequencer.sequenceGrid.value.find(cell => cell.velocity > 0)) {
    sequencer.regenerateSequence(5, ['C2', 'B2', 'E2', 'F2'])

    sequencer.sequenceGrid.value.filter(cell => cell.row === 1 && cell.column % 4 === 1).forEach(cell => {
      cell.velocity = 100;
    })
  }

  await sequencer.play()
}

const onEnvelopeUpdate = (envelope: ADSRType) => {
  const track = sequencer.soundEngine.tracks.value[selectedTrackIndex.value]

  track.setToSource({envelope})
}

const onSidechain = () => {
  const tracks = sequencer.soundEngine.tracks.value;

  // TODO: not always the first track is the kick,
  // TODO: what about different samples on different notes of that [0] sampler track?
  sequencer.soundEngine.toggleSidechain(tracks[0], tracks[selectedTrackIndex.value])
}

const onUpdateEffects = (chain: string[]) => {
  // array of effect names (:string[]) maps to actual effect objects (:UniversalEffect) then goes to initialize in middlewares `set` method
  // jsonCopy to actually have different instances of effects for each track
  const newEffectByName = (effectName: string): UniversalEffect => {
    const track = sequencer.soundEngine.tracks.value[selectedTrackIndex.value];
    const effect = track.middlewares.find(_ => _.name === effectName)

    if (effect) {
      return effect as UniversalEffect
    }

    return jsonCopy(AVAILABLE_EFFECTS.find(_ => _.name === effectName) as UniversalEffect)
  }

  const effects: UniversalEffect[] = chain.map(newEffectByName)

  sequencer.soundEngine.tracks.value[selectedTrackIndex.value].clearMiddlewares()
  sequencer.soundEngine.tracks.value[selectedTrackIndex.value].addMiddleware(effects)
}

const onAddTrack = async () => {
  // TODO!!!!!!
  if (sequencer.soundEngine.tracks.value.length >= 8) {
    throw new Error('Maximum number of tracks reached')
  }

  const abstractSourceSynth = new AbstractSource({
    synth: {
      oscillator: {
        type: 'pulse'
      },
      envelope: {
        attack: 0.01,
        decay: 0.42,
        sustain: 0.01,
        release: 0.25
      },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.5,
      },
      volume: -6
    }
  })

  await abstractSourceSynth.init();

  sequencer.soundEngine.addTrack(new Track({
    volume: -6,
    name: 'Tone #' + (sequencer.soundEngine.tracks.value.length + 1),
    source: abstractSourceSynth,
    type: TrackTypes.synth
  }))
}
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
  flex: 1 0 0;
}

.remove-top-padding {
  padding-top: 0;
}
</style>
