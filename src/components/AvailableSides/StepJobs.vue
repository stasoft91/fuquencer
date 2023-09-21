<template>
  <n-card :title="getTitleForCard()" class="step-jobs-wrapper" closable @close="handleClose">
    <div class="row">

      <div v-if="isArpeggio" class="row">
        <div class="row">
          <label for="">Arpeggiator type</label>
          <select
              id="arpeggiator-type"
              v-model="_internalState.type"
              class="full-size big"
          >
            <option v-for="arpType in AVAILABLE_ARPEGGIATOR_TYPES" :key="arpType" :value="arpType">
              {{ arpType }}
            </option>
          </select>

          <label for="">Pulses</label>
          <input v-model="_internalState.pulses" :max="_internalState.parts" class="full-size big" type="number">

          <label for="">Parts</label>
          <input v-model="_internalState.parts" class="full-size big" type="number">

          <label for="">Shift</label>
          <input v-model="_internalState.shift" class="full-size big" type="number">

          <label for="">Gate</label>
          <select id="gate" v-model="_internalState.gate" class="full-size big">
            <option v-for="measure in ['1m', '2n', '4n', '8n', '16n', '16n.', '32n', '32n.', '64n']" :key="measure"
                    :value="Tone.Time(measure).toSeconds()">{{ toMeasure(measure) }}
            </option>
          </select>
        </div>
      </div>

      <div class="row">
        <label for="">Notes</label>
        <chord-editor :value="_internalState.notes" @update:value="onUpdateNotes"></chord-editor>

        <label for="">Duration</label>
        <select id="gate" :value="Tone.Time(_internalState.duration).toSeconds()"
                class="full-size big"
                @change="_internalState.duration = $event.target?.value"
        >
          <option
              v-for="measure in durationOptions.filter(_ => Tone.Time(_).toSeconds() !== selectedCellDurationSec)"
              :key="measure"
              :value="Tone.Time(measure).toSeconds()">
            {{ toMeasure(measure) }}
          </option>
          <option :value="selectedCellDurationSec">{{ toMeasure(selectedCellDurationSec) }}</option>
        </select>

        <SimpleButton class="full-size big" @click="handleArpeggiate">Apply</SimpleButton>
      </div>
    </div>
  </n-card>
</template>

<script lang="ts" setup>
import {NCard} from "naive-ui";
import {computed, onMounted, onUnmounted, onUpdated, reactive, watch} from "vue";
import {DEFAULT_NOTE, Sequencer} from "~/lib/Sequencer";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {AVAILABLE_ARPEGGIATOR_TYPES} from "@/constants";
import {useGridEditor} from "@/stores/gridEditor";
import type {GridCellArpeggiator} from "~/lib/GridCell";
import {GridCell} from "~/lib/GridCell";
import ChordEditor from "@/components/ui/ChordEditor.vue";
import * as Tone from "tone/Tone";
import {toMeasure} from "~/lib/utils/toMeasure";

const gridEditorStore = useGridEditor()
const sequencer = Sequencer.getInstance()
const durationOptions = ['1m', '2n', '4n', '8n', '16n']

type Props = Omit<GridCellArpeggiator, 'notes'> & {
  notes: string[],
  duration: number,
}

const props = withDefaults(defineProps<Props>(), {
  notes: () => [DEFAULT_NOTE],
  type: 'upDown',
  pulses: 4,
  parts: 16,
  shift: 0,
  gate: Tone.Time('16n').toSeconds(),
  duration: Tone.Time('16n').toSeconds(),
});

const _internalState = reactive({
  notes: props.notes,
  type: props.type,
  pulses: props.pulses,
  parts: props.parts,
  shift: props.shift,
  gate: props.gate,
  duration: props.duration,
} as Props)

const selectedCell = computed(() => {
  return gridEditorStore.selectedGridCell
})

const trackOfSelectedCell = computed(() => {
  return sequencer.soundEngine.tracks[(selectedCell.value?.row ?? 0) - 1]
})

const isArpeggio = computed(() => {
  return (selectedCell.value?.notes.length || 0) > 1
})

const selectedCellDurationSec = computed(() => {
  return Tone.Time(selectedCell.value?.duration ?? '16n').toSeconds()
})

let unwatch: Function | undefined = undefined

const appendWatcher = () => {
  unwatch && unwatch();

  unwatch = watch(gridEditorStore.selectedGridCell as GridCell, (newGridCell) => {
    if (newGridCell) {
      refreshInternalState(newGridCell)
    }
  }, {
    deep: true,
    immediate: true,
  })
}

onUnmounted(() => {
  unwatch && unwatch();
  unwatch = undefined;
})

onUpdated(() => {
  appendWatcher()
})

onMounted(() => {
  appendWatcher()
})

const handleArpeggiate = () => {
  if (selectedCell.value === null) {
    return
  }

  const newGridCell = new GridCell({
    ...selectedCell.value,
    notes: _internalState.notes,
    duration: _internalState.duration,
    arpeggiator: {
      parts: _internalState.parts,
      pulses: _internalState.pulses,
      shift: _internalState.shift,
      type: _internalState.type,
      gate: Tone.Time(_internalState.gate).toSeconds(),
    }
  })
  sequencer.writeCell(newGridCell)
  refreshInternalState(newGridCell)
}

const refreshInternalState = (newGridCell: GridCell) => {
  _internalState.notes = newGridCell.notes
  _internalState.duration = Tone.Time(newGridCell.duration).toSeconds()
  _internalState.type = newGridCell.arpeggiator?.type ?? 'upDown'
  _internalState.pulses = newGridCell.arpeggiator?.pulses ?? 4
  _internalState.parts = newGridCell.arpeggiator?.parts ?? 16
  _internalState.shift = newGridCell.arpeggiator?.shift ?? 0
  _internalState.gate = newGridCell.arpeggiator?.gate ?? Tone.Time('16n').toSeconds()
}

const handleClose = () => {
  gridEditorStore.setSelectedGridCell(null)
}

const getTitleForCard = () => {
  if (selectedCell.value === null) {
    return 'Arpeggiator'
  }

  return `Arpeggiator for ${trackOfSelectedCell.value.name}`
}

const onUpdateNotes = (updatedNotes: string[]) => {
  if (selectedCell.value) {
    _internalState.notes = updatedNotes
  }
}

</script>

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

.n-card-header {
  position: relative;
}

button.close {
  position: absolute;
  top: 0;
  right: 0;
  background: transparent;
  border: none;
  font-size: 1rem;
  padding: var(--n-padding-top) var(--n-padding-left) var(--n-padding-bottom) var(--n-padding-left);
  cursor: pointer;
  color: #fff;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

label {
  width: 100%;
}
</style>
