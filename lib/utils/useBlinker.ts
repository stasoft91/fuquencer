import {ref} from "vue";
import * as Tone from "tone/Tone";

export const useBlinker = () => {
	const blinkFlag = ref(true)
	let blinkInterval = 0
	
	const stopBlinking = () => {
		clearInterval(blinkInterval)
		blinkFlag.value = true
	}
	
	const startBlinking = () => {
		blinkInterval = setInterval(() => {
			blinkFlag.value = !blinkFlag.value
		}, Tone.Time('16n').toMilliseconds())
	}
	
	return {
		blinkFlag,
		stopBlinking,
		startBlinking,
	}
}
