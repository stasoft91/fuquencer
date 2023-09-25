import {defineStore} from 'pinia'
import type {Ref} from "vue"
import {ref} from "vue";
import type {GridCell} from "~/lib/GridCell";

export enum GridEditorToolsEnum {
	DRAW = 'DRAW',
	DETAILS = 'DETAILS',
}

export const useGridEditorStore = defineStore('gridEditorStore', () => {
	const selectedGridEditorTool: Ref<GridEditorToolsEnum> = ref(GridEditorToolsEnum.DRAW)
	const selectedGridCell: Ref<GridCell | null> = ref(null)
	
	function setGridEditorTool(newVal: GridEditorToolsEnum) {
		selectedGridEditorTool.value = newVal
	}
	
	function setSelectedGridCell(newVal: GridCell | null) {
		selectedGridCell.value = newVal
	}
	
	return {
		setGridEditorTool,
		selectedGridEditorTool,
		setSelectedGridCell,
		selectedGridCell,
	}
})
