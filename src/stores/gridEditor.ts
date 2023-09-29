import {defineStore} from 'pinia'
import type {Ref} from "vue"
import {ref} from "vue";
import type {GridCell} from "~/lib/GridCell";

export const useGridEditorStore = defineStore('gridEditorStore', () => {
	const selectedGridCell: Ref<GridCell | null> = ref(null)
	const isVisualizerActive: Ref<boolean> = ref(false)
	
	function setIsVisualizerActive(newVal: boolean) {
		isVisualizerActive.value = newVal
	}
	
	function setSelectedGridCell(newVal: GridCell | null) {
		selectedGridCell.value = newVal
	}
	
	return {
		setIsVisualizerActive,
		setSelectedGridCell,
		isVisualizerActive,
		selectedGridCell,
	}
})
