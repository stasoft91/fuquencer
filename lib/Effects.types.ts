import * as Tone from "tone/Tone";
import DistortionModule, {type DistortionModuleOptions} from "~/lib/sound-components/DistortionModule/DistortionModule"

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
	'Vibrato' |
	'Compressor' |
	'AutoDuck';

export type AutoFilter = {
	name: 'AutoFilter';
	options: Tone.AutoFilterOptions & { [key: string]: any };
	effect?: Tone.AutoFilter;
}

export type AutoPanner = {
	name: 'AutoPanner';
	options: Tone.AutoPannerOptions & { [key: string]: any };
	effect?: Tone.AutoPanner;
}

export type AutoWah = {
	name: 'AutoWah';
	options: Tone.AutoWahOptions & { [key: string]: any };
	effect?: Tone.AutoWah;
}

export type BitCrusher = {
	name: 'BitCrusher';
	options: Tone.BitCrusherOptions & { [key: string]: any };
	effect?: Tone.BitCrusher;
}

export type Chebyshev = {
	name: 'Chebyshev';
	options: Tone.ChebyshevOptions & { [key: string]: any };
	effect?: Tone.Chebyshev;
}

export type Chorus = {
	name: 'Chorus';
	options: Tone.ChorusOptions & { [key: string]: any };
	effect?: Tone.Chorus;
}

export type Distortion = {
	name: 'Distortion';
	options: DistortionModuleOptions & { [key: string]: any };
	effect?: DistortionModule;
}

export type FeedbackDelay = {
	name: 'FeedbackDelay';
	options: Tone.FeedbackDelayOptions & { [key: string]: any };
	effect?: Tone.FeedbackDelay;
}

export type Freeverb = {
	name: 'Freeverb';
	options: Tone.FreeverbOptions & { [key: string]: any };
	effect?: Tone.Freeverb;
}

export type FrequencyShifter = {
	name: 'FrequencyShifter';
	options: Tone.FrequencyShifterOptions & { [key: string]: any };
	effect?: Tone.FrequencyShifter;
}

export type JCReverb = {
	name: 'JCReverb';
	options: Tone.JCReverbOptions & { [key: string]: any };
	effect?: Tone.JCReverb;
	
}

export type Phaser = {
	name: 'Phaser';
	options: Tone.PhaserOptions & { [key: string]: any };
	effect?: Tone.Phaser;
}

export type PingPongDelay = {
	name: 'PingPongDelay';
	options: Tone.PingPongDelayOptions & { [key: string]: any };
	effect?: Tone.PingPongDelay;
}

export type PitchShift = {
	name: 'PitchShift';
	options: Tone.PitchShiftOptions & { [key: string]: any };
	effect?: Tone.PitchShift;
}

export type Reverb = {
	name: 'Reverb';
	options: Tone.ReverbOptions & { [key: string]: any };
	effect?: Tone.Reverb;
	
}

export type StereoWidener = {
	name: 'StereoWidener';
	options: Tone.StereoWidenerOptions & { [key: string]: any };
	effect?: Tone.StereoWidener;
}

export type Tremolo = {
	name: 'Tremolo';
	options: Tone.TremoloOptions & { [key: string]: any };
	effect?: Tone.Tremolo;
}

export type Vibrato = {
	name: 'Vibrato';
	options: Tone.VibratoOptions & { [key: string]: any };
	effect?: Tone.Vibrato;
}

export type Compressor = {
	name: 'Compressor';
	options: Tone.CompressorOptions & { [key: string]: any };
	effect?: Tone.Compressor;
}

export type AutoDuck = {
	name: 'AutoDuck';
	options?: { [key: string]: any };
	effect?: any;
}


export type UniversalEffect = (AutoFilter | AutoPanner | AutoWah | BitCrusher | Chebyshev | Chorus | Distortion | FeedbackDelay | Freeverb | FrequencyShifter | JCReverb | Phaser | PingPongDelay | PitchShift | Reverb | StereoWidener | Tremolo | Vibrato | Compressor | AutoDuck)
	& {
	[other: string]: any
	};


export type GetOptionsType<T extends AvailableEffectNames> =
	T extends 'AutoFilter' ? Tone.AutoFilterOptions :
		T extends 'AutoPanner' ? Tone.AutoPannerOptions :
			T extends 'AutoWah' ? Tone.AutoWahOptions :
				T extends 'BitCrusher' ? Tone.BitCrusherOptions :
					T extends 'Chebyshev' ? Tone.ChebyshevOptions :
						T extends 'Chorus' ? Tone.ChorusOptions :
							T extends 'Distortion' ? DistortionModuleOptions :
								T extends 'FeedbackDelay' ? Tone.FeedbackDelayOptions :
									T extends 'Freeverb' ? Tone.FreeverbOptions :
										T extends 'FrequencyShifter' ? Tone.FrequencyShifterOptions :
											T extends 'JCReverb' ? Tone.JCReverbOptions :
												T extends 'Phaser' ? Tone.PhaserOptions :
													T extends 'PingPongDelay' ? Tone.PingPongDelayOptions :
														T extends 'PitchShift' ? Tone.PitchShiftOptions :
															T extends 'Reverb' ? Tone.ReverbOptions :
																T extends 'StereoWidener' ? Tone.StereoWidenerOptions :
																	T extends 'Tremolo' ? Tone.TremoloOptions :
																		T extends 'Vibrato' ? Tone.VibratoOptions :
																			T extends 'Compressor' ? Tone.CompressorOptions :
																				T extends 'AutoDuck' ? Tone.EnvelopeOptions : never;


export type EffectParametersDescriptor<T extends AvailableEffectNames> = {
	name: keyof GetOptionsType<T>;
	min?: number;
	max?: number;
	step?: number;
	enum?: string[];
	rawValueToControl?: (value: number) => number,
	controlToRawValue?: (value: number) => number,
}
