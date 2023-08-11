import * as Tone from "tone/Tone";

export const getToneTimeNextMeasure = (): number => {
	const position = Tone.Transport.position as Tone.Unit.Time
	
	const part = position.toString().split(':')[0]
	
	console.log('getToneTimeNextMeasure',
		Tone.Transport.position,
		Tone.Time(Tone.Time(`${1 + parseInt(part)}:0:0`).toSeconds()).toBarsBeatsSixteenths(),
	)
	
	return Tone.Time(`${1 + parseInt(part)}:0:0`).toSeconds()
}
