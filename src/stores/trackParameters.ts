import {defineStore} from 'pinia'
import {ref} from "vue";

export const useSelectedTrackNumber = defineStore('selectedTrack', () => {
	const selectedTrackIndex = ref(0)
	
	function setTrackIndex(newVal: number) {
		selectedTrackIndex.value = newVal
	}
	
	return {setTrackIndex, selectedTrackIndex}
})
