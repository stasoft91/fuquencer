<template>
  <n-card :title="getTitleForCard()" class="step-jobs-wrapper" closable @close="handleClose">
    <div class="row">

      <div v-if="isArpeggio && _internalState.cell.arpeggiator" class="row">
        <div class="row">
          <label for="">Arpeggiator type</label>
          <select
              id="arpeggiator-type"
              v-model="_internalState.cell.arpeggiator.type"
              class="full-size big"
              @change="handleUpdateCell"
          >
            <option v-for="arpType in AVAILABLE_ARPEGGIATOR_TYPES" :key="arpType" :value="arpType">
              {{ arpType }}
            </option>
          </select>

          <label for="">Pulses</label>
          <input v-model="_internalState.cell.arpeggiator.pulses" class="full-size big" type="number"
                 @change="handleUpdateCell"
          >

          <label for="">Parts</label>
          <input v-model="_internalState.cell.arpeggiator.parts" class="full-size big" type="number"
                 @change="handleUpdateCell"
          >

          <label for="">Shift</label>
          <input v-model="_internalState.cell.arpeggiator.shift" class="full-size big" type="number"
                 @change="handleUpdateCell"
          >

          <label for="">Gate</label>
          <select
              id="gate"
              :value="Tone.Time(_internalState.cell.arpeggiator.gate).toSeconds()"
              class="full-size big"
              @change="onGateChange">
            <option v-for="measure in ['1m', '2n', '4n', '8n', '16n', '16n.', '32n', '32n.', '64n']" :key="measure"
                    :value="Tone.Time(measure).toSeconds()">{{ toMeasure(measure) }}
            </option>
          </select>
        </div>
      </div>

      <div class="row">
        <label for="">Notes</label>
        <chord-editor :value="selectedCell?.notes ?? _internalState.cell.notes"
                      @update:value="onUpdateNotes"></chord-editor>

        <label for="">Duration</label>
        <select id="gate"
                :value="Tone.Time(_internalState.cell.duration).toSeconds()"
                class="full-size big"
                @change="onDurationChange"
        >
          <option
              v-for="measure in durationOptions.filter(_ => Tone.Time(_).toSeconds() !== selectedCellDurationSec)"
              :key="measure"
              :value="Tone.Time(measure).toSeconds()">
            {{ toMeasure(measure) }}
          </option>
          <option :value="selectedCellDurationSec">{{ toMeasure(selectedCellDurationSec) }}</option>
        </select>

        <label for="">Velocity</label>
        <input :value="cell.velocity" class="full-size big" type="number" @change="onVelocityChange">

        <label for="">Mods</label>

        <div v-for="key in AVAILABLE_CELL_MODIFIERS" :key="key" class="row full-size">
          <label for="">
            <n-switch :value="cell.modifiers.has(key)" @update:value="setModifier(key)"/>
            {{ key.toLocaleUpperCase() }}
          </label>

          <template v-if="cell.modifiers.has(key)">

            <label v-if="key === GridCellModifierTypes.probability" for="">
              Probability
              <input
                  :value="cell.modifiers.get(key)!['probability']"
                  class="big full-size"
                  max="100"
                  min="0"
                  type="number"
                  @change="onCellModifierUpdate(key, 'probability', $event)">
            </label>

            <label v-if="key === GridCellModifierTypes.flam" for="">
              Roll
              <input
                  :value="cell.modifiers.get(key)!['roll']"
                  class="full-size big"
                  max="100"
                  min="1"
                  type="number"
                  @change="onCellModifierUpdate(key, 'roll', $event)">
            </label>

            <label v-if="key === GridCellModifierTypes.flam" for="">
              Velocity [0.0 - 1.0]
              <input
                  v-if="key === GridCellModifierTypes.flam"
                  :value="cell.modifiers.get(key)!['velocity']"
                  class="full-size big"
                  max="1"
                  min="0"
                  step="0.01"
                  type="number"
                  @change="onCellModifierUpdate(key, 'velocity', $event, parseFloat)">
            </label>

            <label v-if="key === GridCellModifierTypes.flam" for="">
              Velocity start [0.0 - 1.0]
              <input
                  v-if="key === GridCellModifierTypes.flam"
                  :value="cell.modifiers.get(key)!['increaseVelocityFrom']"
                  class="full-size big"
                  max="1"
                  min="0"
                  step="0.01"
                  type="number"
                  @change="onCellModifierUpdate(key, 'increaseVelocityFrom', $event, parseFloat)">
            </label>

            <label v-if="key === GridCellModifierTypes.swing" for="">
              Swing [0-100]
              <input
                  :value="cell.modifiers.get(key)!['swing']"
                  class="full-size big"
                  max="100"
                  min="0"
                  type="number"
                  @change="onCellModifierUpdate(key, 'swing', $event)">
            </label>
            <label v-if="key === GridCellModifierTypes.swing" for="">
              Subdivision
              <select
                  v-if="key === GridCellModifierTypes.swing"
                  :value="Tone.Time(cell.modifiers.get(key)!['subdivision']).toSeconds()"
                  class="full-size big"
                  @change="onCellModifierUpdate(key, 'subdivision', $event)">
                <option v-for="measure in ['1m', '2n', '4n', '8n', '16n', '16n.', '32n', '32n.', '64n']" :key="measure"
                        :value="Tone.Time(measure).toSeconds()">{{ toMeasure(measure) }}
                </option>
              </select>
            </label>

            <label v-if="key === GridCellModifierTypes.skip" for="">
              Skip
              <input
                  v-if="key === GridCellModifierTypes.skip"
                  :value="cell.modifiers.get(key)!['skip']"
                  class="full-size big"
                  type="number"
                  @change="onCellModifierUpdate(key, 'skip', $event)">
            </label>

            <label v-if="key === GridCellModifierTypes.slide" for="">
              Portamento (ms)
              <input
                  v-if="key === GridCellModifierTypes.slide"
                  :value="cell.modifiers.get(key)!['slide']"
                  class="full-size big"
                  type="number"
                  @change="onCellModifierUpdate(key, 'slide', $event)">
            </label>

          </template>

        </div>

      </div>
    </div>
  </n-card>
</template>

<script lang="ts" setup>
import {NCard, NSwitch} from "naive-ui";
import {computed, onUpdated, reactive} from "vue";
import {Sequencer} from "~/lib/Sequencer";
import {AVAILABLE_ARPEGGIATOR_TYPES, AVAILABLE_CELL_MODIFIERS} from "@/constants";
import {useGridEditorStore} from "@/stores/gridEditor";
import type {GridCellModifier} from "~/lib/GridCell.types";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {GridCell} from "~/lib/GridCell";
import ChordEditor from "@/components/ui/ChordEditor.vue";
import * as Tone from "tone/Tone";
import {toMeasure} from "~/lib/utils/toMeasure";
import {cloneDeep} from "lodash";

const gridEditorStore = useGridEditorStore()
const sequencer = Sequencer.getInstance()
const durationOptions = ['1m', '2n', '4n', '8n', '16n']

type Props = {
  cell: GridCell
}

const props = defineProps<Props>();

onUpdated(() => {
  if (props.cell !== _internalState.cell) {
    refreshInternalState(props.cell)
  }
})

const _internalState = reactive({
  cell: new GridCell(props.cell),
} as Props)

const selectedCell = computed(() => {
  return gridEditorStore.selectedGridCell
})

const trackOfSelectedCell = computed(() => {
  return sequencer.soundEngine.tracks.value[(selectedCell.value?.row ?? 0) - 1]
})

const isArpeggio = computed(() => {
  return (selectedCell.value?.notes.length || 0) > 1
})

const selectedCellDurationSec = computed(() => {
  return Tone.Time(_internalState.cell.duration).toSeconds()
})

function handleUpdateCell() {
  if (selectedCell.value === null) {
    return
  }

  const newGridCell = new GridCell({
    ...selectedCell.value,
    ..._internalState.cell,
  })

  sequencer.writeCell(newGridCell)
  refreshInternalState(newGridCell)
}

function refreshInternalState(newGridCell: GridCell) {
  _internalState.cell = newGridCell
  gridEditorStore.setSelectedGridCell(newGridCell)
}

function handleClose() {
  gridEditorStore.setSelectedGridCell(null)
}

function getTitleForCard() {
  if (selectedCell.value === null) {
    return 'Step jobs'
  }

  return `${trackOfSelectedCell.value.name}: [${selectedCell.value?.column}]`
}

function setModifier(key: GridCellModifierTypes) {
  if (selectedCell.value === null) {
    return
  }

  const modifiers = new Map(cloneDeep(selectedCell.value.modifiers))

  if (modifiers.has(key)) {
    modifiers.delete(key)
  } else {
    modifiers.set(key, GridCell.getDefaultValueForModifier(key))
  }

  const newGridCell = new GridCell({
    ...selectedCell.value,
    modifiers,
  })

  sequencer.writeCell(newGridCell)
  refreshInternalState(newGridCell)
}

function onUpdateNotes(updatedNotes: string[]) {
  console.log('updatedNotes', updatedNotes)

  if (selectedCell.value) {
    _internalState.cell.notes = updatedNotes
    if (updatedNotes.length > 1) {
      if (!_internalState.cell.arpeggiator) {
        _internalState.cell.arpeggiator = {
          gate: Tone.Time('16n').toSeconds() as Tone.Unit.Time,
          type: 'downUp',
          pulses: 4,
          parts: 9,
          shift: 0,
        }
      }
    } else {
      _internalState.cell.arpeggiator = undefined
    }

    handleUpdateCell()
  }
}

function onGateChange(ev: Event) {
  if (!_internalState.cell.arpeggiator) {
    return
  }

  _internalState.cell.arpeggiator.gate = Tone.Time((ev.target as HTMLInputElement).value).toSeconds() as Tone.Unit.Time
  handleUpdateCell()
}

function onDurationChange(ev: Event) {
  _internalState.cell.duration = Tone.Time((ev.target as HTMLInputElement).value).toSeconds() as Tone.Unit.Time
  handleUpdateCell()
}

function onVelocityChange(ev: Event) {
  _internalState.cell.velocity = parseInt((ev.target as HTMLInputElement).value)
  handleUpdateCell()
}

function onCellModifierUpdate(
    modifierType: GridCellModifierTypes,
    fieldName: keyof GridCellModifier,
    $event: Event,
    converter: Function = ((_: any) => _)
) {
  if (selectedCell.value === null) {
    return
  }

  const modifiers = new Map(cloneDeep(selectedCell.value.modifiers))

  const modifier = modifiers.get(modifierType)

  if (!modifier) {
    return
  }

  modifiers.set(modifierType, {
    ...modifier,
    [fieldName]: converter(($event.target as HTMLInputElement).value)
  })

  const newGridCell = new GridCell({
    ...selectedCell.value,
    modifiers,
  })

  sequencer.writeCell(newGridCell)
  refreshInternalState(newGridCell)
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
