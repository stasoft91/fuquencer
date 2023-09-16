<style lang="scss" scoped>
.row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.big {
  height: 3rem;
}

.full-size {
  width: 100%;
}
</style>

<template>
  <n-card v-if="selectedTrack" :title="selectedTrack?.name ?? ''">
    <div class="row">
      <select
          :value="selectedTrack?.length"
          class="full-size big"
          @change="onPartLengthChange($event)"
      >
        <option v-for="partLength in [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]" :key="partLength" :value="partLength">
          Part Length: {{ partLength }}
        </option>
      </select>

      <div class="row full-size">
        <SimpleButton v-for="i in [2, 4, 8, 16]" :key="i" class="big" @click="onFillTrack(i)">Fill x{{ i }}
        </SimpleButton>
      </div>

      <div class="row full-size">
        <SimpleButton class="big" @click="onShiftTrackLeft">&lt;--</SimpleButton>
        <SimpleButton class="big" @click="onShiftTrackRight">--&gt;</SimpleButton>
      </div>

      <div class="row full-size">
        <SimpleButton class="big" @click="onFillTrack()">Clear</SimpleButton>
        <SimpleButton class="big" @click="onHumanizeTrack">Humanize</SimpleButton>
      </div>

      <div v-if="selectedTrack?.type === TrackTypes.sample" class="full-size">
        <SampleEditorButton
            :sampleUrl="selectedSampleUrl"
            :track="selectedTrack"
            color="rgba(26, 32, 44, 1)"
            width="100%"
        >
          Change
        </SampleEditorButton>
      </div>

      <div v-if="selectedTrack?.type === TrackTypes.synth" class="">
        <SimpleButton class="big" @click="onGenerateBassline">Improvise</SimpleButton>
      </div>
    </div>
  </n-card>
</template>

<script lang="ts" setup>
import {DEFAULT_NOTE, Sequencer} from "~/lib/Sequencer";
import {TrackTypes} from "~/lib/SoundEngine";
import SampleEditorButton from "@/components/SampleEditor/SampleButton.vue";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {useSelectedTrackNumber} from "@/stores/trackParameters";
import {computed} from "vue";
import * as Tone from "tone/Tone";
import {NCard} from "naive-ui";

const store = useSelectedTrackNumber()
const sequencer = Sequencer.getInstance()

const selectedTrack = computed(() => {
  return sequencer.soundEngine.tracks[store.selectedTrackIndex]
})

const onFillTrack = (repeats?: number) => {
  const selectedTrack = sequencer.soundEngine.tracks[store.selectedTrackIndex]

  const trackNumber = sequencer.soundEngine.tracks.findIndex(track => track.name === selectedTrack.name) + 1

  for (let i = 1; i <= 16; i++) {
    sequencer.writeCell(Sequencer.cell(trackNumber, i, {
      velocity: 0,
      note: DEFAULT_NOTE,
    }))
  }

  if (!repeats) {
    return
  }

  const step = 16 / repeats;

  for (let i = 1; i <= 16; i += step) {
    sequencer.writeCell(Sequencer.cell(trackNumber, i, {
      velocity: 100,
      note: DEFAULT_NOTE,
    }))
  }
}

const onGenerateBassline = () => {
  const selectedTrack = sequencer.soundEngine.tracks[store.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.findIndex(track => track.name === selectedTrack.name) + 1
  //['C2', 'B2', 'E2', 'F2'], ['D2', 'A2', 'C2', 'B2']
  sequencer.regenerateSequence(trackIndex, ['C2', 'B2', 'E2', 'F2', 'B1'])
}

const selectedSampleUrl = computed(() => {
  if (!store.selectedTrackIndex) {
    return ''
  }

  const selectedTrack = sequencer.soundEngine.tracks[store.selectedTrackIndex]

  return selectedTrack.meta.get('urls')[DEFAULT_NOTE] || (selectedTrack.source.get() as Tone.SamplerOptions).urls[DEFAULT_NOTE]
})

const onShiftTrackLeft = () => {
  const selectedTrack = sequencer.soundEngine.tracks[store.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.findIndex(track => track.name === selectedTrack.name) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const nextCellPosition = cellPosition.column === 1 ? 16 : cellPosition.column - 1
    const newCell = Sequencer.cell(trackIndex, nextCellPosition, cellPosition)
    sequencer.writeCell(newCell)
  })
}
const onShiftTrackRight = () => {
  const selectedTrack = sequencer.soundEngine.tracks[store.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.findIndex(track => track.name === selectedTrack.name) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const nextCellPosition = cellPosition.column === 16 ? 1 : cellPosition.column + 1
    const newCell = Sequencer.cell(trackIndex, nextCellPosition, cellPosition)
    sequencer.writeCell(newCell)
  })
}

const onHumanizeTrack = () => {
  const selectedTrack = sequencer.soundEngine.tracks[store.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.findIndex(track => track.name === selectedTrack.name) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    let newVelocity = Math.ceil(Math.random() * 25) + 75
    newVelocity = newVelocity < 0 ? 0 : newVelocity
    newVelocity = newVelocity > 100 ? 100 : newVelocity

    const newCell = Sequencer.cell(trackIndex, cellPosition.column, {
      ...cellPosition,
      velocity: cellPosition.velocity > 0 ? newVelocity : 0,
    })
    sequencer.writeCell(newCell)
  })
}

const onPartLengthChange = (event: Event) => {
  const selectedTrack = sequencer.soundEngine.tracks[store.selectedTrackIndex]

  selectedTrack.setLength(parseInt((event.target as HTMLSelectElement).value) || 16)
}
</script>
