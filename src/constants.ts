import type {AvailableEffectNames, EffectParametersDescriptor, UniversalEffect} from "~/lib/Effects.types";
import * as Tone from "tone/Tone";
import type {PatternName} from "~/lib/PatternGenerator";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {DISTORTION_ALGORITHMS} from "~/lib/sound-components/DistortionModule/DistortionModule.utils";
import type {ImproviseOptions} from "~/lib/Sequencer";

export const VERSION = '0.9.8'

export const GRID_ROWS = 8;
export const GRID_COLS = 16;


export const AVAILABLE_EFFECTS: UniversalEffect[] = [
	{
		name: 'AutoFilter',
		options: {
			frequency: 200,
			depth: 1,
			baseFrequency: 200,
			octaves: 2.6,
			wet: 1
		}
	} as UniversalEffect,
	{
		name: 'AutoPanner',
		options: {
			frequency: '4n',
			depth: 1,
			type: 'sine',
			wet: 1
		}
	} as UniversalEffect,
	{
		name: 'AutoWah',
		options: {
			baseFrequency: 10,
			octaves: 5,
			sensitivity: 0,
			Q: 1,
			gain: 1,
			wet: 1
		}
	} as UniversalEffect,
	{
		name: 'BitCrusher',
		options: {
			bits: 4,
			wet: 1
		}
	} as UniversalEffect,
	{
		name: 'Chebyshev',
		options: {
			order: 50,
			oversample: 'none',
			wet: 1
		}
	} as UniversalEffect,
	{
		name: 'Chorus',
		options: {
			frequency: 1.5,
			delayTime: 3.5,
			depth: 0.7,
			type: 'sine',
			spread: 180,
			wet: 1
		}
	} as UniversalEffect,
	{
		name: 'Distortion',
		options: {
			distortion: 0.4,
			oversample: 'none',
			type: 'SATURATOR',
			wet: 1
		}
	} as UniversalEffect,
	{
		name: 'FeedbackDelay',
		options: {
			delayTime: '4n.',
			maxDelay: 1,
			feedback: 0.125,
			wet: 0.5
		}
	} as UniversalEffect,
	{
		name: 'Freeverb',
		options: {
			roomSize: 0.7,
			dampening: 3000,
			wet: 0.5
		}
	} as UniversalEffect,
	{
		name: 'FrequencyShifter',
		options: {
			frequency: 0,
			wet: 0.5
		}
	} as UniversalEffect,
	{
		name: 'JCReverb',
		options: {
			roomSize: 0.5,
			wet: 0.5
		}
	} as UniversalEffect,
	{
		name: 'Phaser',
		options: {
			frequency: 0.5,
			octaves: 3,
			stages: 10,
			Q: 10,
			baseFrequency: 350,
			wet: 0.5
		}
	} as UniversalEffect,
	{
		name: 'PingPongDelay',
		options: {
			wet: 0.25,
			delayTime: "8n.",
			feedback: 0.5
		}
	} as UniversalEffect,
	{
		name: 'Tremolo',
		options: {
			frequency: 10,
			type: 'sine',
			depth: 0.5,
			spread: 180,
			wet: 0.5
		}
	} as UniversalEffect,
	{
		name: 'Vibrato',
		options: {
			maxDelay: 0.005,
			frequency: 5,
			depth: 0.1,
			type: 'sine',
			wet: 0.5
		}
	} as UniversalEffect,
	{
		name: 'StereoWidener',
		options: {
			width: 0.5,
			wet: 1
		}
	} as UniversalEffect,
	{
		name: 'Reverb',
		options: {
			decay: 1.5,
			preDelay: 0.01,
			wet: 0.5
		}
	} as UniversalEffect,
	{
		name: 'PitchShift',
		options: {
			pitch: 7,
			windowSize: 0.1,
			delayTime: 0.1,
			feedback: 0.2,
			wet: 0.2
		}
	} as UniversalEffect,
	{
		name: 'Compressor',
		options: {
			threshold: -24,
			ratio: 12,
			attack: 0.003,
			release: 0.25,
			knee: 30,
		},
	} as UniversalEffect,
	// {
	// 	name: "AutoDuck",
	// 	options: {
	// 		attack: 0,
	// 		release: 0.2,
	// 		sustain: 0,
	// 		delay: 0,
	// 	},
	// } as UniversalEffect
]

export const AVAILABLE_OSCILLATOR_TYPES: Tone.ToneOscillatorType[] = ["sawtooth", "sine", "square", "triangle", "sawtooth21", "sine21", "square21", "triangle21",]
export const DELAY_OPTIONS: string[] = ['1m', '2n', '2n.', '4n', '4n.', '8n', '8n.', '16n', '16n.'];
export const DELAY_OPTIONS_ADDITIONAL: string[] = ['32n', '32n.', '64n', '128n', '256n', '256t'];
export const DELAY_OPTIONS_WITH_ZERO: string[] = ['0', ...DELAY_OPTIONS_ADDITIONAL];
export const DELAY_OPTIONS_LONG: string[] = [
	(1.5 * Tone.Time('1n').toSeconds()).toString(),
	(2 * Tone.Time('1n').toSeconds()).toString(),
	(2.5 * Tone.Time('1n').toSeconds()).toString(),
	(3 * Tone.Time('1n').toSeconds()).toString(),
	(3.5 * Tone.Time('1n').toSeconds()).toString(),
	(4 * Tone.Time('1n').toSeconds()).toString(),
].reverse()

export const GLOBAL_CELL_MODIFIERS: GridCellModifierTypes[] = [
	GridCellModifierTypes.probability,
	GridCellModifierTypes.skip,
	GridCellModifierTypes.swing,
	GridCellModifierTypes.flam,
	GridCellModifierTypes.octaveShift
]

export const OPTIONAL_CELL_MODIFIERS: GridCellModifierTypes[] = [
	GridCellModifierTypes.slide,
	GridCellModifierTypes.reverse,
	GridCellModifierTypes.playbackRate
]

export const AVAILABLE_ARPEGGIATOR_TYPES: PatternName[] = ["up", "down", "upDown", "downUp", "alternateUp", "alternateDown", "random", "randomOnce", "randomWalk"];

// below is two-dimensional array of options names per each effect
export const EFFECTS_OPTIONS: Record<AvailableEffectNames | string, EffectParametersDescriptor<any>[]> = {
	AutoFilter: [
		{name: 'frequency', enum: DELAY_OPTIONS},
		{name: 'depth'},
		{name: 'baseFrequency', min: 10, max: 20000},
		{name: 'octaves', min: 0, max: 10, step: 1},
		{name: 'wet'},
	] as EffectParametersDescriptor<'AutoFilter'>[],
	
	AutoPanner: [
		{name: 'frequency', enum: DELAY_OPTIONS},
		{name: 'depth'},
		{name: 'type', enum: AVAILABLE_OSCILLATOR_TYPES},
		{name: 'wet'}
	] as EffectParametersDescriptor<'AutoPanner'>[],
	
	AutoWah: [
		{name: 'baseFrequency', min: 0, max: 100},
		{name: 'octaves', min: 0, max: 8, step: 1},
		{name: 'sensitivity', min: -40, max: 0},
		{name: 'Q'},
		{name: 'gain'},
		{name: 'wet'}
	] as EffectParametersDescriptor<'AutoWah'>[],
	
	BitCrusher: [
		{name: 'bits', min: 1, max: 16, step: 1},
		{name: 'wet'}
	] as EffectParametersDescriptor<'BitCrusher'>[],
	
	Chebyshev: [
		{name: 'order', min: 1, max: 100, step: 1},
		{name: 'oversample', enum: ['none', '2x', '4x']},
		{name: 'wet'}
	] as EffectParametersDescriptor<'Chebyshev'>[],
	
	Chorus: [
		{name: 'frequency', min: 10, max: 20000},
		{name: 'delayTime'},
		{name: 'depth'},
		{name: 'type', enum: AVAILABLE_OSCILLATOR_TYPES},
		{name: 'spread', min: 0, max: 360},
		{name: 'wet'}
	] as EffectParametersDescriptor<'Chorus'>[],
	
	Distortion: [
		{name: 'distortion'},
		{name: 'oversample', enum: ['none', '2x', '4x']},
		{name: 'type', enum: Object.keys(DISTORTION_ALGORITHMS)},
		{name: 'wet'}
	] as EffectParametersDescriptor<'Distortion'>[],
	
	FeedbackDelay: [
		{name: 'delayTime', enum: DELAY_OPTIONS},
		{name: 'maxDelay', enum: DELAY_OPTIONS},
		{name: 'feedback'},
		{name: 'wet'}
	] as EffectParametersDescriptor<'FeedbackDelay'>[],
	
	Freeverb: [
		{name: 'roomSize'},
		{name: 'dampening', min: 10, max: 20000},
		{name: 'wet'}
	] as EffectParametersDescriptor<'Freeverb'>[],
	
	FrequencyShifter: [
		{name: 'frequency', min: 10, max: 20000},
		{name: 'wet'}
	] as EffectParametersDescriptor<'FrequencyShifter'>[],
	
	JCReverb: [
		{name: 'roomSize'},
		{name: 'wet'}
	] as EffectParametersDescriptor<'JCReverb'>[],
	
	Phaser: [
		{name: 'frequency', enum: [...DELAY_OPTIONS_LONG, ...DELAY_OPTIONS]},
		{name: 'octaves', min: 0, max: 10, step: 1},
		{name: 'stages', min: 1, max: 12, step: 1},
		{name: 'Q'},
		{name: 'baseFrequency', min: 10, max: 20000},
		{name: 'wet'}
	] as EffectParametersDescriptor<'Phaser'>[],
	
	PingPongDelay: [
		{name: 'wet'},
		{name: 'delayTime', enum: DELAY_OPTIONS},
		{name: 'feedback'}
	] as EffectParametersDescriptor<'PingPongDelay'>[],
	
	Tremolo: [
		{name: 'frequency', enum: DELAY_OPTIONS},
		{name: 'type', enum: AVAILABLE_OSCILLATOR_TYPES},
		{name: 'depth'},
		{name: 'spread', min: 0, max: 360},
		{name: 'wet'}
	] as EffectParametersDescriptor<'Tremolo'>[],
	
	Vibrato: [
		{name: 'maxDelay'},
		{name: 'frequency', enum: DELAY_OPTIONS},
		{name: 'depth'},
		{name: 'type', enum: AVAILABLE_OSCILLATOR_TYPES},
		{name: 'wet'}
	] as EffectParametersDescriptor<'Vibrato'>[],
	
	StereoWidener: [
		{name: 'width'},
		{name: 'wet'}
	] as EffectParametersDescriptor<'StereoWidener'>[],
	
	Reverb: [
		{name: 'decay'},
		{name: 'preDelay'},
		{name: 'wet'}
	] as EffectParametersDescriptor<'Reverb'>[],
	
	PitchShift: [
		{name: 'pitch', min: -12, max: 12, step: 1},
		{name: 'windowSize', enum: DELAY_OPTIONS},
		{name: 'delayTime', enum: DELAY_OPTIONS},
		{name: 'feedback'},
		{name: 'wet'}
	] as EffectParametersDescriptor<'PitchShift'>[],
	
	Compressor: [
		{name: 'threshold', min: -100, max: 0.01,},
		{name: 'ratio', min: 1, max: 20, step: 1},
		{name: 'attack'},
		{name: 'release'},
		{name: 'knee', min: 0, max: 40},
	] as EffectParametersDescriptor<'Compressor'>[],
	
	AutoDuck: [
		{name: 'attack'},
		{name: 'decay'},
		{name: 'sustain'},
		{name: 'release'},
	] as EffectParametersDescriptor<'AutoDuck'>[],
}


export const DEFAULT_PULSEQ_PARAMS: {
    synthState: Record<string, any>
} = {
    synthState: {
        "synth-amplifier-gain": 1,
        "synth-amplifier-mod-input": "[none]",
        "synth-amplifier-mod-value": 0,
        "synth-envelope-attack": 0.2,
        "synth-envelope-decay": 0.2,
        "synth-envelope-release": 2,
        "synth-envelope-sustain": 1,
        "synth-envelope-type": "exponential",
        "synth-filter-frequency": 1,
        "synth-filter-mod-input": "[none]",
        "synth-filter-mod-value": 0,
        "synth-filter-quality": 0,
        "synth-filter-type": "[none]",
        "synth-fx-amount": 0.5,
        "synth-fx-rate": 0.5,
        "synth-fx-sync": false,
        "synth-fx-type": "[none]",
        "synth-fx-wet": 0.5,
        "synth-glide": 1,
        "synth-lfo1-frequency": 0,
        "synth-lfo1-sync": false,
        "synth-lfo1-type": "[none]",
        "synth-lfo2-frequency": 0,
        "synth-lfo2-type": "[none]",
        "synth-mod-envelope-attack": 6,
        "synth-mod-envelope-decay": 6,
        "synth-mod-envelope-release": 6,
        "synth-mod-envelope-sustain": 0,
        "synth-mod-envelope-type": "[none]",
        "synth-noise-level": 0,
        "synth-noise-type": "[none]",
        "synth-osc1-detune": 0,
        "synth-osc1-level": 1,
        "synth-osc1-mod-input": "[none]",
        "synth-osc1-mod-value": 0,
        "synth-osc1-octave": 0,
        "synth-osc1-type": "triangle",
        "synth-osc2-detune": 0,
        "synth-osc2-level": 0,
        "synth-osc2-mod-input": "[none]",
        "synth-osc2-mod-value": 0,
        "synth-osc2-octave": 0,
        "synth-osc2-type": "[none]",
        "synth-osc3-detune": 0,
        "synth-osc3-level": 0,
        "synth-osc3-octave": 0,
        "synth-osc3-type": "[none]",
        "synth-pan": 0,
    }
};

export const IMPROVISATOR_DEFAULTS: ImproviseOptions = {
    notesInKey: ['C2', 'B2', 'E2', 'F2', 'B1'],
    probabilityModProbability: 0.25,
    skipModProbability: 0.35,
    flamModeProbability: 0.15,
    slideModProbability: 0.25,
    columnMutationMod: 3,
    columnMutationProbability: 0.25,
    columnMuteProbability: 0.35,
	octaveShiftProbability: 0.25,
}
