import {defineStore} from 'pinia'

export type ParameterRecord = {
	id: string
	value: string | number
}
export const useTrackParametersStore = defineStore('trackParameters', (): { parameterCache: ParameterRecord[] } => {
	return {
		parameterCache: [],
	}
})
