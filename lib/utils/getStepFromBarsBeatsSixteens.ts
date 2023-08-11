export default function getStepFromBarsBeatsSixteens(value: string): number {
	const current = value.split(':')
	return 4 * (parseInt(current[1])) + (1 + parseInt(current[2].split('.')[0]))
}
