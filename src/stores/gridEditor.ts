import {defineStore} from 'pinia'
import type {Ref} from "vue"
import {ref} from "vue";

export enum GridEditorToolsEnum {
	DRAW = 'DRAW',
	DETAILS = 'DETAILS',
}

export const useGridEditor = defineStore('gridEditor', () => {
	const selectedGridEditorTool: Ref<GridEditorToolsEnum> = ref(GridEditorToolsEnum.DRAW)
	
	function setGridEditorTool(newVal: GridEditorToolsEnum) {
		selectedGridEditorTool.value = newVal
	}
	
	return {setGridEditorTool, selectedGridEditorTool}
})
