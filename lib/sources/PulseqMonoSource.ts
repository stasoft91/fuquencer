import {AbstractSource} from "~/lib/sources/AbstractSource";
import type {ToneAudioNode} from "tone/Tone";
import * as Tone from 'tone/Tone';
import {PulseqSynth, synthParamApply} from "~/modules/pulseq";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {PULSEQ_SYNTH_PRESETS} from "~/modules/pulseq/presets.constants";
import {DEFAULT_PULSEQ_PARAMS} from "@/constants";
import {ref} from "vue";

export type PulseqOptions = {
	selectedPreset: string
}

export class PulseqMonoSource extends AbstractSource {
	AVAILABLE_SETTINGS: string[] = [
		GridCellModifierTypes.slide,
	]
	public selectedPreset = ref('[default]')
	protected declare _voice: PulseqSynth
	private options!: PulseqOptions
	private output!: Tone.Gain

	constructor(options: PulseqOptions) {
		super()
		this.options = options
		this.output = new Tone.Gain();
		this._voice = new PulseqSynth(this.output)
		
		this.setPreset(this.options.selectedPreset)
	}

	public async init(): Promise<void> {
		this._isInitialized = true;
	}

	chain(...args: ToneAudioNode[]): any {
		this.output.chain(...args)
	}

	disconnect(): void {
		// this.output.disconnect()
	}

	export(): PulseqOptions {
		return this.options;
	}

	get(): PulseqOptions {
		return this.options;
	}

	releaseAll(note?: any, time?: Tone.Unit.Time): void {
		this._voice.triggerRelease(
			Tone.Time(time).toSeconds()
		)
	}

	set(options: PulseqOptions): void {
		this.options = options

	}

	triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity?: number): void {
		this._voice.triggerAttack(
			this.convertNoteToDrum(Tone.Frequency(note).toMidi()),
			(velocity ?? 100),
			Tone.Time(time).toSeconds(),
			1000,
		)
	}

	triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity?: number): void {
		this._voice.triggerAttack(
			this.convertNoteToDrum(Tone.Frequency(note).toMidi()),
			(velocity ?? 100),
			Tone.Time(time).toSeconds(),
			Tone.Time(duration).toSeconds(),
		)

		this._voice.triggerRelease(
			Tone.Time(time).toSeconds() + Tone.Time(duration).toSeconds(),
		)
	}

	triggerRelease(note?: Tone.Unit.Frequency, time?: Tone.Unit.Time): void {
		this._voice.triggerRelease(
			Tone.Time(time).toSeconds(),
		)
	}

	public slideTo(note: Tone.Unit.Frequency, volumeMod: number, time: Tone.Unit.Time, duration: Tone.Unit.Time): void {
		this._voice.glideTo(note, volumeMod, time, duration);
	}

	public getPresets(): string[] {
		return PULSEQ_SYNTH_PRESETS.map(_ => _['-name'])
	}

	public setPreset(preset: string): void {
		const presetData = PULSEQ_SYNTH_PRESETS.find(_ => _['-name'].includes(preset))

		if (presetData) {
			[...Object.entries(DEFAULT_PULSEQ_PARAMS.synthState), ...Object.entries(presetData)].filter(_ => {
				return _[0] !== '-name'
			}).forEach((preset) => {
				synthParamApply(preset[0], preset[1], this._voice)
			})
			
			this.options.selectedPreset = preset
			this.selectedPreset.value = preset
		}
	}
}
