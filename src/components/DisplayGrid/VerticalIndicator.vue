<template>
  <div class="vertical-indicator" :style="{ '--grid-rows': rows, '--space': space }">
    <div
      class="vertical-indicator__cell"
      v-for="(row, rowIndex) in rows"
      :key="row"
      :style="getStyleForCell(row, 1)"
      :class="{ active: rowIndex === selectedRow }"
      @click="emit('selectRow', rowIndex)"
    >
      {{ rowCaptions && rowCaptions[rowIndex] ? rowCaptions[rowIndex] : `Track ${row}` }}
      {{ polyrythms && polyrythms[rowIndex] ? `(+${polyrythms[rowIndex]})` : '' }}
      <DisplayWaveform
          v-if="shouldDisplayWaveform(rowIndex)"
          :id="`vertical-indicator-${rowIndex}`"
          :url="tracks[rowIndex].meta.get('urls')[DEFAULT_NOTE] ?? ''"
          :wave-color="rowIndex === selectedRow ? '#edf2f7' : '#a0aec0'"
          :normalize="true"
      ></DisplayWaveform>
    </div>
  </div>
</template>

<style scoped lang="scss" >
@import '@/assets/variables.scss';

.vertical-indicator {
  display: grid;
  grid-template-columns: $first-column-spacing;
  grid-template-rows: repeat(var(--grid-rows), 3rem) var(--space, 0.75rem);
  gap: 0.25rem;
  padding: 0.25rem 0 0 0.25rem;

  background-color: $color-grey-600;
  overflow: hidden;
}

.vertical-indicator__cell {
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
  outline: none;
}

.active {
  border: none;
  padding: 4px;
  background-color: $color-orange-opaque;
  box-shadow: inset 0 0 2px 2px $color-orange-opaque-lighter100;
  color: $color-grey-100;
}

</style>

<script setup lang="ts">
import DisplayWaveform from "@/components/DisplayWaveform/DisplayWaveform.vue";
import type {Track} from "~/lib/Track";
import {computed} from "vue";
import {DEFAULT_NOTE} from "~/lib/Sequencer";

interface Props {
  tracks: Track[],

  selectedRow: number,
  rows: number,
  space?: string
  polyrythms?: number[]
}

const props = defineProps<Props>()

const emit = defineEmits(['selectRow'])

const getStyleForCell = (rowNumber: number, columnNumber: number) => {
  return {
    gridRow: rowNumber,
    gridColumn: columnNumber
  }
}

const shouldDisplayWaveform = (rowIndex: number) => {
  return props.tracks.find(t => t.name === rowCaptions.value[rowIndex])?.type === 'sample'
}

const rowCaptions = computed(() => {
  return props.tracks.map(t => t.name)
})
</script>
