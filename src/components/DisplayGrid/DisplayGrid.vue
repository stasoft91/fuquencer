<template>
  <div class="display-grid-wrapper" :style="{ '--grid-rows': props.rows, '--grid-columns': props.columns}" >
    <div class="display-grid">
      <button
          v-for="gridCell in props.items"
          :key="gridCell.id"
          class="display-grid__cell"
          :class="getClassesForCell(gridCell)"
          :data-column="gridCell.column"
          :data-row="gridCell.row"
          :style="getStyleForCell(gridCell.row, gridCell.column, gridCell.duration)"
          @click="onClick(gridCell.row, gridCell.column)"
          @wheel="onWheel(gridCell.row, gridCell.column, $event)"
          @keyup.prevent=""
          @mouseleave="handleMouseLeave"
          @mousemove="handleMouseEnter"
          @contextmenu="handleContextMenu"
      >
        <span class="left-side">
          <span :class="getClassForPolyrhythmIndicator(gridCell)" class="button-indicator"></span>
        </span>

        <span v-if="gridCell.velocity > 0" class="display-grid__cell__content">
          <span class="display-grid__cell__content__note">
            <span class="display-grid__cell__content__note__name">{{ getNoteText(gridCell) }}</span>
          </span>
          <span class="display-grid__cell__content__velocity">{{ gridCell.velocity }}</span>
          <span class="display-grid__cell__content__duration">{{ toMeasure(gridCell.duration) }}</span>
        </span>

        <span class="right-side">
          <span v-if="gridCell.hasModifier(GridCellModifierTypes.probability)"
                :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.probability)" class="fx-indicator">
            <span>rnd</span>
          </span>

          <span
              v-if="gridCell.hasModifier(GridCellModifierTypes.skip)"
              :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.skip)" class="fx-indicator">
            <span>{{ getSkipCellText(gridCell) }}</span>
          </span>

          <span
              v-if="gridCell.hasModifier(GridCellModifierTypes.swing)"
              :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.swing)" class="fx-indicator">
            <span>swg</span>
          </span>

          <span
              v-if="gridCell.hasModifier(GridCellModifierTypes.flam)"
              :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.flam)" class="fx-indicator">
            <span>flm</span>
          </span>

          <span
              v-if="gridCell.hasModifier(GridCellModifierTypes.slide)"
              :class="getClassForFxIndicator(gridCell, GridCellModifierTypes.slide)" class="fx-indicator">
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
  justify-content: start;
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

  padding: 0.1rem 0 0 0.1rem;

  gap: 0.1rem;

  transition: opacity 0.1s ease-in-out;
}

button.display-grid__cell.row-with-opacity {
  opacity: 0.33;
}

button.display-grid__cell.row-with-opacity.is-hovered {
  opacity: 1;
}

button.display-grid__cell.active.is-editing {
  box-shadow: inset 0 0 2px 2px $color-orange-opaque,
  inset 0 0 3px 3px $color-orange-opaque-lighter500;
}

.display-grid__cell__content {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
  font-size: 0.8rem;

  text-align: start;
}

.display-grid__cell__content__duration {
  font-size: 85%;
}

.display-grid__cell__content__note__name {
}

.display-grid__cell__content__velocity {
  font-size: 85%;
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
  //position: absolute;
  //top: 2px;
  //left: 2px;
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

.right-side, .left-side {
  overflow: hidden;
  min-width: 0.5rem;

  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.right-side {
  position: absolute;
  right: 0;
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
import type {SkipParams} from "~/lib/GridCell.types";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {GridCell} from "~/lib/GridCell";
import {Sequencer} from "~/lib/Sequencer";
import type {Ref} from "vue";
import {computed, nextTick, ref} from "vue";
import {Track} from "~/lib/Track";
import {NDropdown} from "naive-ui";
import {toMeasure} from "~/lib/utils/toMeasure";
import getStepFromBarsBeatsSixteens from "~/lib/utils/getStepFromBarsBeatsSixteens";
import * as Tone from "tone/Tone";
import {useGridEditorStore} from "@/stores/gridEditor";
import {cloneDeep} from "lodash";
import {useContextMenu} from "@/components/DisplayGrid/useContextMenu";

const sequencer = Sequencer.getInstance()

const gridEditor = useGridEditorStore()

interface DisplayGridProps {
  tracks: Track[],
  rows: number,
  columns: number,
  items: GridCell[],
  isPlaying: boolean,
}

const {onClickoutside, y, x, isDropdownOpened} = useContextMenu()

const hoveredCell = ref<GridCell | null>(null)

const gridEditorStore = useGridEditorStore()

const dropdownOptions = [
  {
    label: 'Probability',
    key: 'add-probability'
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
  {
    label: 'Edit Step',
    key: 'edit-step'
  },
  {
    label: 'Clear',
    key: 'clear'
  },
]

const handleSelect = (key: string) => {
  isDropdownOpened.value = false

  if (!cellOfContextMenu.value || !cellOfContextMenu.value?.velocity) {
    return;
  }

  const modifiers = new Map(cloneDeep(cellOfContextMenu.value).modifiers)

  if (key === 'add-probability') {
    const probability: number = parseInt(prompt('Probability [0-100]', '50') || '100') || 100

    if (probability === 100) {
      modifiers.delete(GridCellModifierTypes.probability)
      sequencer.writeCell(new GridCell({...cellOfContextMenu.value, modifiers}))
      return
    }

    modifiers.set(GridCellModifierTypes.probability, {
      type: GridCellModifierTypes.probability,
      probability: probability,
    })
    sequencer.writeCell(new GridCell({...cellOfContextMenu.value, modifiers}))
  }

  if (key === 'add-flam') {
    // TODO: prompt :(
    const flam: number = parseInt(prompt('How many times to repeat? [0-99]', '4') || '1') || 1

    if (flam === 0 || flam === 1) {
      modifiers.delete(GridCellModifierTypes.flam)
      sequencer.writeCell(new GridCell({...cellOfContextMenu.value, modifiers}))

      return
    }

    modifiers.set(GridCellModifierTypes.flam, {
      type: GridCellModifierTypes.flam,
      roll: flam,
      velocity: 1,
      increaseVelocityFrom: 0.25
    })
    sequencer.writeCell(new GridCell({...cellOfContextMenu.value, modifiers}))
  }

  if (key === 'add-skip') {
    // TODO: prompt :(
    const skip: number = parseInt(prompt('How many skips to accumulate before triggering? [0-99]', '4') || '1') || 1

    if (skip === 0 || skip === 1) {
      modifiers.delete(GridCellModifierTypes.skip)
      sequencer.writeCell(new GridCell({...cellOfContextMenu.value, modifiers}))

      return
    }

    modifiers.set(GridCellModifierTypes.skip, {
      type: GridCellModifierTypes.skip,
      skip: skip,
    })
    sequencer.writeCell(new GridCell({...cellOfContextMenu.value, modifiers}))
  }

  if (key === 'add-slide') {
    // TODO: prompt :(
    const slide: number = parseInt(prompt('Portamento (milliseconds) [0-9999]', '100') || '0') || 0

    if (slide === 0) {
      modifiers.delete(GridCellModifierTypes.slide)
      sequencer.writeCell(new GridCell({...cellOfContextMenu.value, modifiers}))
      return
    }

    modifiers.set(GridCellModifierTypes.slide, {
      type: GridCellModifierTypes.slide,
      slide: slide,
    })
    sequencer.writeCell(new GridCell({...cellOfContextMenu.value, modifiers}))
  }

  if (key === 'edit-step') {
    gridEditor.setSelectedGridCell(cellOfContextMenu.value)
  }

  if (key === 'clear') {
    cellOfContextMenu.value.modifiers.clear()
    sequencer.writeCell(cellOfContextMenu.value)
  }
}

const cellOfContextMenu: Ref<GridCell | null> = ref<GridCell | null>(null)

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  isDropdownOpened.value = false

  const dataRow = (e.currentTarget as HTMLElement).getAttribute('data-row')
  const dataColumn = (e.currentTarget as HTMLElement).getAttribute('data-column')

  cellOfContextMenu.value = props.items.find(cell =>
      cell.row === Number(dataRow) &&
      cell.column === Number(dataColumn)
  ) ?? null

  if (!cellOfContextMenu.value?.velocity) {
    return
  }

  nextTick().then(() => {
    isDropdownOpened.value = true
    x.value = e.clientX
    y.value = e.clientY
  })
}

const props = withDefaults(defineProps<DisplayGridProps>(), {
  rows: GRID_ROWS,
  columns: 16,
  isPlaying: () => false,
});

const emit = defineEmits([
  'change',
  'click',
  'wheel',
  'ctrl-wheel',
  'shift-wheel',
  'alt-wheel'
])

const calculateRealSpan = (rowNumber: number, columnNumber: number, noteLength: Tone.Unit.Time) => {
  let noteSpan: number;

  noteSpan = getStepFromBarsBeatsSixteens(Tone.Time(noteLength).toBarsBeatsSixteenths()) - 1

  const maximumSpan = sequencer.soundEngine.tracks.value[rowNumber - 1]?.length - columnNumber + 1;

  return columnNumber + noteSpan > sequencer.soundEngine.tracks.value[rowNumber - 1]?.length ? maximumSpan : noteSpan
}

const getStyleForCell = (rowNumber: number, columnNumber: number, noteLength: Tone.Unit.Time) => {
  const hasSpan = calculateRealSpan(rowNumber, columnNumber, noteLength) > 1 ? {
    width: '100%',
    backgroundColor: `hsl(${(columnNumber * 360 / 16) % 360}, 30%, 80%)`,
    zIndex: 3,
  } : {}

  const doesCellHaveVelocity = props.items.filter(_ =>
      // we look for an intersection in the row currently hovered
      _.row === rowNumber &&
      // look for cells after the hovered in same row
      _.column === columnNumber &&
      // filter out cells that are not active
      _.velocity > 0
  ).length > 0

  return {
    gridRow: rowNumber,
    gridColumn: columnNumber,
    gridRowEnd: 'auto',
    gridColumnEnd: doesCellHaveVelocity ? 'span ' + calculateRealSpan(rowNumber, columnNumber, noteLength) : 'auto',
    ...(doesCellHaveVelocity ? hasSpan : {})
  }
}

const getClassesForCell = (gridCell: GridCell) => {
  return {
    active: gridCell.velocity > 0,
    inactive:
        props.tracks[gridCell.row - 1] ?
            gridCell.column > props.tracks[gridCell.row - 1].length :
            false,
    'first-in-quarter': gridCell.column % 4 === 1,
    'row-with-opacity':
        hoveredCell.value !== null &&
        hoveredCell.value.row === gridCell.row &&
        stepOfHoveredCellFinish.value !== null,
    'is-hovered': hoveredCell.value?.id === gridCell.id,

    'is-editing': gridEditorStore.selectedGridCell?.id === gridCell.id,
  }
}

const onClick = (rowNumber: number, columnNumber: number) => {
    emit('click', rowNumber, columnNumber)
}

const onWheel = (rowNumber: number, columnNumber: number, event: WheelEvent) => {
  event.preventDefault()
  event.stopPropagation()
  const cell = sequencer.readCell(rowNumber, columnNumber)

  if (cell) {
    if (event.shiftKey) {
      emit('shift-wheel', cell, event)
    }
    else if (event.ctrlKey) {
      emit('ctrl-wheel', cell, event)
    } else if (event.altKey) {
      emit('alt-wheel', cell, event)
      // check if there is an intersection now, after we just changed the duration
      handleMouseEnter(event)
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

const getSkipCellText = (gridCell: GridCell): string => {
  if (gridCell.modifiers.size === 0 || !gridCell.modifiers.get(GridCellModifierTypes.skip)) {
    return ''
  }

  const skipParams = (gridCell.modifiers.get(GridCellModifierTypes.skip) as SkipParams)
  const skip = skipParams.skip
  const currentlySkipped = skipParams.timesTriggered ?? 0

  return `${currentlySkipped}/${skip}`
}

const stepOfHoveredCellFinish = ref<number | null>(1)

/**
 * Returns the step of the cell finish, based on the cell duration
 * @param cell
 * @param duration
 */
const stepOfCellFinish = (cell: GridCell, duration: Tone.Unit.Time): number => {
  return cell.column + getStepFromBarsBeatsSixteens(Tone.Time(duration).toBarsBeatsSixteenths()) - 1
}

const handleMouseEnter = (e: MouseEvent) => {
  const dataRow = (e.currentTarget as HTMLElement).getAttribute('data-row')
  const dataColumn = (e.currentTarget as HTMLElement).getAttribute('data-column')

  const cell = props.items.find(cell =>
      cell.row === Number(dataRow) &&
      cell.column === Number(dataColumn)
  )

  if (!cell || !cell.velocity) {
    return
  }

  const durationOf16n = Tone.Time('16n')

  // all of this can happen only if cell is longer than 1/16
  if (Tone.Time(cell.duration).toSeconds() > durationOf16n.toSeconds()) {

    let hasIntersection = props.items.filter(_ =>
            // we look for an intersection in the row currently hovered
            _.row === cell.row &&
            // look for cells after the hovered in same row
            _.column > cell.column &&
            // filter out cells that are not active
            _.velocity > 0
        // check if any of the cells is in the range of the hovered cell
    ).some(_ => _.column < stepOfCellFinish(cell, cell.duration))

    hasIntersection = hasIntersection || props.items.filter(_ =>
            // we look for an intersection in the row currently hovered
            _.row === cell.row &&
            // look for cells before the hovered in same row
            _.column < cell.column &&
            // filter out cells that are not active
            _.velocity > 0
        // check if any of the cells is in the range of the hovered cell
    ).some(_ => stepOfCellFinish(_, _.duration) > cell.column)

    if (hasIntersection) {
      hoveredCell.value = cell
      stepOfHoveredCellFinish.value = stepOfCellFinish(cell, cell.duration)
    } else {
      hoveredCell.value = null
    }
  }
}

const handleMouseLeave = () => {
  hoveredCell.value = null
}

const getNoteText = (gridCell: GridCell) => {
  return gridCell.notes.length > 1 ? 'Arp' :
      gridCell.notes.length === 1 ? gridCell.notes[0] :
          'Rst'

}

const indicatorMatrix = computed(() => {
  return sequencer.indicatorMatrix
})

const getClassForPolyrhythmIndicator = (gridCell: GridCell) => {
  const trackCells = indicatorMatrix.value.value[gridCell.row - 1]
  let isActive: boolean = trackCells[gridCell.column - 1]

  const realSpan: number = calculateRealSpan(gridCell.row, gridCell.column, gridCell.duration)

  if (gridCell.velocity > 0 && realSpan > 1) {
    const activeFor: number[] = []
    for (let i = 0; i < realSpan; i++) {
      activeFor.push(gridCell.column + i)
    }

    isActive = activeFor.includes(trackCells.indexOf(true) + 1)
  }

  return {
    active: isActive,
    disabled: gridCell.column > props.tracks[gridCell.row - 1]?.length
  }
}
</script>
