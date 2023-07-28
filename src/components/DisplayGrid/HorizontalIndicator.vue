<template>
  <div class="display-grid" :style="{ '--grid-columns': columns}">
    <div
      class="display-grid__cell"
      v-for="column in columns"
      :key="column"
      :style="getStyleForCell(1, column)"
      :class="getClassesForCell(column)"
      @click="emit('selectColumn', column)"
    >
    </div>
  </div>
</template>

<style scoped lang="scss" >
@import '@/assets/variables.scss';


.display-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  grid-template-rows: 0.5rem;
  gap: 0.25rem;
  padding: 0.25rem;

  background-color: $color-grey-600;
  overflow: hidden;
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
  padding: 4px;
  outline: none;

  cursor: pointer;
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

.active {
  border: none;
  padding: 4px;
  background-color: $color-orange-opaque;
  box-shadow: inset 0 0 2px 2px $color-orange-opaque-lighter100;
}

.corner {
  background-color: rgba(0,0,0,0);
  border: none;
  cursor: auto;
  outline: none;
}

.first-in-quarter {
  border-left: 4px solid $color-grey-500;
}
</style>

<script setup lang="ts">
import { computed} from 'vue'

const props = defineProps({
  selectedColumn: Number,
  columns: Number,
  offset: String,
})

const emit = defineEmits(['selectColumn'])

const getStyleForCell = (rowNumber: number, columnNumber: number) => {
  return {
    gridRow: rowNumber,
    gridColumn: columnNumber
  }
}

const getClassesForCell = (column: number) => {
  return {
    active: column === props.selectedColumn,
    'first-in-quarter': column % 4 === 1,
    'last-in-quarter': column % 4 === 0,
  }
}

const isCornerVisible = computed(() => {
  return props.offset?.length > 0;
})
</script>
