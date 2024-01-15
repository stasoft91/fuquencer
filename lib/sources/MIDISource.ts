import {AbstractSource} from "~/lib/sources/AbstractSource";
import type {ToneAudioNode} from "tone/Tone";
import * as Tone from 'tone/Tone';
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {ref} from "vue";
import {range} from "~/lib/utils/range";

import {OutputChannel, WebMidi} from "webmidi";
import {Sequencer} from "~/lib/Sequencer";

export type MIDIOptions = {
	selectedPreset: string
}

export class MIDISource extends AbstractSource {
	AVAILABLE_SETTINGS: string[] = [
		GridCellModifierTypes.slide,
	]
	public selectedPreset = ref('[default]')
	protected declare _voice: OutputChannel
	private options!: MIDIOptions
	private output!: Tone.Gain
	
	
	constructor(options: MIDIOptions) {
		super()
		this.options = options
		this.output = new Tone.Gain();
		this._voice = WebMidi
		
		this.setPreset(this.options.selectedPreset)
	}
	
	public async init(): Promise<void> {
		WebMidi.enable({sysex: true}).then(() => {
			console.log('MIDI enabled', WebMidi.inputs, WebMidi.outputs)
		}).catch((e) => {
			console.log('MIDI not enabled', e)
		});
		
		this._isInitialized = true;
	}
	
	chain(...args: ToneAudioNode[]): any {
	}
	
	disconnect(): void {
	}
	
	export(): PulseqOptions {
		return this.options;
	}
	
	get(): PulseqOptions {
		return this.options;
	}
	
	releaseAll(note?: any, time?: Tone.Unit.Time): void {
		// this._voice.triggerRelease(
		// 	Tone.Time(time).toSeconds()
		// )
		Tone.Draw.schedule(() => {
			this._voice.sendAllNotesOff({})
		}, time);
		
	}
	
	set(options: PulseqOptions): void {
		this.options = options
	}
	
	triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity?: number): void {
		// this._voice.triggerAttack(
		// 	Tone.Frequency(note).toMidi(),
		// 	(velocity ?? 100),
		// 	Tone.Time(time).toSeconds(),
		// 	1000,
		// )
		
		Tone.Draw.schedule(() => {
			this._voice.playNote(Tone.Frequency(note).toMidi(), {
				rawAttack: velocity ?? 100,
			})
		}, time);
		
	}
	
	triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity?: number): void {
		// this._voice.triggerAttack(
		// 	Tone.Frequency(note).toMidi(),
		// 	(velocity ?? 100),
		// 	Tone.Time(time).toSeconds(),
		// 	Tone.Time(duration).toSeconds(),
		// )
		//
		// this._voice.triggerRelease(
		// 	Tone.Time(time).toSeconds() + Tone.Time(duration).toSeconds(),
		// )
		
		Tone.Draw.schedule(() => {
			this._voice.playNote(note, {
				duration: Tone.Time(duration).toMilliseconds(),
				rawAttack: velocity ?? 100,
			});
		}, time);
	}
	
	triggerRelease(note?: Tone.Unit.Frequency, time?: Tone.Unit.Time): void {
		// this._voice.triggerRelease(
		// 	Tone.Time(time).toSeconds(),
		// )
		
		this._voice.stopNote(Tone.Frequency(note).toMidi(), {
			time: Tone.Time(time).toSeconds(),
		})
	}
	
	public getPresets(): string[] {
		return range(1, 16).map(_ => `${_}`)
	}
	
	public setPreset(preset: string): void {
		const presetData = range(1, 16).includes(parseInt(preset))
		if (!presetData) {
			return
		}
		WebMidi.outputs.forEach((output) => {
			console.log(output.name)
		});
		const myOutput = WebMidi.getOutputByName("Circuit Tracks");
		this._voice = myOutput.channels[parseInt(preset)];
		
		const myInput = WebMidi.getInputByName("Circuit Tracks");
		
		myInput.removeListener('start');
		myInput.addListener('start', e => Sequencer.getInstance().play());
		
		if (presetData) {
			this.options.selectedPreset = preset
			this.selectedPreset.value = preset
		}
	}
}
