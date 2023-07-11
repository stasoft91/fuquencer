<template>
  <div class="sequencer-wrapper" :style="{'--grid-rows': instruments, '--grid-columns': steps}">
    <div class="sequencer">
      <div class="sequencer-grid-instruments">
        <div class="instrument">
          Kick
        </div>
        <div class="instrument">
          Clap
        </div>
        <div class="instrument">
          Hat 1
        </div>
        <div class="instrument">
          Hat 2
        </div>
      </div>
      <div class="sequencer-grid">
        <button
            v-for="gridCell in gridCells"
            :key="gridCell.id"
            class="sequencer-grid__cell"
            :class="{ 'active': gridCell.velocity > 0 }"
            :style="getStyleForCell(gridCell.row, gridCell.column)"
        >
          <span class="sequencer-grid__cell__content" @click="changeCellState(gridCell.row, gridCell.column)">
            <span class="sequencer-grid__cell__content__note">
              <span class="sequencer-grid__cell__content__note__name">{{ gridCell.noteAndOctave || '&nbsp;' }}</span>
            </span>
            <span class="sequencer-grid__cell__content__velocity">{{ gridCell.velocity || '&nbsp;' }}</span>
          </span>
        </button>
        <button v-for="i in steps" disabled
                :style="getStyleForCell(0, i)"
                class="indicator"
                :class="{ 'active': playbackGridColumn + 1 === i }"
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
import {DEFAULT_NOTE_OCTAVE, Sequencer} from "~/lib/Sequencer";
import type {GridCell} from "~/lib/Sequencer";

const steps = 16;
const instruments = 4;

const sequencer = new Sequencer();

let gridCells: GridCell[] = sequencer.sequenceGrid

let playbackGridColumn = computed(() => sequencer.currentStep);

const changeCellState = (row: number, column: number) => {
  sequencer.writeCell(Sequencer.cell(row,column, {
    velocity: sequencer.readCell(row, column).velocity > 0 ? 0 : 100,
    noteAndOctave: sequencer.readCell(row, column).noteAndOctave === DEFAULT_NOTE_OCTAVE ? '' : DEFAULT_NOTE_OCTAVE
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
}

.sequencer-grid-instruments {
  display: grid;
  grid-template-rows: repeat(var(--grid-rows), 1fr) 0.5rem;
  gap: 0.25rem;
  padding: 0.25rem;
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