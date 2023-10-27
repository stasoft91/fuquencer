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

.column {
  display: flex;
  flex-direction: column;
}
</style>

<template>
  <n-card v-if="selectedTrack" :title="selectedTrack?.name ?? ''">
    <div class="row">
      <select
          :value="selectedTrackLength"
          class="full-size big"
          @change="onPartLengthChange($event)"
      >
        <option v-for="partLength in Array.from({length: 64}, (_, i) => i + 1)" :key="partLength" :value="partLength">
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
        <SimpleButton class="big" @click="onHumanizeTrack">Vel. Rnd.</SimpleButton>
      </div>

      <div class="row full-size">
        <SimpleButton class="big" @click="onGenerateBassline">
          <NIcon :component="Dice" size="24px"></NIcon>
          Improvise
        </SimpleButton>
        <SimpleButton
            :value="props.isOpen"
            class="big"
            style="--indicator-false-color: grey; --indicator-false-color-shadow: darkgrey;"
            @click="emits('update:is-open', !props.isOpen)"
        >
          <NIcon :component="Sparkles" size="24px"></NIcon>
          Improvise +
        </SimpleButton>
      </div>

      <div class="row full-size">
        <SimpleButton class="big" @click="onOctDown">Oct -</SimpleButton>
        <SimpleButton class="big" @click="onOctUp">Oct +</SimpleButton>
      </div>

      <div class="row full-size">
        <SimpleButton class="big" @click="onClonePage">Clone 1 -> 2</SimpleButton>
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
    </div>
  </n-card>
</template>

<script lang="ts" setup>
import {DEFAULT_NOTE, Sequencer} from "~/lib/Sequencer";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {useSelectedTrackNumber} from "@/stores/trackParameters";
import {computed, ref} from "vue";
import * as Tone from "tone/Tone";
import {NCard, NIcon} from "naive-ui";
import {GridCell} from "~/lib/GridCell";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {DELAY_OPTIONS} from "@/constants";
import {toMeasure} from "~/lib/utils/toMeasure";
import {useGridEditorStore} from "@/stores/gridEditor";
import {DiceSharp as Dice, SparklesSharp as Sparkles} from "@vicons/ionicons5";

const selectedTrackNumberStore = useSelectedTrackNumber()
const gridStore = useGridEditorStore()
const sequencer = Sequencer.getInstance()

const emits = defineEmits(['update:is-open'])

const props = defineProps({
  isOpen: Boolean,
})

const swingSubdivision = ref('8n')

const selectedTrack = computed(() => {
  return sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]
})

const onFillTrack = (repeats?: number) => {
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  const trackNumber = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1
  const page = sequencer.currentPage

  for (let i = page * 16 - 15; i <= page * 16; i++) {
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

  for (let i = page * 16 - 15; i <= page * 16; i += step) {
    sequencer.writeCell(new GridCell({
      row: trackNumber,
      column: i,
      velocity: 100,
      notes: [DEFAULT_NOTE],
    }))
  }
}

const selectedTrackLength = computed(() => {
  return sequencer
      .patternMemory
      .byId(sequencer.selectedPatternId.value)
      .tracksDurationInSteps[selectedTrackNumberStore.selectedTrackIndex]
})

const onGenerateBassline = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1
  //['C2', 'B2', 'E2', 'F2'], ['D2', 'A2', 'C2', 'B2']
  sequencer.regenerateSequence(trackIndex)
}

const onOctUp = () => {
  changeOct(12)
}

const onOctDown = () => {
  changeOct(-12)
}

/**
 *
 * @param interval - number of semitones to transpose
 */
const changeOct = (interval: number): void => {
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1
  const page = sequencer.currentPage
  sequencer.sequenceGrid.filter(_ => _.row === trackIndex &&
      _.column >= page * 16 - 15 &&
      _.column <= page * 16
  ).forEach((cellPosition) => {
    const newCell = new GridCell({
      ...cellPosition,
      notes: cellPosition.notes.map(note => Tone.Frequency(note).transpose(interval).toNote()),
    })
    sequencer.writeCell(newCell)
  })
}

// todo: is broken for last page
const onShiftTrackLeft = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1
  const page = sequencer.currentPage

  sequencer.sequenceGrid.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const nextCellPosition = cellPosition.column === page * 16 - 15 ? page * 16 : cellPosition.column - 1
    const newCell = new GridCell({
      ...cellPosition,
      column: nextCellPosition,
    })
    sequencer.writeCell(newCell)
  })
}

// todo: is broken for last page
const onShiftTrackRight = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1
  const page = sequencer.currentPage

  sequencer.sequenceGrid.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const nextCellPosition = cellPosition.column === page * 16 ? page * 16 - 15 : cellPosition.column + 1
    const newCell = new GridCell({
      ...cellPosition,
      column: nextCellPosition,
    })
    sequencer.writeCell(newCell)
  })
}

const onHumanizeTrack = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1

  sequencer.sequenceGrid.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
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
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  if (!selectedTrack) {
    return
  }

  sequencer.updatePartDuration(selectedTrackNumberStore.selectedTrackIndex + 1, parseInt((event.target as HTMLSelectElement).value) || 16)
}

const onSwingTrack = (swingPercentage: number) => {
  const selectedTrack = sequencer.soundEngine.tracks.value[gridStore.selectedGridCell?.row ?? 1 - 1]
  const trackRow = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1

  if (swingPercentage === 0) {
    sequencer.sequenceGrid.filter(cell => cell.row === trackRow).forEach(cell => {
      cell.modifiers.delete(GridCellModifierTypes.swing)
      sequencer.writeCell(cell)
    })
    return
  }

  sequencer.sequenceGrid.filter(cell => cell.row === trackRow).forEach(cell => {
    cell.modifiers.set(GridCellModifierTypes.swing, {
      type: GridCellModifierTypes.swing,
      swing: swingPercentage,
      subdivision: Tone.Time(swingSubdivision.value).toSeconds() as Tone.Unit.Time
    })
    sequencer.writeCell(cell)
  })
}

const onClonePage = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1

  sequencer.sequenceGrid.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const newCell = new GridCell({
      ...cellPosition,
      column: cellPosition.column + 16,
    })
    sequencer.writeCell(newCell)
  })
}

</script>
