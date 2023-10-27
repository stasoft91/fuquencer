/**
 * Returns a string in the format of bars:beats:sixteens from a step number (e.g. 1-16)
 * Bars here is always 0
 * @param step
 */
export const getBarsBeatsSixteensFromStep = (step: number) => {
	const bars = Math.floor(step / 16)
	const beats = Math.floor(step / 4) % 4
	const sixteens = step % 4
	
	return `${bars}:${beats}:${sixteens}`
}
