import {defineStore} from 'pinia'
import {ref} from "vue";

export const useSelectedTrack = defineStore('selectedTrack', () => {
	const selectedTrackIndex = ref(0)
	
	function setTrackNumber(newVal: number) {
		selectedTrackIndex.value = newVal
	}
	
	return {setTrackNumber, selectedTrackIndex}
})
