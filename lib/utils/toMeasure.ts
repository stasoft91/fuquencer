import * as Tone from 'tone/Tone';

export const toMeasure = (measure: Tone.Unit.Time | Tone.TimeClass<any>): string => {
	const measureInMs = Tone.Time(measure).toMilliseconds();
	
	const oneMeasureInMs = Tone.Time('1m').toMilliseconds();
	
	if (measureInMs >= oneMeasureInMs) {
		const timesMeasure = (measureInMs / oneMeasureInMs).toFixed(1);
		
		return `${timesMeasure}`;
	}
	
	const note = Tone.Time(measure).toNotation().replace('n', '').replace('t', ' trip').replace('.', ' dot');
	return `1 / ${note}`;
}
