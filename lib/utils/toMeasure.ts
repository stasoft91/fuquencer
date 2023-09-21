import * as Tone from 'tone/Tone';

export const toMeasure = (measure: Tone.Unit.Time | Tone.TimeClass<any>): string => {
	if (Tone.Time(measure).toSeconds() === 0) {
		return '0';
	}
	
	const measureInMs = Tone.Time(measure).toMilliseconds();
	
	const oneMeasureInMs = Tone.Time('1m').toMilliseconds();
	
	if (measureInMs >= oneMeasureInMs) {
		const timesMeasure = (measureInMs / oneMeasureInMs).toFixed(1);
		
		return `${timesMeasure}`;
	}
	
	let divisor = 16;
	
	// divisor is 32 if measure is smaller than 1/16 or is equals to 1/16 dotted
	if (measureInMs < Tone.Time('16n').toMilliseconds() || measureInMs === Tone.Time('16n.').toMilliseconds()) {
		divisor = 32;
	}
	
	// divisor is 64 if measure is smaller than 1/32 or is equals to 1/32 dotted
	if (measureInMs < Tone.Time('32n').toMilliseconds() || measureInMs === Tone.Time('32n.').toMilliseconds()) {
		divisor = 64;
	}
	
	// divisor is 128 if measure is smaller than 1/64 or is equals to 1/64 dotted
	if (measureInMs < Tone.Time('64n').toMilliseconds() || measureInMs === Tone.Time('64n.').toMilliseconds()) {
		divisor = 128;
	}
	
	// divisor is 256 if measure is smaller than 1/128 or is equals to 1/128 dotted
	if (measureInMs < Tone.Time('128n').toMilliseconds() || measureInMs === Tone.Time('128n.').toMilliseconds()) {
		divisor = 256;
	}
	
	// divisor is 512 if measure is smaller than 1/256 or is equals to 1/256 dotted
	if (measureInMs < Tone.Time('256n').toMilliseconds() || measureInMs === Tone.Time('256n.').toMilliseconds()) {
		divisor = 512;
	}
	
	let dividend = Math.floor(Tone.Time(measure).toMilliseconds() / Tone.Time(divisor + 'n').toMilliseconds());
	
	if (divisor === 16) {
		if (dividend / divisor === 0.5) {
			dividend = dividend / 8;
			divisor = divisor / 8;
		}
		
		if (dividend / divisor === 0.25) {
			dividend = dividend / 4;
			divisor = divisor / 4;
		}
		
		if (dividend / divisor === 0.125) {
			dividend = dividend / 2;
			divisor = divisor / 2;
		}
	}
	
	return `${dividend}/${divisor}`;
}
