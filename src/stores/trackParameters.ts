import {defineStore} from 'pinia'
import type {Ref} from "vue";
import {ref} from "vue";

export const useSelectedTrackNumber = defineStore('selectedTrack', () => {
	const selectedTrackIndex: Ref<number> = ref(0)
	
	function setTrackIndex(newVal: number) {
		selectedTrackIndex.value = newVal
	}
	
	return {setTrackIndex, selectedTrackIndex}
})
