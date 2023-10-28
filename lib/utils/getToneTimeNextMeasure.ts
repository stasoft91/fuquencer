import * as Tone from "tone/Tone";

/**
 * probably should be deprecated
 *
 * Consider:
 *
 *   const startTimeRaw: number = Tone.Time(Tone.Time('@1m').quantize('1m')).toSeconds();
 *
 *   const afterEnd: number = (Tone.Time('1m').toSeconds() * 1) + Tone.Time(startTimeRaw).toSeconds()
 *
 *   Tone.Transport.scheduleOnce((time) => {
 *     prop.linearRampTo(1, '1m', time)
 *   }, startTimeRaw)
 *
 *   Tone.Transport.scheduleOnce((time) => {
 *     prop.setValueAtTime(0, time)
 *     prop.setValueAtTime(0, time + 0.01)
 *   }, afterEnd)
 * @param addMeasures
 */
export const getToneTimeNextMeasure = (addMeasures: number = 1): Tone.Unit.Time => {
	const position = Tone.Transport.position as Tone.Unit.Time
	
	const loopEnd = Tone.Time(Tone.Transport.loopEnd).toSeconds()
	
	
	const part = position.toString().split(':')[0]
	
	const result = Tone.Time(`${addMeasures + parseInt(part)}:0:0`).toSeconds()
	
	// if timepoint is after the finish of global loop
	// we will set it to zero - which is a start of global loop
	if (loopEnd < result) {
		return 0
	}
	
	return result as Tone.Unit.Time
}
