import {defineStore} from 'pinia'
import type {Ref} from "vue"
import {reactive, ref} from "vue";
import {GridCell} from "~/lib/GridCell";
import {type ImproviseOptions, Sequencer} from "~/lib/Sequencer";
import {IMPROVISATOR_DEFAULTS} from "@/constants";
import {cloneDeep} from "lodash";

export const useGridEditorStore = defineStore('gridEditorStore', () => {
	const selectedGridCell: Ref<GridCell | null> = ref(null)
	const isVisualizerActive: Ref<boolean> = ref(false)
	const copiedGridCell: Ref<GridCell | null> = ref(null)
	
	const improviseOptions: ImproviseOptions = reactive(cloneDeep(IMPROVISATOR_DEFAULTS))
	
	function setCopiedGridCell(copiedCell: GridCell | null) {
		if (copiedCell === null) {
			copiedGridCell.value = null
			return
		}
		
		copiedGridCell.value = new GridCell(copiedCell)
	}
	
	function pasteCopiedGridCellTo(target: GridCell) {
		if (!copiedGridCell?.value) {
			return
		}
		
		target.duration = copiedGridCell.value.duration
		target.notes = copiedGridCell.value.notes
		target.modifiers = copiedGridCell.value.modifiers
		target.arpeggiator = copiedGridCell.value.arpeggiator ?? undefined
		target.mode = copiedGridCell.value.mode ?? undefined
		
		const seq = Sequencer.getInstance()
		seq.writeCell(target)
	}
	
	function setIsVisualizerActive(newVal: boolean) {
		isVisualizerActive.value = newVal
	}
	
	function setSelectedGridCell(newVal: GridCell | null) {
		selectedGridCell.value = newVal
	}
	
	return {
		setIsVisualizerActive,
		setSelectedGridCell,
		
		setCopiedGridCell,
		pasteCopiedGridCellTo,
		
		isVisualizerActive,
		selectedGridCell,
		
		improviseOptions
	}
})
