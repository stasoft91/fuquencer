<template>
  <div :style="{ '--grid-rows': GRID_ROWS, '--space': space }" class="vertical-indicator">
    <div
      class="vertical-indicator__cell"
      v-for="(row, rowIndex) in rows"
      :key="row"
      :style="getStyleForCell(row, 1)"
      :class="{ active: rowIndex === selectedRow }"
      @click="emit('selectRow', rowIndex)"
      @contextmenu="handleContextMenu(rowIndex, $event)"
    >
      {{ rowCaptions && rowCaptions[rowIndex] ? rowCaptions[rowIndex] : `Track ${row}` }}
      {{ polyrhythms && polyrhythms[rowIndex] ? `(+${polyrhythms[rowIndex]})` : '' }}
      <DisplayWaveform
          v-if="shouldDisplayWaveform(rowIndex)"
          :id="`vertical-indicator-${rowIndex}`"
          :url="tracks[rowIndex].meta.get('urls')[DEFAULT_NOTE] ?? ''"
          :wave-color="rowIndex === selectedRow ? '#edf2f7' : '#a0aec0'"
          :normalize="true"
      ></DisplayWaveform>
    </div>

    <div
        v-if="rows < GRID_ROWS"
        :style="getStyleForCell(rows+1, 1)"
        class="vertical-indicator__cell no-wrap"
        @click="$emit('addTrack')"
    >
      <NIcon :component="AddIcon"></NIcon>
      Track
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
  padding: 0 1rem 0 0.5rem;
  outline: none;

  border-radius: 3px;
}

.no-wrap {
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  background-color: $color-grey-700;
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
import {GRID_ROWS} from "@/constants";
import {AddOutline as AddIcon} from "@vicons/ionicons5";
import {NDropdown, NIcon} from "naive-ui";
import {useContextMenu} from "@/components/DisplayGrid/useContextMenu";

interface Props {
  tracks: Track[],

  selectedRow: number,
  rows: number,
  space?: string
  polyrhythms?: number[]
}

const props = defineProps<Props>()

const emit = defineEmits(['selectRow', 'addTrack', 'removeTrack'])

const {onClickoutside, y, x, isDropdownOpened, handleContextMenu, selectedItem} = useContextMenu()

const dropdownOptions = [
  {
    label: 'Remove',
    key: 'remove-track'
  },
]

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

const handleSelect = (key: string) => {
  isDropdownOpened.value = false

  if (key === 'remove-track') {
    emit('removeTrack', selectedItem.value)
  }
}
</script>
