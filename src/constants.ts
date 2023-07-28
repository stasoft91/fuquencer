import type {
	AutoDuck,
	AutoFilter,
	AutoPanner,
	AutoWah,
	BitCrusher,
	Chebyshev,
	Chorus, Compressor,
	Distortion,
	FeedbackDelay,
	Freeverb,
	FrequencyShifter,
	JCReverb,
	Phaser,
	PingPongDelay, PitchShift,
	Reverb,
	StereoWidener,
	Tremolo,
	UniversalEffect,
	Vibrato
} from "~/lib/Effects.types";

export const GRID_ROWS = 8;

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
	} as AutoFilter,
	{
		name: 'AutoPanner',
		options: {
			frequency: 1,
			depth: 1,
			type: 'sine',
			wet: 1
		}
	} as AutoPanner,
	{
		name: 'AutoWah',
		options: {
			baseFrequency: 100,
			octaves: 6,
			sensitivity: 0,
			Q: 2,
			gain: 2,
			wet: 1
		}
	} as AutoWah,
	{
		name: 'BitCrusher',
		options: {
			bits: 4,
			wet: 1
		}
	} as BitCrusher,
	{
		name: 'Chebyshev',
		options: {
			order: 50,
			oversample: 'none',
			wet: 1
		}
	} as Chebyshev,
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
	} as Chorus,
	{
		name: 'Distortion',
		options: {
			distortion: 0.4,
			oversample: 'none'
		}
	} as Distortion,
	{
		name: 'FeedbackDelay',
		options: {
			delayTime: 0.25,
			maxDelay: 1,
			feedback: 0.125,
			wet: 0.5
		}
	} as FeedbackDelay,
	{
		name: 'Freeverb',
		options: {
			roomSize: 0.7,
			dampening: 3000,
			wet: 0.5
		}
	} as Freeverb,
	{
		name: 'FrequencyShifter',
		options: {
			frequency: 0,
			wet: 0.5
		}
	} as FrequencyShifter,
	{
		name: 'JCReverb',
		options: {
			roomSize: 0.5,
			wet: 0.5
		}
	} as JCReverb,
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
	} as Phaser,
	{
		name: 'PingPongDelay',
		options: {
			wet: 0.25,
			delayTime: "8n.",
			feedback: 0.5
		}
	} as PingPongDelay,
	{
		name: 'Tremolo',
		options: {
			frequency: 10,
			type: 'sine',
			depth: 0.5,
			spread: 180,
			wet: 0.5
		}
	} as Tremolo,
	{
		name: 'Vibrato',
		options: {
			maxDelay: 0.005,
			frequency: 5,
			depth: 0.1,
			type: 'sine',
			wet: 0.5
		}
	} as Vibrato,
	{
		name: 'StereoWidener',
		options: {
			width: 0.5,
			wet: 1
		}
	} as StereoWidener,
	{
		name: 'Reverb',
		options: {
			decay: 1.5,
			preDelay: 0.01,
			wet: 0.5
		}
	} as Reverb,
	{
		name: 'PitchShift',
		options: {
			pitch: 0,
			windowSize: 0.1,
			delayTime: 0,
			feedback: 0,
			wet: 0.5
		}
	} as PitchShift,
	{
		name: 'Compressor',
		options: {
			threshold: -24,
			ratio: 12,
			attack: 0.003,
			release: 0.25,
			knee: 30,
		},
	} as Compressor,
	{
		name: "AutoDuck",
		options: {},
		isHidden: true
	} as UniversalEffect
]
