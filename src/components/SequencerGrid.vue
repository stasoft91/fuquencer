<template>
  <div class="sequencer-wrapper" :style="{'--grid-rows': instruments, '--grid-columns': steps}">
    <div class="sequencer">
      <div class="sequencer-grid-instruments">
        <button
            v-for="instrument in sequencer.instruments.entries()"
            :key="instrument[0]"
            class="instrument"
            @click="console.log('clicked', instrument[0])"
        >
          {{ instrument[0] }}
        </button>
      </div>
      <div class="sequencer-grid">
        <button
            v-for="gridCell in gridCells"
            :key="gridCell.id"
            class="sequencer-grid__cell"
            :class="{ 'active': gridCell.velocity > 0 }"
            :style="getStyleForCell(gridCell.row, gridCell.column)"
            @click="changeCellState(gridCell.row, gridCell.column)"
            @wheel="onNoteWheel(gridCell.row, gridCell.column, $event)"
        >
          <span v-if="gridCell.velocity > 0" class="sequencer-grid__cell__content">
            <span class="sequencer-grid__cell__content__note">
              <span class="sequencer-grid__cell__content__note__name">{{ gridCell.note }}</span>
            </span>
            <span class="sequencer-grid__cell__content__velocity">{{ gridCell.velocity }}</span>
          </span>
        </button>
        <button v-for="i in steps" disabled
                :style="getStyleForCell(0, i)"
                class="indicator"
                :class="{ 'active': playbackGridColumn === i }"
        ></button>
      </div>
    </div>

    <div class="sequence-control">
      <button @click="play">play</button>
      <button @click="stop">stop</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {GridCell} from "~/lib/Sequencer";
import {AVAILABLE_NOTES, DEFAULT_NOTE, Sequencer} from "~/lib/Sequencer";

const sequencer = new Sequencer();

const steps = 16;
let instruments = computed(() => sequencer.instrumentsLength);

let gridCells: GridCell[] = sequencer.sequenceGrid

let playbackGridColumn = computed(() => sequencer.currentStep);

const onNoteWheel = (row: number, column: number, event: WheelEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const cell = sequencer.readCell(row, column);
  const noteIndex = AVAILABLE_NOTES.indexOf(cell.note);


  if (event.shiftKey) {
    cell.velocity = cell.velocity + (event.deltaY < 0 ? 10 : -10);
    cell.velocity = Math.max(0, Math.min(100, cell.velocity));
  } else if (event.ctrlKey) {
    const newNoteIndex = noteIndex + (event.deltaY < 0 ? 12 : -12);
    cell.note = AVAILABLE_NOTES[newNoteIndex] || AVAILABLE_NOTES[(event.deltaY < 0 ? 1 : AVAILABLE_NOTES.length - 1)];
  } else {
    const newNoteIndex = noteIndex + (event.deltaY < 0 ? 1 : -1);
    cell.note = AVAILABLE_NOTES[newNoteIndex] || AVAILABLE_NOTES[(event.deltaY < 0 ? 1 : AVAILABLE_NOTES.length - 1)];
  }

  sequencer.writeCell(Sequencer.cell(row, column, cell));
};

const changeCellState = (row: number, column: number) => {
  sequencer.writeCell(Sequencer.cell(row,column, {
    velocity: sequencer.readCell(row, column).velocity > 0 ? 0 : 100,
    note: sequencer.readCell(row, column).note ? sequencer.readCell(row, column).note : DEFAULT_NOTE
  }));
};

const getStyleForCell = (rowNumber: number, columnNumber: number) => {
  return {
    gridRow: rowNumber,
    gridColumn: columnNumber,
  };
};

const play = () => {
  sequencer.play();
};
const stop = () => {
  sequencer.stop();
};


</script>

<style scoped lang="scss">
@import '@/assets/variables.scss';

.sequencer-wrapper {
  isolation: isolate;

  --grid-rows: 4;
  --grid-columns: 16;
}

.sequencer-grid {
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
}

.sequence-control {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
  margin-top: 1rem;
}

.sequence-control button {
  background-color: $color-grey-800;
  border: none;
  color: $color-grey-100;
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  border-radius: 4px;
  cursor: pointer;
}

.sequencer {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.sequencer-grid-instruments {
  display: grid;
  grid-template-rows: repeat(var(--grid-rows), 1fr) 0.5rem;
  gap: 0.25rem;
  padding: 0.25rem;
  background-color: $color-grey-600;
  border-radius: 4px;
}

.instrument {
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
  color: $color-grey-100;
  font-size: 0.75rem;
  text-align: center;
}
</style>