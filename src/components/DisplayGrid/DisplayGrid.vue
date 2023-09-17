<template>
  <div class="display-grid-wrapper" :style="{ '--grid-rows': props.rows, '--grid-columns': props.columns}" >
    <div class="display-grid">
      <button
          v-for="gridCell in props.items.value"
          :key="gridCell.id"
          class="display-grid__cell"
          :class="getClassesForCell(gridCell)"
          :data-column="gridCell.column"
          :data-row="gridCell.row"
          :style="getStyleForCell(gridCell.row, gridCell.column, gridCell.duration)"
          @click="onClick(gridCell.row, gridCell.column)"
          @wheel="onWheel(gridCell.row, gridCell.column, $event)"
          @keyup.prevent=""
          @contextmenu="handleContextMenu"
      >
        <span v-if="gridCell.velocity > 0" class="display-grid__cell__content">
          <span class="display-grid__cell__content__note">
            <span class="display-grid__cell__content__note__name">{{ gridCell.note }}</span>
          </span>
          <span class="display-grid__cell__content__velocity">{{ gridCell.velocity }}</span>
          <span class="display-grid__cell__content__duration">{{ gridCell.duration }}</span>
        </span>
        <span :class="getClassForIndicator(gridCell)" class="button-indicator"></span>

        <span class="right-side">
          <span :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.probability)" class="fx-indicator">
            <span>rnd</span>
          </span>

          <span :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.skip)" class="fx-indicator">
            <span>{{ getSkipCellText(gridCell) }}</span>
          </span>

          <span :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.swing)" class="fx-indicator">
            <span>swg</span>
          </span>

          <span :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.flam)" class="fx-indicator">
            <span>flm</span>
          </span>

          <span :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.slide)" class="fx-indicator">
            <span>sld</span>
          </span>
        </span>
      </button>
    </div>
  </div>
  <n-dropdown
      :on-clickoutside="onClickoutside"
      :options="dropdownOptions"
      :show="isDropdownOpened"
      :x="x"
      :y="y"
      placement="bottom-start"
      trigger="manual"
      @select="handleSelect"
  />
</template>

<style scoped lang="scss">
@import '@/assets/variables.scss';

.display-grid-wrapper {
  isolation: isolate;
  width: 100%;

  --grid-rows: 4;
  --grid-columns: 16;
}

.display-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  grid-template-rows: repeat(var(--grid-rows), 1fr);
  gap: 0.25rem;
  padding: 0.25rem;

  background-color: $color-grey-600;
  overflow: hidden;
}

button.display-grid__cell {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
  background-color: $color-grey-800;
  border-left: none;
  border-top: none;
  border-right: none;
  border-bottom: none;
  cursor: pointer;
  height: 3rem;
  min-width: 1.25rem;
  outline: none;

  border-radius: 3px;
  overflow: hidden;
}

.display-grid__cell__content {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
  width: 2rem;
  font-size: 0.75rem;
}

button.active {
  background-color: $color-grey-300;
  z-index: 3;
}

button.inactive {
  background-color: $color-grey-900;
}

.sequencer-grid__cell__content__note {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
  gap: 0.25rem;
}

.sequencer-grid__cell__content__note__name {
  font-size: 0.75rem;
  font-weight: bold;
}

.sequencer-grid__cell__content__velocity {
  font-size: 0.5rem;
  font-weight: bold;
}

.first-in-quarter {
  border-left: 4px solid $color-grey-500 !important;
}

.button-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 2px;
  background-color: $color-grey-500;

  &.active {
    border: none;
    padding: 2px;
    background-color: $color-orange-opaque;
    box-shadow: inset 0 0 2px 2px $color-orange-opaque-lighter500;
  }

  &.disabled {
    background-color: $color-grey-700;
  }
}

.right-side {
  overflow: hidden;
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 0.5rem;

  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.fx-indicator {

  height: 0.5rem;
  color: lighten($color-green, 95%);
  background-color: darken($color-green, 5%);
  border-radius: 2px;

  text-transform: capitalize;

  font-size: 0.5rem;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0 0.1rem;

  &.active {
    display: flex;
  }

  &.disabled {
    color: $color-grey-700;
    display: none;
  }
}
</style>

<script setup lang="ts">
import {GRID_ROWS} from "@/constants";
import type {SkipParams} from "~/lib/Sequencer";
import {GridCell, GridCellModifierTypes, Sequencer} from "~/lib/Sequencer";
import type {Ref} from "vue";
import {nextTick, ref, toRef} from "vue";
import {Track} from "~/lib/Track";
import {NDropdown} from "naive-ui";

const sequencer = Sequencer.getInstance()

interface DisplayGridProps {
  tracks: Track[],
  rows: number,
  columns: number,
  items: Ref<GridCell[]>
}

const isDropdownOpened = ref(false)
const x = ref(0)
const y = ref(0)


const dropdownOptions = [
  {
    label: 'Probability',
    key: 'add-random'
  },
  {
    label: 'Slide',
    key: 'add-slide'
  },
  {
    label: 'Flam',
    key: 'add-flam'
  },
  {
    label: 'Skip',
    key: 'add-skip'
  },
]

const handleSelect = (key: string) => {
  isDropdownOpened.value = false

  if (!cellOfContextMenu.value) return;

  if (key === 'add-flam') {
    // TODO: prompt :(
    const flam: number = parseInt(prompt('How many times to repeat? [0-99]', '4') || '1') || 1

    cellOfContextMenu.value.modifiers.set(GridCellModifierTypes.flam, {
      type: GridCellModifierTypes.flam,
      roll: flam,
      velocity: 1,
      increaseVelocityFrom: 0.25
    })
    sequencer.writeCell(cellOfContextMenu.value)
  }

  if (key === 'add-skip') {
    // TODO: prompt :(
    const skip: number = parseInt(prompt('How many times to skip? [0-99]', '4') || '1') || 1

    cellOfContextMenu.value.modifiers.set(GridCellModifierTypes.skip, {
      type: GridCellModifierTypes.skip,
      skip: skip,
    })
    sequencer.writeCell(cellOfContextMenu.value)
  }

  if (key === 'add-slide') {
    // TODO: prompt :(
    const slide: number = parseInt(prompt('Portamento (milliseconds)', '100') || '100') || 100

    cellOfContextMenu.value.modifiers.set(GridCellModifierTypes.slide, {
      type: GridCellModifierTypes.slide,
      slide: slide,
    })
    sequencer.writeCell(cellOfContextMenu.value)
  }
}

const cellOfContextMenu: Ref<GridCell | null> = ref<GridCell | null>(null)

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  isDropdownOpened.value = false

  const dataRow = (e.currentTarget as HTMLElement).getAttribute('data-row')
  const dataColumn = (e.currentTarget as HTMLElement).getAttribute('data-column')

  cellOfContextMenu.value = props.items.value.find(cell =>
      cell.row === Number(dataRow) &&
      cell.column === Number(dataColumn)
  ) ?? null

  nextTick().then(() => {
    isDropdownOpened.value = true
    x.value = e.clientX
    y.value = e.clientY
  })
}
const onClickoutside = () => {
  isDropdownOpened.value = false
}

const props = withDefaults(defineProps<DisplayGridProps>(), {
  rows: GRID_ROWS,
  columns: 16,
  items: () => toRef([])
});

const emit = defineEmits([
    'change',
    'click',
    'wheel',
    'ctrl-wheel',
  'shift-wheel',
  'alt-wheel'
])

const calculateRealSpan = (rowNumber: number, columnNumber: number, noteLength: string) => {
  let noteSpan: number;

  switch (noteLength) {
    case '16n':
      noteSpan = 1
      break;
    case '8n':
      noteSpan = 2
      break;
    case '4n':
      noteSpan = 4
      break;
    case '2n':
      noteSpan = 8
      break;
    case '1n':
      noteSpan = 16
      break;
    default:
      noteSpan = 1
      break;
  }

  const maximumSpan = sequencer.soundEngine.tracks[rowNumber - 1]?.length - columnNumber + 1;
  let realSpan = noteSpan > sequencer.soundEngine.tracks[rowNumber - 1]?.length ? sequencer.soundEngine.tracks[rowNumber - 1].length : noteSpan
  return realSpan > maximumSpan ? maximumSpan : realSpan
}

const getStyleForCell = (rowNumber: number, columnNumber: number, noteLength: string = '16n') => {
  const hasSpan = calculateRealSpan(rowNumber, columnNumber, noteLength) > 1 ? {
    width: '100%',
    backgroundColor: `hsl(${(columnNumber * 360 / 16) % 360}, 30%, 80%)`,
    zIndex: 3,
  } : {}

  return {
    gridRow: rowNumber,
    gridColumn: columnNumber,
    gridRowEnd: 'auto',
    gridColumnEnd: 'span ' + calculateRealSpan(rowNumber, columnNumber, noteLength),
    ...hasSpan
  }
}

const getClassesForCell = (gridCell: GridCell) => {
  return {
    active: gridCell.velocity > 0,
    inactive: props.tracks[gridCell.row - 1] ? gridCell.column > props.tracks[gridCell.row - 1].length : false,
    'first-in-quarter': gridCell.column % 4 === 1,
  }
}

const onClick = (rowNumber: number, columnNumber: number) => {
    emit('click', rowNumber, columnNumber)
}

const onWheel = (rowNumber: number, columnNumber: number, event: WheelEvent) => {
  event.preventDefault()
  event.stopPropagation()
  const cell = props.items.value.find(cell => cell.row === rowNumber && cell.column === columnNumber)

  if (cell) {
    if (event.shiftKey) {
      emit('shift-wheel', cell, event)
    }
    else if (event.ctrlKey) {
      emit('ctrl-wheel', cell, event)
    } else if (event.altKey) {
      emit('alt-wheel', cell, event)
    }
    else {
      emit('wheel', cell, event)
    }
  }
}

const getClassForFxIndicator = (gridCell: GridCell, effect: GridCellModifierTypes) => {
  let length = 16

  if (props.tracks[gridCell.row - 1]) {
    length = props.tracks[gridCell.row - 1].length
  }

  return {
    active: gridCell.velocity > 0 && gridCell.modifiers.has(effect),
    disabled: gridCell.column > length
  }
}

const getClassForIndicator = (gridCell: GridCell) => {
  let length = 16

  if (props.tracks[gridCell.row - 1]) {
    length = props.tracks[gridCell.row - 1].length
  }

  let active: boolean

  if (length % 2 === 0) {
    active = gridCell.column === sequencer.currentStep

    const realSpan = calculateRealSpan(gridCell.row, gridCell.column, gridCell.duration)

    if (realSpan > 1) {
      const activeFor: number[] = []
      for (let i = 0; i < realSpan; i++) {
        activeFor.push(gridCell.column + i)
      }

      active = activeFor.includes(sequencer.currentStep)
    }
  } else {
    active = false
  }

  return {
    active,
    disabled: gridCell.column > length
  }
}

const getSkipCellText = (gridCell: GridCell): string => {
  if (gridCell.modifiers.size === 0 || gridCell.modifiers.get(GridCellModifierTypes.skip) === undefined) {
    return ''
  }

  const skipParams = (gridCell.modifiers.get(GridCellModifierTypes.skip) as SkipParams)
  const skip = skipParams.skip
  const currentlySkipped = skipParams.timesTriggered ?? 0

  return `${currentlySkipped}/${skip}`
}
</script>
