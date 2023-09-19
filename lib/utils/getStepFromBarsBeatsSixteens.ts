/**
 * Converts a string of the format "bars:beats:sixteens" to a step number
 * @param value
 */
export default function getStepFromBarsBeatsSixteens(value: string): number {
	const current = value.split(':')
	return 16 * (parseInt(current[0])) + 4 * (parseInt(current[1])) + (1 + parseInt(current[2].split('.')[0]))
}
