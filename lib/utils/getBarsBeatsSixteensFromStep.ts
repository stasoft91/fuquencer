/**
 * Returns a string in the format of bars:beats:sixteens from a step number (e.g. 1-16)
 * Bars here is always 0
 * @param step
 */
export const getBarsBeatsSixteensFromStep = (step: number) => `0:${Math.floor(step / 4)}:${step % 4}`
