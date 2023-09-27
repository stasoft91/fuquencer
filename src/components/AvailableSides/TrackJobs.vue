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

      <div v-if="selectedTrack?.type === TrackTypes.synth" class="">
        <SimpleButton class="big" @click="onGenerateBassline">Improvise</SimpleButton>
      </div>

      <div class="row full-size">
        <label for="swing-subdivision">Swing Subdivision</label>

        <select id="swing-subdivision" v-model="swingSubdivision" class="full-size big">
          <option
              v-for="subdivision in DELAY_OPTIONS"
              :key="subdivision"
              :value="subdivision">{{ toMeasure(Tone.Time(subdivision)) }}
          </option>
        </select>
        <SimpleButton class="big" @click="onSwingTrack(0)">Swing 0%</SimpleButton>
        <SimpleButton class="big" @click="onSwingTrack(12.5)">Swing 12.5%</SimpleButton>
        <SimpleButton class="big" @click="onSwingTrack(25)">Swing 25%</SimpleButton>
        <SimpleButton class="big" @click="onSwingTrack(50)">Swing 50%</SimpleButton>
      </div>

      <!--      <div v-if="selectedTrack?.type === TrackTypes.sample" class="full-size">-->
      <!--        <SampleEditorButton-->
      <!--            :sampleUrl="selectedSampleUrl"-->
      <!--            :track="selectedTrack"-->
      <!--            color="rgba(26, 32, 44, 1)"-->
      <!--            width="100%"-->
      <!--        >-->
      <!--          Change-->
      <!--        </SampleEditorButton>-->
      <!--      </div>-->
    </div>
  </n-card>
</template>

<script lang="ts" setup>
import {DEFAULT_NOTE, Sequencer} from "~/lib/Sequencer";
import {TrackTypes} from "~/lib/SoundEngine";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {useSelectedTrackNumber} from "@/stores/trackParameters";
import {computed, ref} from "vue";
import * as Tone from "tone/Tone";
import {NCard} from "naive-ui";
import {GridCell} from "~/lib/GridCell";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {DELAY_OPTIONS} from "@/constants";
import {toMeasure} from "~/lib/utils/toMeasure";

const store = useSelectedTrackNumber()
const sequencer = Sequencer.getInstance()

const swingSubdivision = ref('8n')

const selectedTrack = computed(() => {
  return sequencer.soundEngine.tracks.value[store.selectedTrackIndex]
})

const onFillTrack = (repeats?: number) => {
  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]

  const trackNumber = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1

  for (let i = 1; i <= 16; i++) {
    sequencer.writeCell(new GridCell({
      row: trackNumber,
      column: i,
      velocity: 0,
      notes: [DEFAULT_NOTE],
    }))
  }

  if (!repeats) {
    return
  }

  const step = 16 / repeats;

  for (let i = 1; i <= 16; i += step) {
    sequencer.writeCell(new GridCell({
      row: trackNumber,
      column: i,
      velocity: 100,
      notes: [DEFAULT_NOTE],
    }))
  }
}

const onGenerateBassline = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1
  //['C2', 'B2', 'E2', 'F2'], ['D2', 'A2', 'C2', 'B2']
  sequencer.regenerateSequence(trackIndex, ['C2', 'B2', 'E2', 'F2', 'B1'])
}

const selectedSampleUrl = computed(() => {
  if (!store.selectedTrackIndex) {
    return ''
  }

  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]

  return selectedTrack.meta.get('urls')[DEFAULT_NOTE] || (selectedTrack.source.get() as Tone.SamplerOptions).urls[DEFAULT_NOTE]
})

const onShiftTrackLeft = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const nextCellPosition = cellPosition.column === 1 ? 16 : cellPosition.column - 1
    const newCell = new GridCell({
      ...cellPosition,
      column: nextCellPosition,
    })
    sequencer.writeCell(newCell)
  })
}
const onShiftTrackRight = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const nextCellPosition = cellPosition.column === 16 ? 1 : cellPosition.column + 1
    const newCell = new GridCell({
      ...cellPosition,
      column: nextCellPosition,
    })
    sequencer.writeCell(newCell)
  })
}

const onHumanizeTrack = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    let newVelocity = Math.ceil(Math.random() * 25) + 75
    newVelocity = newVelocity < 0 ? 0 : newVelocity
    newVelocity = newVelocity > 100 ? 100 : newVelocity

    const newCell = new GridCell({
      ...cellPosition,
      velocity: cellPosition.velocity > 0 ? newVelocity : 0,
    })

    sequencer.writeCell(newCell)
  })
}

const onPartLengthChange = (event: Event) => {
  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]

  selectedTrack.setLength(parseInt((event.target as HTMLSelectElement).value) || 16)
}

const onSwingTrack = (swingPercentage: number) => {
  const selectedTrack = sequencer.soundEngine.tracks.value[store.selectedTrackIndex]
  const trackRow = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1

  if (swingPercentage === 0) {
    sequencer.sequenceGrid.value.filter(cell => cell.row === trackRow).forEach(cell => {
      cell.modifiers.delete(GridCellModifierTypes.swing)
      sequencer.writeCell(cell)
    })
    return
  }

  sequencer.sequenceGrid.value.filter(cell => cell.row === trackRow).forEach(cell => {
    cell.modifiers.set(GridCellModifierTypes.swing, {
      type: GridCellModifierTypes.swing,
      swing: swingPercentage,
      subdivision: Tone.Time(swingSubdivision.value).toSeconds() as Tone.Unit.Time
    })
    sequencer.writeCell(cell)
  })
}
</script>
