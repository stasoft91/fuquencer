import * as Tone from "tone/Tone";

export type AvailableEffectsInTone =
	Tone.AutoFilter |
	Tone.AutoPanner |
	Tone.AutoWah |
	Tone.BitCrusher |
	Tone.Chebyshev |
	Tone.Chorus |
	Tone.Distortion |
	Tone.FeedbackDelay |
	Tone.Freeverb |
	Tone.FrequencyShifter |
	Tone.JCReverb |
	Tone.Phaser |
	Tone.PingPongDelay |
	Tone.PitchShift |
	Tone.Reverb |
	Tone.StereoWidener |
	Tone.Tremolo |
	Tone.Vibrato;

export type AvailableEffectNames =
	'AutoFilter' |
	'AutoPanner' |
	'AutoWah' |
	'BitCrusher' |
	'Chebyshev' |
	'Chorus' |
	'Distortion' |
	'FeedbackDelay' |
	'Freeverb' |
	'FrequencyShifter' |
	'JCReverb' |
	'Phaser' |
	'PingPongDelay' |
	'PitchShift' |
	'Reverb' |
	'StereoWidener' |
	'Tremolo' |
	'Vibrato';

export type AutoFilter = {
	name: 'AutoFilter';
	options: Tone.AutoFilterOptions;
	effect?: Tone.AutoFilter;
}

export type AutoPanner = {
	name: 'AutoPanner';
	options: Tone.AutoPannerOptions;
	effect?: Tone.AutoPanner;
}

export type AutoWah = {
	name: 'AutoWah';
	options: Tone.AutoWahOptions;
	effect?: Tone.AutoWah;
}

export type BitCrusher = {
	name: 'BitCrusher';
	options: Tone.BitCrusherOptions;
	effect?: Tone.BitCrusher;
}

export type Chebyshev = {
	name: 'Chebyshev';
	options: Tone.ChebyshevOptions;
	effect?: Tone.Chebyshev;
}

export type Chorus = {
	name: 'Chorus';
	options: Tone.ChorusOptions;
	effect?: Tone.Chorus;
}

export type Distortion = {
	name: 'Distortion';
	options: Tone.DistortionOptions;
	effect?: Tone.Distortion;
}

export type FeedbackDelay = {
	name: 'FeedbackDelay';
	options: Tone.FeedbackDelayOptions;
	effect?: Tone.FeedbackDelay;
}

export type Freeverb = {
	name: 'Freeverb';
	options: Tone.FreeverbOptions;
	effect?: Tone.Freeverb;
}

export type FrequencyShifter = {
	name: 'FrequencyShifter';
	options: Tone.FrequencyShifterOptions;
	effect?: Tone.FrequencyShifter;
}

export type JCReverb = {
	name: 'JCReverb';
	options: Tone.JCReverbOptions;
	effect?: Tone.JCReverb;
	
}

export type Phaser = {
	name: 'Phaser';
	options: Tone.PhaserOptions;
	effect?: Tone.Phaser;
}

export type PingPongDelay = {
	name: 'PingPongDelay';
	options: Tone.PingPongDelayOptions;
	effect?: Tone.PingPongDelay;
}

export type PitchShift = {
	name: 'PitchShift';
	options: Tone.PitchShiftOptions;
	effect?: Tone.PitchShift;
}

export type Reverb = {
	name: 'Reverb';
	options: Tone.ReverbOptions;
	effect?: Tone.Reverb;
	
}

export type StereoWidener = {
	name: 'StereoWidener';
	options: Tone.StereoWidenerOptions;
	effect?: Tone.StereoWidener;
}

export type Tremolo = {
	name: 'Tremolo';
	options: Tone.TremoloOptions;
	effect?: Tone.Tremolo;
}

export type Vibrato = {
	name: 'Vibrato';
	options: Tone.VibratoOptions;
	effect?: Tone.Vibrato;
}

export type Compressor = {
	name: 'Compressor';
	options: Tone.CompressorOptions;
	effect?: Tone.Compressor;
}

export type AutoDuck = {
	name: 'AutoDuck';
	options?: {},
	effect?: Tone.Gain;
	kickFollower?: Tone.Follower
}


export type UniversalEffect = (AutoFilter | AutoPanner | AutoWah | BitCrusher | Chebyshev | Chorus | Distortion | FeedbackDelay | Freeverb | FrequencyShifter | JCReverb | Phaser | PingPongDelay | PitchShift | Reverb | StereoWidener | Tremolo | Vibrato | Compressor | AutoDuck)
	& {
		mountedId? :string,
		isHidden?: boolean,
	};
