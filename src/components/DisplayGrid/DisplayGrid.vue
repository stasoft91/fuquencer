<template>
  <div class="display-grid-wrapper" :style="{ '--grid-rows': props.rows, '--grid-columns': props.columns}" >
    <div class="display-grid">
      <button
          v-for="gridCell in props.items.value"
          :key="gridCell.id"
          class="display-grid__cell"
          :class="getClassesForCell(gridCell)"
          :style="getStyleForCell(gridCell.row, gridCell.column)"
          @click="onClick(gridCell.row, gridCell.column)"
          @wheel="onWheel(gridCell.row, gridCell.column, $event)"
          @keyup.prevent=""
      >
          <span v-if="gridCell.velocity > 0" class="display-grid__cell__content">
            <span class="display-grid__cell__content__note">
              <span class="display-grid__cell__content__note__name">{{ gridCell.note }}</span>
            </span>
            <span class="display-grid__cell__content__velocity">{{ gridCell.velocity }}</span>
          </span>
      </button>
    </div>
  </div>
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
  flex: 1 0 720px;
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  grid-template-rows: repeat(var(--grid-rows), 1fr);
  gap: 0.25rem;
  padding: 0.25rem;

  background-color: $color-grey-600;
  overflow: hidden;
}

.display-grid__row {
}

.display-grid__cell {
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
  height: 3rem;
  outline: none;
}

.display-grid__cell__content {
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
  border-left: 4px solid $color-grey-500;
}
</style>

<script setup lang="ts">
import {GRID_ROWS} from "@/constants";
import type {GridCell} from "~/lib/Sequencer";
import type {Ref} from "vue";
import {toRef} from "vue";

interface DisplayGridProps {
  rows: number,
  columns: number,
  items: Ref<GridCell[]>
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
    'shift-wheel'
])

const getStyleForCell = (rowNumber: number, columnNumber: number) => {
  return {
    gridRow: rowNumber,
    gridColumn: columnNumber
  }
}

const getClassesForCell = (gridCell: GridCell) => {
  return {
    active: gridCell.velocity > 0,
    'first-in-quarter': gridCell.column % 4 === 1,
    'last-in-quarter': gridCell.column % 4 === 0,
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
    }
    else {
      emit('wheel', cell, event)
    }
  }
}
</script>
