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
 * @param add
 */
export const getToneTimeNextMeasure = (add: number = 1): Tone.Unit.Time => {
	const position = Tone.Transport.position as Tone.Unit.Time
	
	const part = position.toString().split(':')[0]
	
	// console.log('getToneTimeNextMeasure',
	// 	Tone.Transport.position,
	// 	Tone.Time(Tone.Time(`${1 + parseInt(part)}:0:0`).toSeconds()).toBarsBeatsSixteenths(),
	// )
	
	return Tone.Time(`${add + parseInt(part)}:0:0`) as Tone.Unit.Time
}
