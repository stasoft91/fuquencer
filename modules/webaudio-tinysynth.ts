"use strict";
import * as Tone from "tone/Tone";

type ProgramRecords = Array<Program>;

type Program = ({
	w: string; v?: number; d?: number; s?: number; g?: number; a: number;
	k?: number; f?: number; t?: number; h: number; r?: number; b?: number;
	c?: number; p: number; q: number; e?: number; o?: number;
})[];

type WebTinySynthConfig = {
	masterVol: { type: NumberConstructor; value: number; observer: string; };
	reverbLev: { type: NumberConstructor; value: number; observer: string; };
	quality: { type: NumberConstructor; value: number; observer: string; };
	debug: { type: NumberConstructor; value: number; };
	src: { type: StringConstructor; value: any; observer: string; };
	loop: { type: NumberConstructor; value: number; };
	internalcontext: { type: NumberConstructor; value: number; };
	tsmode: { type: NumberConstructor; value: number; };
	voices: { type: NumberConstructor; value: number; };
	useReverb: { type: NumberConstructor; value: number; };
}

type Note = {
	t2: number;
	ch: number;
	n: number;
	v: number
	p: number;
	t: number;
	nt: number;
	d: number;
	s: number;
	r: number;
	pan: number;
	e: number;
	f: number;
	o: Tone.Oscillator[]
	g: Tone.Gain[];
	h: any;
	q: any;
}

type Song = any

export class WebAudioTinySynth {
	// public sy: any;
	
	public is: string = "webaudio-tinysynth";
	public properties: WebTinySynthConfig = {
		masterVol: {type: Number, value: 0.5, observer: "setMasterVol"},
		reverbLev: {type: Number, value: 0.3, observer: "setReverbLev"},
		quality: {type: Number, value: 1, observer: "setQuality"},
		debug: {type: Number, value: 0},
		src: {type: String, value: null, observer: "loadMIDIUrl"},
		loop: {type: Number, value: 0},
		internalcontext: {type: Number, value: 1},
		tsmode: {type: Number, value: 0},
		voices: {type: Number, value: 64},
		useReverb: {type: Number, value: 1},
	};
	
	public program: { name: string; p?: any; }[] = [
// 1-8 : Piano
		{name: "Acoustic Grand Piano"}, {name: "Bright Acoustic Piano"},
		{name: "Electric Grand Piano"}, {name: "Honky-tonk Piano"},
		{name: "Electric Piano 1"}, {name: "Electric Piano 2"},
		{name: "Harpsichord"}, {name: "Clavi"},
		/* 9-16 : Chromatic Perc*/
		{name: "Celesta"}, {name: "Glockenspiel"},
		{name: "Music Box"}, {name: "Vibraphone"},
		{name: "Marimba"}, {name: "Xylophone"},
		{name: "Tubular Bells"}, {name: "Dulcimer"},
		/* 17-24 : Organ */
		{name: "Drawbar Organ"}, {name: "Percussive Organ"},
		{name: "Rock Organ"}, {name: "Church Organ"},
		{name: "Reed Organ"}, {name: "Accordion"},
		{name: "Harmonica"}, {name: "Tango Accordion"},
		/* 25-32 : Guitar */
		{name: "Acoustic Guitar (nylon)"}, {name: "Acoustic Guitar (steel)"},
		{name: "Electric Guitar (jazz)"}, {name: "Electric Guitar (clean)"},
		{name: "Electric Guitar (muted)"}, {name: "Overdriven Guitar"},
		{name: "Distortion Guitar"}, {name: "Guitar harmonics"},
		/* 33-40 : Bass */
		{name: "Acoustic Bass"}, {name: "Electric Bass (finger)"},
		{name: "Electric Bass (pick)"}, {name: "Fretless Bass"},
		{name: "Slap Bass 1"}, {name: "Slap Bass 2"},
		{name: "Synth Bass 1"}, {name: "Synth Bass 2"},
		/* 41-48 : Strings */
		{name: "Violin"}, {name: "Viola"},
		{name: "Cello"}, {name: "Contrabass"},
		{name: "Tremolo Strings"}, {name: "Pizzicato Strings"},
		{name: "Orchestral Harp"}, {name: "Timpani"},
		/* 49-56 : Ensamble */
		{name: "String Ensemble 1"}, {name: "String Ensemble 2"},
		{name: "SynthStrings 1"}, {name: "SynthStrings 2"},
		{name: "Choir Aahs"}, {name: "Voice Oohs"},
		{name: "Synth Voice"}, {name: "Orchestra Hit"},
		/* 57-64 : Brass */
		{name: "Trumpet"}, {name: "Trombone"},
		{name: "Tuba"}, {name: "Muted Trumpet"},
		{name: "French Horn"}, {name: "Brass Section"},
		{name: "SynthBrass 1"}, {name: "SynthBrass 2"},
		/* 65-72 : Reed */
		{name: "Soprano Sax"}, {name: "Alto Sax"},
		{name: "Tenor Sax"}, {name: "Baritone Sax"},
		{name: "Oboe"}, {name: "English Horn"},
		{name: "Bassoon"}, {name: "Clarinet"},
		/* 73-80 : Pipe */
		{name: "Piccolo"}, {name: "Flute"},
		{name: "Recorder"}, {name: "Pan Flute"},
		{name: "Blown Bottle"}, {name: "Shakuhachi"},
		{name: "Whistle"}, {name: "Ocarina"},
		/* 81-88 : SynthLead */
		{name: "Lead 1 (square)"}, {name: "Lead 2 (sawtooth)"},
		{name: "Lead 3 (calliope)"}, {name: "Lead 4 (chiff)"},
		{name: "Lead 5 (charang)"}, {name: "Lead 6 (voice)"},
		{name: "Lead 7 (fifths)"}, {name: "Lead 8 (bass + lead)"},
		/* 89-96 : SynthPad */
		{name: "Pad 1 (new age)"}, {name: "Pad 2 (warm)"},
		{name: "Pad 3 (polysynth)"}, {name: "Pad 4 (choir)"},
		{name: "Pad 5 (bowed)"}, {name: "Pad 6 (metallic)"},
		{name: "Pad 7 (halo)"}, {name: "Pad 8 (sweep)"},
		/* 97-104 : FX */
		{name: "FX 1 (rain)"}, {name: "FX 2 (soundtrack)"},
		{name: "FX 3 (crystal)"}, {name: "FX 4 (atmosphere)"},
		{name: "FX 5 (brightness)"}, {name: "FX 6 (goblins)"},
		{name: "FX 7 (echoes)"}, {name: "FX 8 (sci-fi)"},
		/* 105-112 : Ethnic */
		{name: "Sitar"}, {name: "Banjo"},
		{name: "Shamisen"}, {name: "Koto"},
		{name: "Kalimba"}, {name: "Bag pipe"},
		{name: "Fiddle"}, {name: "Shanai"},
		/* 113-120 : Percussive */
		{name: "Tinkle Bell"}, {name: "Agogo"},
		{name: "Steel Drums"}, {name: "Woodblock"},
		{name: "Taiko Drum"}, {name: "Melodic Tom"},
		{name: "Synth Drum"}, {name: "Reverse Cymbal"},
		/* 121-128 : SE */
		{name: "Guitar Fret Noise"}, {name: "Breath Noise"},
		{name: "Seashore"}, {name: "Bird Tweet"},
		{name: "Telephone Ring"}, {name: "Helicopter"},
		{name: "Applause"}, {name: "Gunshot"},
	];
	public out!: Tone.Gain | null;
	public rev!: Tone.Gain | null;
	public conv!: Tone.Convolver | null;
	public chmod!: (Tone.Gain | null)[];
	public chvol!: (Tone.Gain | null)[];
	public comp!: Tone.Compressor | null;
	public convBuf!: Tone.ToneAudioBuffer;
	public noiseBuf!: { n1: Tone.ToneAudioBuffer, n0: Tone.ToneAudioBuffer };
	public lfo!: Tone.LFO | null;
	public chpan!: (Tone.Panner | null)[];
	public dest!: Tone.ToneAudioNode | null;
	public wave!: PeriodicWave
	private drummap: { name: string; p?: any; }[] = [
// 35
		{name: "Acoustic Bass Drum"}, {name: "Bass Drum 1"}, {name: "Side Stick"}, {name: "Acoustic Snare"},
		{name: "Hand Clap"}, {name: "Electric Snare"}, {name: "Low Floor Tom"}, {name: "Closed Hi Hat"},
		{name: "High Floor Tom"}, {name: "Pedal Hi-Hat"}, {name: "Low Tom"}, {name: "Open Hi-Hat"},
		{name: "Low-Mid Tom"}, {name: "Hi-Mid Tom"}, {name: "Crash Cymbal 1"}, {name: "High Tom"},
		{name: "Ride Cymbal 1"}, {name: "Chinese Cymbal"}, {name: "Ride Bell"}, {name: "Tambourine"},
		{name: "Splash Cymbal"}, {name: "Cowbell"}, {name: "Crash Cymbal 2"}, {name: "Vibraslap"},
		{name: "Ride Cymbal 2"}, {name: "Hi Bongo"}, {name: "Low Bongo"}, {name: "Mute Hi Conga"},
		{name: "Open Hi Conga"}, {name: "Low Conga"}, {name: "High Timbale"}, {name: "Low Timbale"},
		{name: "High Agogo"}, {name: "Low Agogo"}, {name: "Cabasa"}, {name: "Maracas"},
		{name: "Short Whistle"}, {name: "Long Whistle"}, {name: "Short Guiro"}, {name: "Long Guiro"},
		{name: "Claves"}, {name: "Hi Wood Block"}, {name: "Low Wood Block"}, {name: "Mute Cuica"},
		{name: "Open Cuica"}, {name: "Mute Triangle"}, {name: "Open Triangle"},
	];
	private program1: ProgramRecords = [
		// 1-8 : Piano
		[{w: "sine", v: .4, d: 0.7, r: 0.1,}, {w: "triangle", v: 3, d: 0.7, s: 0.1, g: 1, a: 0.01, k: -1.2}],
		[{w: "triangle", v: 0.4, d: 0.7, r: 0.1,}, {w: "triangle", v: 4, t: 3, d: 0.4, s: 0.1, g: 1, k: -1, a: 0.01,}],
		[{w: "sine", d: 0.7, r: 0.1,}, {w: "triangle", v: 4, f: 2, d: 0.5, s: 0.5, g: 1, k: -1}],
		[{w: "sine", d: 0.7, v: 0.2,}, {w: "triangle", v: 4, t: 3, f: 2, d: 0.3, g: 1, k: -1, a: 0.01, s: 0.5,}],
		[{w: "sine", v: 0.35, d: 0.7,}, {w: "sine", v: 3, t: 7, f: 1, d: 1, s: 1, g: 1, k: -.7}],
		[{w: "sine", v: 0.35, d: 0.7,}, {w: "sine", v: 8, t: 7, f: 1, d: 0.5, s: 1, g: 1, k: -.7}],
		[{w: "sawtooth", v: 0.34, d: 2,}, {w: "sine", v: 8, f: 0.1, d: 2, s: 1, r: 2, g: 1,}],
		[{w: "triangle", v: 0.34, d: 1.5,}, {w: "square", v: 6, f: 0.1, d: 1.5, s: 0.5, r: 2, g: 1,}],
		/* 9-16 : Chromatic Perc*/
		[{w: "sine", d: 0.3, r: 0.3,}, {w: "sine", v: 7, t: 11, d: 0.03, g: 1,}],
		[{w: "sine", d: 0.3, r: 0.3,}, {w: "sine", v: 11, t: 6, d: 0.2, s: 0.4, g: 1,}],
		[{w: "sine", v: 0.2, d: 0.3, r: 0.3,}, {w: "sine", v: 11, t: 5, d: 0.1, s: 0.4, g: 1,}],
		[{w: "sine", v: 0.2, d: 0.6, r: 0.6,}, {w: "triangle", v: 11, t: 5, f: 1, s: 0.5, g: 1,}],
		[{w: "sine", v: 0.3, d: 0.2, r: 0.2,}, {w: "sine", v: 6, t: 5, d: 0.02, g: 1,}],
		[{w: "sine", v: 0.3, d: 0.2, r: 0.2,}, {w: "sine", v: 7, t: 11, d: 0.03, g: 1,}],
		[{w: "sine", v: 0.2, d: 1, r: 1,}, {w: "sine", v: 11, t: 3.5, d: 1, r: 1, g: 1,}],
		[{w: "triangle", v: 0.2, d: 0.5, r: 0.2,}, {w: "sine", v: 6, t: 2.5, d: 0.2, s: 0.1, r: 0.2, g: 1,}],
		/* 17-24 : Organ */
		[{w: "w9999", v: 0.22, s: 0.9,}, {w: "w9999", v: 0.22, t: 2, f: 2, s: 0.9,}],
		[{w: "w9999", v: 0.2, s: 1,}, {
			w: "sine",
			v: 11,
			t: 6,
			f: 2,
			s: 0.1,
			g: 1,
			h: 0.006,
			r: 0.002,
			d: 0.002,
		}, {w: "w9999", v: 0.2, t: 2, f: 1, h: 0, s: 1,}],
		[{w: "w9999", v: 0.2, d: 0.1, s: 0.9,}, {w: "w9999", v: 0.25, t: 4, f: 2, s: 0.5,}],
		[{w: "w9999", v: 0.3, a: 0.04, s: 0.9,}, {w: "w9999", v: 0.2, t: 8, f: 2, a: 0.04, s: 0.9,}],
		[{w: "sine", v: 0.2, a: 0.02, d: 0.05, s: 1,}, {w: "sine", v: 6, t: 3, f: 1, a: 0.02, d: 0.05, s: 1, g: 1,}],
		[{w: "triangle", v: 0.2, a: 0.02, d: 0.05, s: 0.8,}, {w: "square", v: 7, t: 3, f: 1, d: 0.05, s: 1.5, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 0.2, s: 0.5,}, {w: "square", v: 1, d: 0.03, s: 2, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 0.1, s: 0.8,}, {w: "square", v: 1, a: 0.3, d: 0.1, s: 2, g: 1,}],
		/* 25-32 : Guitar */
		[{w: "sine", v: 0.3, d: 0.5, f: 1,}, {w: "triangle", v: 5, t: 3, f: -1, d: 1, s: 0.1, g: 1,}],
		[{w: "sine", v: 0.4, d: 0.6, f: 1,}, {w: "triangle", v: 12, t: 3, d: 0.6, s: 0.1, g: 1, f: -1,}],
		[{w: "triangle", v: 0.3, d: 1, f: 1,}, {w: "triangle", v: 6, f: -1, d: 0.4, s: 0.5, g: 1, t: 3,}],
		[{w: "sine", v: 0.3, d: 1, f: -1,}, {w: "triangle", v: 11, f: 1, d: 0.4, s: 0.5, g: 1, t: 3,}],
		[{w: "sine", v: 0.4, d: 0.1, r: 0.01}, {w: "sine", v: 7, g: 1,}],
		[{w: "triangle", v: 0.4, d: 1, f: 1,}, {w: "square", v: 4, f: -1, d: 1, s: 0.7, g: 1,}],//[{w:"triangle",v:0.35,d:1,f:1,},{w:"square",v:7,f:-1,d:0.3,s:0.5,g:1,}],
		[{w: "triangle", v: 0.35, d: 1, f: 1,}, {w: "square", v: 7, f: -1, d: 0.3, s: 0.5, g: 1,}],//[{w:"triangle",v:0.4,d:1,f:1,},{w:"square",v:4,f:-1,d:1,s:0.7,g:1,}],//[{w:"triangle",v:0.4,d:1,},{w:"square",v:4,f:2,d:1,s:0.7,g:1,}],
		[{w: "sine", v: 0.2, t: 1.5, a: 0.005, h: 0.2, d: 0.6,}, {w: "sine", v: 11, t: 5, f: 2, d: 1, s: 0.5, g: 1,}],
		/* 33-40 : Bass */
		[{w: "sine", d: 0.3,}, {w: "sine", v: 4, t: 3, d: 1, s: 1, g: 1,}],
		[{w: "sine", d: 0.3,}, {w: "sine", v: 4, t: 3, d: 1, s: 1, g: 1,}],
		[{w: "w9999", d: 0.3, v: 0.7, s: 0.5,}, {w: "sawtooth", v: 1.2, d: 0.02, s: 0.5, g: 1, h: 0, r: 0.02,}],
		[{w: "sine", d: 0.3,}, {w: "sine", v: 4, t: 3, d: 1, s: 1, g: 1,}],
		[{w: "triangle", v: 0.3, t: 2, d: 1,}, {w: "triangle", v: 15, t: 2.5, d: 0.04, s: 0.1, g: 1,}],
		[{w: "triangle", v: 0.3, t: 2, d: 1,}, {w: "triangle", v: 15, t: 2.5, d: 0.04, s: 0.1, g: 1,}],
		[{w: "triangle", d: 0.7,}, {w: "square", v: 0.4, t: 0.5, f: 1, d: 0.2, s: 10, g: 1,}],
		[{w: "triangle", d: 0.7,}, {w: "square", v: 0.4, t: 0.5, f: 1, d: 0.2, s: 10, g: 1,}],
		/* 41-48 : Strings */
		[{w: "sawtooth", v: 0.4, a: 0.1, d: 11,}, {w: "sine", v: 5, d: 11, s: 0.2, g: 1,}],
		[{w: "sawtooth", v: 0.4, a: 0.1, d: 11,}, {w: "sine", v: 5, d: 11, s: 0.2, g: 1,}],
		[{w: "sawtooth", v: 0.4, a: 0.1, d: 11,}, {w: "sine", v: 5, t: 0.5, d: 11, s: 0.2, g: 1,}],
		[{w: "sawtooth", v: 0.4, a: 0.1, d: 11,}, {w: "sine", v: 5, t: 0.5, d: 11, s: 0.2, g: 1,}],
		[{w: "sine", v: 0.4, a: 0.1, d: 11,}, {w: "sine", v: 6, f: 2.5, d: 0.05, s: 1.1, g: 1,}],
		[{w: "sine", v: 0.3, d: 0.1, r: 0.1,}, {w: "square", v: 4, t: 3, d: 1, s: 0.2, g: 1,}],
		[{w: "sine", v: 0.3, d: 0.5, r: 0.5,}, {w: "sine", v: 7, t: 2, f: 2, d: 1, r: 1, g: 1,}],
		[{w: "triangle", v: 0.6, h: 0.03, d: 0.3, r: 0.3, t: 0.5,}, {w: "n0", v: 8, t: 1.5, d: 0.08, r: 0.08, g: 1,}],
		/* 49-56 : Ensamble */
		[{w: "sawtooth", v: 0.3, a: 0.03, s: 0.5,}, {w: "sawtooth", v: 0.2, t: 2, f: 2, d: 1, s: 2,}],
		[{w: "sawtooth", v: 0.3, f: -2, a: 0.03, s: 0.5,}, {w: "sawtooth", v: 0.2, t: 2, f: 2, d: 1, s: 2,}],
		[{w: "sawtooth", v: 0.2, a: 0.02, s: 1,}, {w: "sawtooth", v: 0.2, t: 2, f: 2, a: 1, d: 1, s: 1,}],
		[{w: "sawtooth", v: 0.2, a: 0.02, s: 1,}, {w: "sawtooth", v: 0.2, f: 2, a: 0.02, d: 1, s: 1,}],
		[{w: "triangle", v: 0.3, a: 0.03, s: 1,}, {w: "sine", v: 3, t: 5, f: 1, d: 1, s: 1, g: 1,}],
		[{w: "sine", v: 0.4, a: 0.03, s: 0.9,}, {w: "sine", v: 1, t: 2, f: 3, d: 0.03, s: 0.2, g: 1,}],
		[{w: "triangle", v: 0.6, a: 0.05, s: 0.5,}, {w: "sine", v: 1, f: 0.8, d: 0.2, s: 0.2, g: 1,}],
		[{w: "square", v: 0.15, a: 0.01, d: 0.2, r: 0.2, t: 0.5, h: 0.03,}, {
			w: "square",
			v: 4,
			f: 0.5,
			d: 0.2,
			r: 11,
			a: 0.01,
			g: 1,
			h: 0.02,
		}, {w: "square", v: 0.15, t: 4, f: 1, a: 0.02, d: 0.15, r: 0.15, h: 0.03,}, {
			g: 3,
			w: "square",
			v: 4,
			f: -0.5,
			a: 0.01,
			h: 0.02,
			d: 0.15,
			r: 11,
		}],
		/* 57-64 : Brass */
		[{w: "square", v: 0.2, a: 0.01, d: 1, s: 0.6, r: 0.04,}, {w: "sine", v: 1, d: 0.1, s: 4, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 1, s: 0.5, r: 0.08,}, {w: "sine", v: 1, d: 0.1, s: 4, g: 1,}],
		[{w: "square", v: 0.2, a: 0.04, d: 1, s: 0.4, r: 0.08,}, {w: "sine", v: 1, d: 0.1, s: 4, g: 1,}],
		[{w: "square", v: 0.15, a: 0.04, s: 1,}, {w: "sine", v: 2, d: 0.1, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 1, s: 0.5, r: 0.08,}, {w: "sine", v: 1, d: 0.1, s: 4, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 1, s: 0.6, r: 0.08,}, {w: "sine", v: 1, f: 0.2, d: 0.1, s: 4, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 0.5, s: 0.7, r: 0.08,}, {w: "sine", v: 1, d: 0.1, s: 4, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 1, s: 0.5, r: 0.08,}, {w: "sine", v: 1, d: 0.1, s: 4, g: 1,}],
		/* 65-72 : Reed */
		[{w: "square", v: 0.2, a: 0.02, d: 2, s: 0.6,}, {w: "sine", v: 2, d: 1, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 2, s: 0.6,}, {w: "sine", v: 2, d: 1, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 1, s: 0.6,}, {w: "sine", v: 2, d: 1, g: 1,}],
		[{w: "square", v: 0.2, a: 0.02, d: 1, s: 0.6,}, {w: "sine", v: 2, d: 1, g: 1,}],
		[{w: "sine", v: 0.4, a: 0.02, d: 0.7, s: 0.5,}, {w: "square", v: 5, t: 2, d: 0.2, s: 0.5, g: 1,}],
		[{w: "sine", v: 0.3, a: 0.05, d: 0.2, s: 0.8,}, {w: "sawtooth", v: 6, f: 0.1, d: 0.1, s: 0.3, g: 1,}],
		[{w: "sine", v: 0.3, a: 0.03, d: 0.2, s: 0.4,}, {w: "square", v: 7, f: 0.2, d: 1, s: 0.1, g: 1,}],
		[{w: "square", v: 0.2, a: 0.05, d: 0.1, s: 0.8,}, {w: "square", v: 4, d: 0.1, s: 1.1, g: 1,}],
		/* 73-80 : Pipe */
		[{w: "sine", a: 0.02, d: 2,}, {w: "sine", v: 6, t: 2, d: 0.04, g: 1,}],
		[{w: "sine", v: 0.7, a: 0.03, d: 0.4, s: 0.4,}, {w: "sine", v: 4, t: 2, f: 0.2, d: 0.4, g: 1,}],
		[{w: "sine", v: 0.7, a: 0.02, d: 0.4, s: 0.6,}, {w: "sine", v: 3, t: 2, d: 0, s: 1, g: 1,}],
		[{w: "sine", v: 0.4, a: 0.06, d: 0.3, s: 0.3,}, {w: "sine", v: 7, t: 2, d: 0.2, s: 0.2, g: 1,}],
		[{w: "sine", a: 0.02, d: 0.3, s: 0.3,}, {w: "sawtooth", v: 3, t: 2, d: 0.3, g: 1,}],
		[{w: "sine", v: 0.4, a: 0.02, d: 2, s: 0.1,}, {w: "sawtooth", v: 8, t: 2, f: 1, d: 0.5, g: 1,}],
		[{w: "sine", v: 0.7, a: 0.03, d: 0.5, s: 0.3,}, {w: "sine", v: 0.003, t: 0, f: 4, d: 0.1, s: 0.002, g: 1,}],
		[{w: "sine", v: 0.7, a: 0.02, d: 2,}, {w: "sine", v: 1, t: 2, f: 1, d: 0.02, g: 1,}],
		/* 81-88 : SynthLead */
		[{w: "square", v: 0.3, d: 1, s: 0.5,}, {w: "square", v: 1, f: 0.2, d: 1, s: 0.5, g: 1,}],
		[{w: "sawtooth", v: 0.3, d: 2, s: 0.5,}, {w: "square", v: 2, f: 0.1, s: 0.5, g: 1,}],
		[{w: "triangle", v: 0.5, a: 0.05, d: 2, s: 0.6,}, {w: "sine", v: 4, t: 2, g: 1,}],
		[{w: "triangle", v: 0.3, a: 0.01, d: 2, s: 0.3,}, {w: "sine", v: 22, t: 2, f: 1, d: 0.03, s: 0.2, g: 1,}],
		[{w: "sawtooth", v: 0.3, d: 1, s: 0.5,}, {w: "sine", v: 11, t: 11, a: 0.2, d: 0.05, s: 0.3, g: 1,}],
		[{w: "sine", v: 0.3, a: 0.06, d: 1, s: 0.5,}, {w: "sine", v: 7, f: 1, d: 1, s: 0.2, g: 1,}],
		[{w: "sawtooth", v: 0.3, a: 0.03, d: 0.7, s: 0.3, r: 0.2,}, {
			w: "sawtooth",
			v: 0.3,
			t: 0.75,
			d: 0.7,
			a: 0.1,
			s: 0.3,
			r: 0.2,
		}],
		[{w: "triangle", v: 0.3, a: 0.01, d: 0.7, s: 0.5,}, {w: "square", v: 5, t: 0.5, d: 0.7, s: 0.5, g: 1,}],
		/* 89-96 : SynthPad */
		[{w: "triangle", v: 0.3, a: 0.02, d: 0.3, s: 0.3, r: 0.3,}, {
			w: "square",
			v: 3,
			t: 4,
			f: 1,
			a: 0.02,
			d: 0.1,
			s: 1,
			g: 1,
		}, {w: "triangle", v: 0.08, t: 0.5, a: 0.1, h: 0, d: 0.1, s: 0.5, r: 0.1, b: 0, c: 0,}],
		[{w: "sine", v: 0.3, a: 0.05, d: 1, s: 0.7, r: 0.3,}, {w: "sine", v: 2, f: 1, d: 0.3, s: 1, g: 1,}],
		[{w: "square", v: 0.3, a: 0.03, d: 0.5, s: 0.3, r: 0.1,}, {w: "square", v: 4, f: 1, a: 0.03, d: 0.1, g: 1,}],
		[{w: "triangle", v: 0.3, a: 0.08, d: 1, s: 0.3, r: 0.1,}, {
			w: "square",
			v: 2,
			f: 1,
			d: 0.3,
			s: 0.3,
			g: 1,
			t: 4,
			a: 0.08,
		}],
		[{w: "sine", v: 0.3, a: 0.05, d: 1, s: 0.3, r: 0.1,}, {w: "sine", v: 0.1, t: 2.001, f: 1, d: 1, s: 50, g: 1,}],
		[{w: "triangle", v: 0.3, a: 0.03, d: 0.7, s: 0.3, r: 0.2,}, {w: "sine", v: 12, t: 7, f: 1, d: 0.5, s: 1.7, g: 1,}],
		[{w: "sine", v: 0.3, a: 0.05, d: 1, s: 0.3, r: 0.1,}, {w: "sawtooth", v: 22, t: 6, d: 0.06, s: 0.3, g: 1,}],
		[{w: "triangle", v: 0.3, a: 0.05, d: 11, r: 0.3,}, {w: "triangle", v: 1, d: 1, s: 8, g: 1,}],
		/* 97-104 : FX */
		[{w: "sawtooth", v: 0.3, d: 4, s: 0.8, r: 0.1,}, {w: "square", v: 1, t: 2, f: 8, a: 1, d: 1, s: 1, r: 0.1, g: 1,}],
		[{w: "triangle", v: 0.3, d: 1, s: 0.5, t: 0.8, a: 0.2, p: 1.25, q: 0.2,}, {
			w: "sawtooth",
			v: 0.2,
			a: 0.2,
			d: 0.3,
			s: 1,
			t: 1.2,
			p: 1.25,
			q: 0.2,
		}],
		[{w: "sine", v: 0.3, d: 1, s: 0.3,}, {w: "square", v: 22, t: 11, d: 0.5, s: 0.1, g: 1,}],
		[{w: "sawtooth", v: 0.3, a: 0.04, d: 1, s: 0.8, r: 0.1,}, {w: "square", v: 1, t: 0.5, d: 1, s: 2, g: 1,}],
		[{w: "triangle", v: 0.3, d: 1, s: 0.3,}, {w: "sine", v: 22, t: 6, d: 0.6, s: 0.05, g: 1,}],
		[{w: "sine", v: 0.6, a: 0.1, d: 0.05, s: 0.4,}, {w: "sine", v: 5, t: 5, f: 1, d: 0.05, s: 0.3, g: 1,}],
		[{w: "sine", a: 0.1, d: 0.05, s: 0.4, v: 0.8,}, {w: "sine", v: 5, t: 5, f: 1, d: 0.05, s: 0.3, g: 1,}],
		[{w: "square", v: 0.3, a: 0.1, d: 0.1, s: 0.4,}, {w: "square", v: 1, f: 1, d: 0.3, s: 0.1, g: 1,}],
		/* 105-112 : Ethnic */
		[{w: "sawtooth", v: 0.3, d: 0.5, r: 0.5,}, {w: "sawtooth", v: 11, t: 5, d: 0.05, g: 1,}],
		[{w: "square", v: 0.3, d: 0.2, r: 0.2,}, {w: "square", v: 7, t: 3, d: 0.05, g: 1,}],
		[{w: "triangle", d: 0.2, r: 0.2,}, {w: "square", v: 9, t: 3, d: 0.1, r: 0.1, g: 1,}],
		[{w: "triangle", d: 0.3, r: 0.3,}, {w: "square", v: 6, t: 3, d: 1, r: 1, g: 1,}],
		[{w: "triangle", v: 0.4, d: 0.2, r: 0.2,}, {w: "square", v: 22, t: 12, d: 0.1, r: 0.1, g: 1,}],
		[{w: "sine", v: 0.25, a: 0.02, d: 0.05, s: 0.8,}, {w: "square", v: 1, t: 2, d: 0.03, s: 11, g: 1,}],
		[{w: "sine", v: 0.3, a: 0.05, d: 11,}, {w: "square", v: 7, t: 3, f: 1, s: 0.7, g: 1,}],
		[{w: "square", v: 0.3, a: 0.05, d: 0.1, s: 0.8,}, {w: "square", v: 4, d: 0.1, s: 1.1, g: 1,}],
		/* 113-120 : Percussive */
		[{w: "sine", v: 0.4, d: 0.3, r: 0.3,}, {w: "sine", v: 7, t: 9, d: 0.1, r: 0.1, g: 1,}],
		[{w: "sine", v: 0.7, d: 0.1, r: 0.1,}, {w: "sine", v: 22, t: 7, d: 0.05, g: 1,}],
		[{w: "sine", v: 0.6, d: 0.15, r: 0.15,}, {w: "square", v: 11, t: 3.2, d: 0.1, r: 0.1, g: 1,}],
		[{w: "sine", v: 0.8, d: 0.07, r: 0.07,}, {w: "square", v: 11, t: 7, r: 0.01, g: 1,}],
		[{w: "triangle", v: 0.7, t: 0.5, d: 0.2, r: 0.2, p: 0.95,}, {w: "n0", v: 9, g: 1, d: 0.2, r: 0.2,}],
		[{w: "sine", v: 0.7, d: 0.1, r: 0.1, p: 0.9,}, {w: "square", v: 14, t: 2, d: 0.005, r: 0.005, g: 1,}],
		[{w: "square", d: 0.15, r: 0.15, p: 0.5,}, {w: "square", v: 4, t: 5, d: 0.001, r: 0.001, g: 1,}],
		[{w: "n1", v: 0.3, a: 1, s: 1, d: 0.15, r: 0, t: 0.5,}],
		/* 121-128 : SE */
		[{w: "sine", t: 12.5, d: 0, r: 0, p: 0.5, v: 0.3, h: 0.2, q: 0.5,}, {
			g: 1,
			w: "sine",
			v: 1,
			t: 2,
			d: 0,
			r: 0,
			s: 1,
		}, {g: 1, w: "n0", v: 0.2, t: 2, a: 0.6, h: 0, d: 0.1, r: 0.1, b: 0, c: 0,}],
		[{w: "n0", v: 0.2, a: 0.05, h: 0.02, d: 0.02, r: 0.02,}],
		[{w: "n0", v: 0.4, a: 1, d: 1, t: 0.25,}],
		[{w: "sine", v: 0.3, a: 0.1, d: 1, s: 0.5,}, {w: "sine", v: 4, t: 0, f: 1.5, d: 1, s: 1, r: 0.1, g: 1,}, {
			g: 1,
			w: "sine",
			v: 4,
			t: 0,
			f: 2,
			a: 0.6,
			h: 0,
			d: 0.1,
			s: 1,
			r: 0.1,
			b: 0,
			c: 0,
		}],
		[{w: "square", v: 0.3, t: 0.25, d: 11, s: 1,}, {w: "square", v: 12, t: 0, f: 8, d: 1, s: 1, r: 11, g: 1,}],
		[{w: "n0", v: 0.4, t: 0.5, a: 1, d: 11, s: 1, r: 0.5,}, {w: "square", v: 1, t: 0, f: 14, d: 1, s: 1, r: 11, g: 1,}],
		[{w: "sine", t: 0, f: 1221, a: 0.2, d: 1, r: 0.25, s: 1,}, {g: 1, w: "n0", v: 3, t: 0.5, d: 1, s: 1, r: 1,}],
		[{w: "sine", d: 0.4, r: 0.4, p: 0.1, t: 2.5, v: 1,}, {w: "n0", v: 12, t: 2, d: 1, r: 1, g: 1,}],
	];
	private program0: ProgramRecords = [
// 1-8 : Piano
		[{w: "triangle", v: .5, d: .7}], [{w: "triangle", v: .5, d: .7}],
		[{w: "triangle", v: .5, d: .7}], [{w: "triangle", v: .5, d: .7}],
		[{w: "triangle", v: .5, d: .7}], [{w: "triangle", v: .5, d: .7}],
		[{w: "sawtooth", v: .3, d: .7}], [{w: "sawtooth", v: .3, d: .7}],
		/* 9-16 : Chromatic Perc*/
		[{w: "sine", v: .5, d: .3, r: .3}], [{w: "triangle", v: .5, d: .3, r: .3}],
		[{w: "square", v: .2, d: .3, r: .3}], [{w: "square", v: .2, d: .3, r: .3}],
		[{w: "sine", v: .5, d: .1, r: .1}], [{w: "sine", v: .5, d: .1, r: .1}],
		[{w: "square", v: .2, d: 1, r: 1}], [{w: "sawtooth", v: .3, d: .7, r: .7}],
		/* 17-24 : Organ */
		[{w: "sine", v: 0.5, a: 0.01, s: 1}], [{w: "sine", v: 0.7, d: 0.02, s: 0.7}],
		[{w: "square", v: .2, s: 1}], [{w: "triangle", v: .5, a: .01, s: 1}],
		[{w: "square", v: .2, a: .02, s: 1}], [{w: "square", v: 0.2, a: 0.02, s: 1}],
		[{w: "square", v: 0.2, a: 0.02, s: 1}], [{w: "square", v: .2, a: .05, s: 1}],
		/* 25-32 : Guitar */
		[{w: "triangle", v: .5, d: .5}], [{w: "square", v: .2, d: .6}],
		[{w: "square", v: .2, d: .6}], [{w: "triangle", v: .8, d: .6}],
		[{w: "triangle", v: .4, d: .05}], [{w: "square", v: .2, d: 1}],
		[{w: "square", v: .2, d: 1}], [{w: "sine", v: .4, d: .6}],
		/* 33-40 : Bass */
		[{w: "triangle", v: .7, d: .4}], [{w: "triangle", v: .7, d: .7}],
		[{w: "triangle", v: .7, d: .7}], [{w: "triangle", v: .7, d: .7}],
		[{w: "square", v: .3, d: .2}], [{w: "square", v: .3, d: .2}],
		[{w: "square", v: .3, d: .1, s: .2}], [{w: "sawtooth", v: .4, d: .1, s: .2}],
		/* 41-48 : Strings */
		[{w: "sawtooth", v: .2, a: .02, s: 1}], [{w: "sawtooth", v: .2, a: .02, s: 1}],
		[{w: "sawtooth", v: .2, a: .02, s: 1}], [{w: "sawtooth", v: .2, a: .02, s: 1}],
		[{w: "sawtooth", v: .2, a: .02, s: 1}], [{w: "sawtooth", v: .3, d: .1}],
		[{w: "sawtooth", v: .3, d: .5, r: .5}], [{w: "triangle", v: .6, d: .1, r: .1, h: 0.03, p: 0.8}],
		/* 49-56 : Ensamble */
		[{w: "sawtooth", v: .2, a: .02, s: 1}], [{w: "sawtooth", v: .2, a: .02, s: 1}],
		[{w: "sawtooth", v: .2, a: .02, s: 1}], [{w: "sawtooth", v: .2, a: .02, s: 1}],
		[{w: "triangle", v: .3, a: .03, s: 1}], [{w: "sine", v: .3, a: .03, s: 1}],
		[{w: "triangle", v: .3, a: .05, s: 1}], [{w: "sawtooth", v: .5, a: .01, d: .1}],
		/* 57-64 : Brass */
		[{w: "square", v: .3, a: .05, d: .2, s: .6}], [{w: "square", v: .3, a: .05, d: .2, s: .6}],
		[{w: "square", v: .3, a: .05, d: .2, s: .6}], [{w: "square", v: 0.2, a: .05, d: 0.01, s: 1}],
		[{w: "square", v: .3, a: .05, s: 1}], [{w: "square", v: .3, s: .7}],
		[{w: "square", v: .3, s: .7}], [{w: "square", v: .3, s: .7}],
		/* 65-72 : Reed */
		[{w: "square", v: .3, a: .02, d: 2}], [{w: "square", v: .3, a: .02, d: 2}],
		[{w: "square", v: .3, a: .03, d: 2}], [{w: "square", v: .3, a: .04, d: 2}],
		[{w: "square", v: .3, a: .02, d: 2}], [{w: "square", v: .3, a: .05, d: 2}],
		[{w: "square", v: .3, a: .03, d: 2}], [{w: "square", v: .3, a: .03, d: 2}],
		/* 73-80 : Pipe */
		[{w: "sine", v: .7, a: .02, d: 2}], [{w: "sine", v: .7, a: .02, d: 2}],
		[{w: "sine", v: .7, a: .02, d: 2}], [{w: "sine", v: .7, a: .02, d: 2}],
		[{w: "sine", v: .7, a: .02, d: 2}], [{w: "sine", v: .7, a: .02, d: 2}],
		[{w: "sine", v: .7, a: .02, d: 2}], [{w: "sine", v: .7, a: .02, d: 2}],
		/* 81-88 : SynthLead */
		[{w: "square", v: .3, s: .7}], [{w: "sawtooth", v: .4, s: .7}],
		[{w: "triangle", v: .5, s: .7}], [{w: "sawtooth", v: .4, s: .7}],
		[{w: "sawtooth", v: .4, d: 12}], [{w: "sine", v: .4, a: .06, d: 12}],
		[{w: "sawtooth", v: .4, d: 12}], [{w: "sawtooth", v: .4, d: 12}],
		/* 89-96 : SynthPad */
		[{w: "sawtooth", v: .3, d: 12}], [{w: "triangle", v: .5, d: 12}],
		[{w: "square", v: .3, d: 12}], [{w: "triangle", v: .5, a: .08, d: 11}],
		[{w: "sawtooth", v: .5, a: .05, d: 11}], [{w: "sawtooth", v: .5, d: 11}],
		[{w: "triangle", v: .5, d: 11}], [{w: "triangle", v: .5, d: 11}],
		/* 97-104 : FX */
		[{w: "triangle", v: .5, d: 11}], [{w: "triangle", v: .5, d: 11}],
		[{w: "square", v: .3, d: 11}], [{w: "sawtooth", v: 0.5, a: 0.04, d: 11}],
		[{w: "sawtooth", v: .5, d: 11}], [{w: "triangle", v: .5, a: .8, d: 11}],
		[{w: "triangle", v: .5, d: 11}], [{w: "square", v: .3, d: 11}],
		/* 105-112 : Ethnic */
		[{w: "sawtooth", v: .3, d: 1, r: 1}], [{w: "sawtooth", v: .5, d: .3}],
		[{w: "sawtooth", v: .5, d: .3, r: .3}], [{w: "sawtooth", v: .5, d: .3, r: .3}],
		[{w: "square", v: .3, d: .2, r: .2}], [{w: "square", v: .3, a: .02, d: 2}],
		[{w: "sawtooth", v: .2, a: .02, d: .7}], [{w: "triangle", v: .5, d: 1}],
		/* 113-120 : Percussive */
		[{w: "sawtooth", v: .3, d: .3, r: .3}], [{w: "sine", v: .8, d: .1, r: .1}],
		[{w: "square", v: .2, d: .1, r: .1, p: 1.05}], [{w: "sine", v: .8, d: .05, r: .05}],
		[{w: "triangle", v: 0.5, d: 0.1, r: 0.1, p: 0.96}], [{w: "triangle", v: 0.5, d: 0.1, r: 0.1, p: 0.97}],
		[{w: "square", v: .3, d: .1, r: .1,}], [{w: "n1", v: 0.3, a: 1, s: 1, d: 0.15, r: 0, t: 0.5,}],
		/* 121-128 : SE */
		[{w: "triangle", v: 0.5, d: 0.03, t: 0, f: 1332, r: 0.001, p: 1.1}],
		[{w: "n0", v: 0.2, t: 0.1, d: 0.02, a: 0.05, h: 0.02, r: 0.02}],
		[{w: "n0", v: 0.4, a: 1, d: 1, t: 0.25,}],
		[{w: "sine", v: 0.3, a: 0.8, d: 1, t: 0, f: 1832}],
		[{w: "triangle", d: 0.5, t: 0, f: 444, s: 1,}],
		[{w: "n0", v: 0.4, d: 1, t: 0, f: 22, s: 1,}],
		[{w: "n0", v: 0.5, a: 0.2, d: 11, t: 0, f: 44}],
		[{w: "n0", v: 0.5, t: 0.25, d: 0.4, r: 0.4}],
	];
	private drummap1: ProgramRecords = [
		/*35*/  [{w: "triangle", t: 0, f: 70, v: 1, d: 0.05, h: 0.03, p: 0.9, q: 0.1,}, {
			w: "n0",
			g: 1,
			t: 6,
			v: 17,
			r: 0.01,
			h: 0,
			p: 0,
		}],
		[{w: "triangle", t: 0, f: 88, v: 1, d: 0.05, h: 0.03, p: 0.5, q: 0.1,}, {
			w: "n0",
			g: 1,
			t: 5,
			v: 42,
			r: 0.01,
			h: 0,
			p: 0,
		}],
		[{w: "n0", f: 222, p: 0, t: 0, r: 0.01, h: 0,}],
		[{w: "triangle", v: 0.3, f: 180, d: 0.05, t: 0, h: 0.03, p: 0.9, q: 0.1,}, {
			w: "n0",
			v: 0.6,
			t: 0,
			f: 70,
			h: 0.02,
			r: 0.01,
			p: 0,
		}, {g: 1, w: "square", v: 2, t: 0, f: 360, r: 0.01, b: 0, c: 0,}],
		[{w: "square", f: 1150, v: 0.34, t: 0, r: 0.03, h: 0.025, d: 0.03,}, {
			g: 1,
			w: "n0",
			t: 0,
			f: 13,
			h: 0.025,
			d: 0.1,
			s: 1,
			r: 0.1,
			v: 1,
		}],
		/*40*/  [{w: "triangle", f: 200, v: 1, d: 0.06, t: 0, r: 0.06,}, {
			w: "n0",
			g: 1,
			t: 0,
			f: 400,
			v: 12,
			r: 0.02,
			d: 0.02,
		}],
		[{w: "triangle", f: 100, v: 0.9, d: 0.12, h: 0.02, p: 0.5, t: 0, r: 0.12,}, {
			g: 1,
			w: "n0",
			v: 5,
			t: 0.4,
			h: 0.015,
			d: 0.005,
			r: 0.005,
		}],
		[{w: "n1", f: 390, v: 0.25, r: 0.01, t: 0,}],
		[{w: "triangle", f: 120, v: 0.9, d: 0.12, h: 0.02, p: 0.5, t: 0, r: 0.12,}, {
			g: 1,
			w: "n0",
			v: 5,
			t: 0.5,
			h: 0.015,
			d: 0.005,
			r: 0.005,
		}],
		[{w: "n1", v: 0.25, f: 390, r: 0.03, t: 0, h: 0.005, d: 0.03,}],
		/*45*/  [{w: "triangle", f: 140, v: 0.9, d: 0.12, h: 0.02, p: 0.5, t: 0, r: 0.12,}, {
			g: 1,
			w: "n0",
			v: 5,
			t: 0.3,
			h: 0.015,
			d: 0.005,
			r: 0.005,
		}],
		[{w: "n1", v: 0.25, f: 390, t: 0, d: 0.2, r: 0.2,}, {w: "n0", v: 0.3, t: 0, c: 0, f: 440, h: 0.005, d: 0.05,}],
		[{w: "triangle", f: 155, v: 0.9, d: 0.12, h: 0.02, p: 0.5, t: 0, r: 0.12,}, {
			g: 1,
			w: "n0",
			v: 5,
			t: 0.3,
			h: 0.015,
			d: 0.005,
			r: 0.005,
		}],
		[{w: "triangle", f: 180, v: 0.9, d: 0.12, h: 0.02, p: 0.5, t: 0, r: 0.12,}, {
			g: 1,
			w: "n0",
			v: 5,
			t: 0.3,
			h: 0.015,
			d: 0.005,
			r: 0.005,
		}],
		[{w: "n1", v: 0.3, f: 1200, d: 0.2, r: 0.2, h: 0.05, t: 0,}, {
			w: "n1",
			t: 0,
			v: 1,
			d: 0.1,
			r: 0.1,
			p: 1.2,
			f: 440,
		}],
		/*50*/  [{w: "triangle", f: 220, v: 0.9, d: 0.12, h: 0.02, p: 0.5, t: 0, r: 0.12,}, {
			g: 1,
			w: "n0",
			v: 5,
			t: 0.3,
			h: 0.015,
			d: 0.005,
			r: 0.005,
		}],
		[{w: "n1", f: 500, v: 0.15, d: 0.4, r: 0.4, h: 0, t: 0,}, {w: "n0", v: 0.1, t: 0, r: 0.01, f: 440,}],
		[{w: "n1", v: 0.3, f: 800, d: 0.2, r: 0.2, h: 0.05, t: 0,}, {
			w: "square",
			t: 0,
			v: 1,
			d: 0.1,
			r: 0.1,
			p: 0.1,
			f: 220,
			g: 1,
		}],
		[{w: "sine", f: 1651, v: 0.15, d: 0.2, r: 0.2, h: 0, t: 0,}, {
			w: "sawtooth",
			g: 1,
			t: 1.21,
			v: 7.2,
			d: 0.1,
			r: 11,
			h: 1,
		}, {g: 1, w: "n0", v: 3.1, t: 0.152, d: 0.002, r: 0.002,}],
		null,
		/*55*/  [{w: "n1", v: .3, f: 1200, d: 0.2, r: 0.2, h: 0.05, t: 0,}, {
			w: "n1",
			t: 0,
			v: 1,
			d: 0.1,
			r: 0.1,
			p: 1.2,
			f: 440,
		}],
		null,
		[{w: "n1", v: 0.3, f: 555, d: 0.25, r: 0.25, h: 0.05, t: 0,}, {
			w: "n1",
			t: 0,
			v: 1,
			d: 0.1,
			r: 0.1,
			f: 440,
			a: 0.005,
			h: 0.02,
		}],
		[{w: "sawtooth", f: 776, v: 0.2, d: 0.3, t: 0, r: 0.3,}, {
			g: 1,
			w: "n0",
			v: 2,
			t: 0,
			f: 776,
			a: 0.005,
			h: 0.02,
			d: 0.1,
			s: 1,
			r: 0.1,
			c: 0,
		}, {g: 11, w: "sine", v: 0.1, t: 0, f: 22, d: 0.3, r: 0.3, b: 0, c: 0,}],
		[{w: "n1", f: 440, v: 0.15, d: 0.4, r: 0.4, h: 0, t: 0,}, {w: "n0", v: 0.4, t: 0, r: 0.01, f: 440,}],
		/*60*/  null, null, null, null, null,
		/*65*/  null, null, null, null, null,
		/*70*/  null, null, null, null, null,
		/*75*/  null, null, null, null, null,
		/*80*/  [{w: "sine", f: 1720, v: 0.3, d: 0.02, t: 0, r: 0.02,}, {
			w: "square",
			g: 1,
			t: 0,
			f: 2876,
			v: 6,
			d: 0.2,
			s: 1,
			r: 0.2,
		}],
		[{w: "sine", f: 1720, v: 0.3, d: 0.25, t: 0, r: 0.25,}, {
			w: "square",
			g: 1,
			t: 0,
			f: 2876,
			v: 6,
			d: 0.2,
			s: 1,
			r: 0.2,
		}],
	];
	private drummap0: ProgramRecords = [
		/*35*/[{w: "triangle", t: 0, f: 110, v: 1, d: 0.05, h: 0.02, p: 0.1,}],
		[{w: "triangle", t: 0, f: 150, v: 0.8, d: 0.1, p: 0.1, h: 0.02, r: 0.01,}],
		[{w: "n0", f: 392, v: 0.5, d: 0.01, p: 0, t: 0, r: 0.05}],
		[{w: "n0", f: 33, d: 0.05, t: 0,}],
		[{w: "n0", f: 100, v: 0.7, d: 0.03, t: 0, r: 0.03, h: 0.02,}],
		/*40*/[{w: "n0", f: 44, v: 0.7, d: 0.02, p: 0.1, t: 0, h: 0.02,}],
		[{w: "triangle", f: 240, v: 0.9, d: 0.1, h: 0.02, p: 0.1, t: 0,}],
		[{w: "n0", f: 440, v: 0.2, r: 0.01, t: 0,}],
		[{w: "triangle", f: 270, v: 0.9, d: 0.1, h: 0.02, p: 0.1, t: 0,}],
		[{w: "n0", f: 440, v: 0.2, d: 0.04, r: 0.04, t: 0,}],
		/*45*/[{w: "triangle", f: 300, v: 0.9, d: 0.1, h: 0.02, p: 0.1, t: 0,}],
		[{w: "n0", f: 440, v: 0.2, d: 0.1, r: 0.1, h: 0.02, t: 0,}],
		[{w: "triangle", f: 320, v: 0.9, d: 0.1, h: 0.02, p: 0.1, t: 0,}],
		[{w: "triangle", f: 360, v: 0.9, d: 0.1, h: 0.02, p: 0.1, t: 0,}],
		[{w: "n0", f: 150, v: 0.2, d: 0.1, r: 0.1, h: 0.05, t: 0, p: 0.1,}],
		/*50*/[{w: "triangle", f: 400, v: 0.9, d: 0.1, h: 0.02, p: 0.1, t: 0,}],
		[{w: "n0", f: 150, v: 0.2, d: 0.1, r: 0.01, h: 0.05, t: 0, p: 0.1}],
		[{w: "n0", f: 150, v: 0.2, d: 0.1, r: 0.01, h: 0.05, t: 0, p: 0.1}],
		[{w: "n0", f: 440, v: 0.3, d: 0.1, p: 0.9, t: 0, r: 0.1,}],
		[{w: "n0", f: 200, v: 0.2, d: 0.05, p: 0.9, t: 0,}],
		/*55*/[{w: "n0", f: 440, v: 0.3, d: 0.12, p: 0.9, t: 0,}],
		[{w: "sine", f: 800, v: 0.4, d: 0.06, t: 0,}],
		[{w: "n0", f: 150, v: 0.2, d: 0.1, r: 0.01, h: 0.05, t: 0, p: 0.1}],
		[{w: "n0", f: 33, v: 0.3, d: 0.2, p: 0.9, t: 0,}],
		[{w: "n0", f: 300, v: 0.3, d: 0.14, p: 0.9, t: 0,}],
		/*60*/[{w: "sine", f: 200, d: 0.06, t: 0,}],
		[{w: "sine", f: 150, d: 0.06, t: 0,}],
		[{w: "sine", f: 300, t: 0,}],
		[{w: "sine", f: 300, d: 0.06, t: 0,}],
		[{w: "sine", f: 250, d: 0.06, t: 0,}],
		/*65*/[{w: "square", f: 300, v: .3, d: .06, p: .8, t: 0,}],
		[{w: "square", f: 260, v: .3, d: .06, p: .8, t: 0,}],
		[{w: "sine", f: 850, v: .5, d: .07, t: 0,}],
		[{w: "sine", f: 790, v: .5, d: .07, t: 0,}],
		[{w: "n0", f: 440, v: 0.3, a: 0.05, t: 0,}],
		/*70*/[{w: "n0", f: 440, v: 0.3, a: 0.05, t: 0,}],
		[{w: "triangle", f: 1800, v: 0.4, p: 0.9, t: 0, h: 0.03,}],
		[{w: "triangle", f: 1800, v: 0.3, p: 0.9, t: 0, h: 0.13,}],
		[{w: "n0", f: 330, v: 0.3, a: 0.02, t: 0, r: 0.01,}],
		[{w: "n0", f: 330, v: 0.3, a: 0.02, t: 0, h: 0.04, r: 0.01,}],
		/*75*/[{w: "n0", f: 440, v: 0.3, t: 0,}],
		[{w: "sine", f: 800, t: 0,}],
		[{w: "sine", f: 700, t: 0,}],
		[{w: "n0", f: 330, v: 0.3, t: 0,}],
		[{w: "n0", f: 330, v: 0.3, t: 0, h: 0.1, r: 0.01, p: 0.7,}],
		/*80*/[{w: "sine", t: 0, f: 1200, v: 0.3, r: 0.01,}],
		[{w: "sine", t: 0, f: 1200, v: 0.3, d: 0.2, r: 0.2,}],
	
	];
	private pg: number[] = [];
	private vol: number[] = [];
	private ex: number[] = [];
	private bend: number[] = [];
	private rpnidx: number[] = [];
	private brange: number[] = [];
	private sustain: number[] = [];
	private notetab: Note[] = [];
	private rhythm: number[] = [];
	private maxTick: number = 0;
	private playTick: number = 0;
	private playing: number = 0;
	private releaseRatio: number = 3.5;
	private preroll: number = 0.2;
	private relcnt: number = 0;
	private playIndex: number = 0;
	private playTime: number = 0;
	private tick2Time: number = 0;
	private isReady: number = 0;
	private context!: Tone.Context; // rename to context
	private masterVol!: number;
	private reverbLev!: number;
	private quality!: number;
	private debug!: number;
	private src!: string; // todo remove?
	private loop!: boolean;
	private internalcontext!: number;
	private tsmode!: number;
	private voices!: number;
	private useReverb!: number;
	private tsdiff!: number;
	
	constructor(options: { useReverb?: any; quality?: any; voices?: any; internalcontext?: any; }) {
		for (const k: (keyof WebTinySynthConfig) in this.properties) {
			this[k] = this.properties[k].value;
			console.log('post', this[k], k)
			
		}
		
		this.setQuality(1);
		
		if (options) {
			if (options.useReverb != undefined)
				this.useReverb = options.useReverb;
			if (options.quality != undefined)
				this.setQuality(options.quality);
			if (options.voices != undefined)
				this.setVoices(options.voices);
			if (options.internalcontext != undefined)
				this.internalcontext = options.internalcontext;
		}
		
		this.ready();
	}
	
	public ready() {
		this.pg = [];
		this.vol = [];
		this.ex = [];
		this.bend = [];
		this.rpnidx = [];
		this.brange = [];
		this.sustain = [];
		this.notetab = [];
		this.rhythm = [];
		this.maxTick = 0, this.playTick = 0, this.playing = 0;
		this.releaseRatio = 3.5;
		for (let i = 0; i < 16; ++i) {
			this.pg[i] = 0;
			this.vol[i] = 3 * 100 * 100 / (127 * 127);
			this.bend[i] = 0;
			this.brange[i] = 0x100;
			this.rhythm[i] = 0;
		}
		this.rhythm[9] = 1;
		/**/
		this.preroll = 0.2;
		this.relcnt = 0;
		
		if (this.internalcontext) {
			console.log("internalcontext is disabled for good!")
		}
		
		this.isReady = 1;
	}
	
	public setMasterVol(v?: number) {
		if (v !== undefined)
			this.masterVol = v;
		if (this.out)
			this.out.gain.value = this.masterVol;
	}
	
	public setReverbLev(v?: number) {
		if (v != undefined)
			this.reverbLev = v;
		const r = parseFloat(this.reverbLev.toString());
		if (this.rev && !isNaN(r))
			this.rev.gain.value = r * 8;
	}
	
	public setLoop(f: boolean) {
		this.loop = f;
	}
	
	public setVoices(v: number) {
		this.voices = v;
	}
	
	public getPlayStatus() {
		return {play: this.playing, maxTick: this.maxTick, curTick: this.playTick};
	}
	
	public getTimbreName(m: number, n: number) {
		if (m == 0)
			return this.program[n].name;
		else
			return this.drummap[n - 35].name;
	}
	
	public reset() {
		for (let i = 0; i < 16; ++i) {
			this.setProgram(i, 0);
			this.setBendRange(i, 0x100);
			this.setChVol(i, 100);
			this.setPan(i, 64);
			this.resetAllControllers(i);
			this.allSoundOff(i);
			this.rhythm[i] = 0;
		}
		this.rhythm[9] = 1;
	}
	
	public setQuality(q: number) {
		let i, k, n, p;
		if (q != undefined)
			this.quality = q;
		for (i = 0; i < 128; ++i)
			this.setTimbre(0, i, this.program0[i]);
		for (i = 0; i < this.drummap0.length; ++i)
			this.setTimbre(1, i + 35, this.drummap0[i]);
		if (this.quality) {
			for (i = 0; i < this.program1.length; ++i)
				this.setTimbre(0, i, this.program1[i]);
			for (i = 0; i < this.drummap.length; ++i) {
				if (this.drummap1[i])
					this.setTimbre(1, i + 35, this.drummap1[i]);
			}
		}
	}
	
	public setTimbre(m: number, n: number, p: Program) {
		const defp = {g: 0, w: "sine", t: 1, f: 0, v: 0.5, a: 0, h: 0.01, d: 0.01, s: 0, r: 0.05, p: 1, q: 1, k: 0};
		
		function filldef(p) {
			for (n = 0; n < p.length; ++n) {
				for (let k in defp) {
					if (!p[n].hasOwnProperty(k) || typeof (p[n][k]) == "undefined")
						p[n][k] = defp[k];
				}
			}
			return p;
		}
		
		if (m && n >= 35 && n <= 81)
			this.drummap[n - 35].p = filldef(p);
		if (m == 0 && n >= 0 && n <= 127)
			this.program[n].p = filldef(p);
	}
	
	_pruneNote = (nt: Note) => {
		let k;
		for (k = nt.o.length - 1; k >= 0; --k) {
			if (nt.o[k].frequency)
				this.chmod[nt.ch]?.disconnect(nt.o[k].detune);
			nt.o[k].disconnect();
			if (nt.o[k].frequency)
				nt.o[k].frequency.cancelScheduledValues(0);
			else
				nt.o[k].playbackRate.cancelScheduledValues(0);
			nt.o[k].stop(0);
		}
		for (k = nt.g.length - 1; k >= 0; --k) {
			nt.g[k].disconnect();
			nt.g[k].gain.cancelScheduledValues(0);
		}
	}
	
	_limitVoices = (ch, n) => {
		this.notetab.sort(function (n1, n2) {
			if (n1.f != n2.f) return n1.f - n2.f;
			if (n1.e != n2.e) return n2.e - n1.e;
			return n2.t - n1.t;
		});
		for (let i = this.notetab.length - 1; i >= 0; --i) {
			const nt = this.notetab[i];
			if (this.context.currentTime > nt.e || i >= (this.voices - 1)) {
				this._pruneNote(nt);
				this.notetab.splice(i, 1);
			}
		}
	}
	
	_note = (t, ch: number, n: number, v, p: ProgramRecords) => {
		let out, sc, pn;
		const o = [], g = [], vp = [], fp = [], r = [];
		const f = Tone.Frequency(n, "midi").toFrequency();
		this._limitVoices(ch, n);
		for (let i = 0; i < p.length; ++i) {
			pn = p[i];
			
			const dt = t + pn.a + pn.h;
			if (pn.g == 0)
				out = this.chvol[ch], sc = v * v / 16384, fp[i] = f * pn.t + pn.f;
			else if (pn.g > 10)
				out = g[pn.g - 11].gain, sc = 1, fp[i] = fp[pn.g - 11] * pn.t + pn.f;
			else if (o[pn.g - 1].frequency)
				out = o[pn.g - 1].frequency, sc = fp[pn.g - 1], fp[i] = fp[pn.g - 1] * pn.t + pn.f;
			else
				out = o[pn.g - 1].playbackRate, sc = fp[pn.g - 1] / 440, fp[i] = fp[pn.g - 1] * pn.t + pn.f;
			switch (pn.w[0]) {
				case "n":
					o[i] = new Tone.BufferSource(this.noiseBuf[pn.w]);
					o[i].loop = true;
					o[i].playbackRate.value = fp[i] / 440;
					if (pn.p != 1)
						this._setParamTarget(o[i].playbackRate, fp[i] / 440 * pn.p, t, pn.q);
					if (o[i].detune) {
						this.chmod[ch]?.connect(o[i].detune);
						o[i].detune.value = this.bend[ch];
					}
					break;
				default:
					o[i] = new Tone.Oscillator();
					o[i].frequency.value = fp[i];
					if (pn.p != 1)
						this._setParamTarget(o[i].frequency, fp[i] * pn.p, t, pn.q);
					if (pn.w[0] == "w")
						o[i].setPeriodicWave(this.wave[pn.w]);
					else
						o[i].type = pn.w;
					if (o[i].detune) {
						this.chmod[ch].connect(o[i].detune);
						o[i].detune.value = this.bend[ch];
					}
					break;
			}
			g[i] = new Tone.Gain
			r[i] = pn.r;
			o[i].connect(g[i]);
			g[i].connect(out);
			vp[i] = sc * pn.v;
			if (pn.k)
				vp[i] *= Math.pow(2, (n - 60) / 12 * pn.k);
			if (pn.a) {
				g[i].gain.value = 0;
				g[i].gain.setValueAtTime(0, t);
				g[i].gain.linearRampToValueAtTime(vp[i], t + pn.a);
			} else
				g[i].gain.setValueAtTime(vp[i], t);
			this._setParamTarget(g[i].gain, pn.s * vp[i], dt, pn.d);
			o[i].start(t);
			if (this.rhythm[ch]) {
				
				o[i].onended = () => {
					try {
						if (o[i].detune) this.chmod[ch].disconnect(o[i].detune);
					} catch (e) {
						console.warn(e);
					}
				};
				o[i].stop(t + p[0].d * this.releaseRatio);
			}
		}
		if (!this.rhythm[ch]) {
			this.notetab.push({
				t: t,
				e: 99999,
				ch: ch,
				n: n,
				o: o,
				g: g,
				t2: t + pn.a,
				v: vp,
				r: r,
				f: 0
			});
			
			console.log({
				t: t,
				e: 99999,
				ch: ch,
				n: n,
				o: o,
				g: g,
				t2: t + pn.a,
				v: vp,
				r: r,
				f: 0
			})
		}
	}
	
	_setParamTarget = (p: Tone.Param<any> | Tone.Signal<any>, v: number, t: number, d: number) => {
		if (d != 0)
			p.setTargetAtTime(v, t, d);
		else
			p.setValueAtTime(v, t);
	}
	
	_releaseNote = (nt: Note, t: number = 0) => {
		if (nt.ch != 9) {
			for (let k = nt.g.length - 1; k >= 0; --k) {
				nt.g[k].gain.cancelScheduledValues(t);
				if (t == nt.t2)
					nt.g[k].gain.setValueAtTime(nt.v[k], t);
				else if (t < nt.t2)
					nt.g[k].gain.setValueAtTime(nt.v[k] * (t - nt.t) / (nt.t2 - nt.t), t);
				this._setParamTarget(nt.g[k].gain, 0, t, nt.r[k]);
			}
		}
		nt.e = t + nt.r[0] * this.releaseRatio;
		nt.f = 1;
	}
	
	setModulation = (ch: number, v: number, t?: number) => {
		this.chmod[ch]?.gain.setValueAtTime(v * 100 / 127, this._tsConv(t));
	}
	
	setChVol = (ch: number, v: number, t?: number) => {
		this.vol[ch] = 3 * v * v / (127 * 127);
		this.chvol[ch]?.gain.setValueAtTime(this.vol[ch] * this.ex[ch], this._tsConv(t));
	}
	
	setPan = (ch: number, v: number, t?: number) => {
		if (this.chpan[ch])
			this.chpan[ch]?.pan.setValueAtTime((v - 64) / 64, this._tsConv(t));
	}
	
	setExpression = (ch: number, v: number, t?: number) => {
		this.ex[ch] = v * v / (127 * 127);
		this.chvol[ch]?.gain.setValueAtTime(this.vol[ch] * this.ex[ch], this._tsConv(t));
	}
	
	setSustain = (ch: number, v: number, t?: number) => {
		this.sustain[ch] = v;
		t = this._tsConv(t);
		if (v < 64) {
			for (let i = this.notetab.length - 1; i >= 0; --i) {
				const nt = this.notetab[i];
				if (t >= nt.t && nt.ch == ch && nt.f == 1)
					this._releaseNote(nt, t);
			}
		}
	}
	
	allSoundOff = (ch: number) => {
		for (let i = this.notetab.length - 1; i >= 0; --i) {
			const nt = this.notetab[i];
			if (nt.ch == ch) {
				this._pruneNote(nt);
				this.notetab.splice(i, 1);
			}
		}
	}
	
	resetAllControllers = (ch: number) => {
		this.bend[ch] = 0;
		this.ex[ch] = 1.0;
		this.rpnidx[ch] = 0x3fff;
		this.sustain[ch] = 0;
		if (this.chvol[ch]) {
			this.chvol[ch].gain.value = this.vol[ch] * this.ex[ch];
			this.chmod[ch].gain.value = 0;
		}
	}
	
	setBendRange = (ch: number, v: number) => {
		this.brange[ch] = v;
	}
	
	setProgram = (ch: number, v: number) => {
		if (this.debug)
			console.log("Pg(" + ch + ")=" + v);
		this.pg[ch] = v;
	}
	
	setBend = (ch: number, v: number, t?: number) => {
		t = this._tsConv(t);
		const br = this.brange[ch] * 100 / 127;
		this.bend[ch] = (v - 8192) * br / 8192;
		for (let i = this.notetab.length - 1; i >= 0; --i) {
			const nt = this.notetab[i];
			if (nt.ch == ch) {
				for (let k = nt.o.length - 1; k >= 0; --k) {
					if (nt.o[k].frequency)
						nt.o[k].detune.setValueAtTime(this.bend[ch], t);
				}
			}
		}
	}
	
	noteOn = (ch: number, n: number, v: any, t?: number) => {
		if (v == 0) {
			this.noteOff(ch, n, t);
			return;
		}
		t = this._tsConv(t);
		if (this.rhythm[ch]) {
			if (n >= 35 && n <= 81)
				this._note(t, ch, n, v, this.drummap[n - 35].p);
			return;
		}
		this._note(t, ch, n, v, this.program[this.pg[ch]].p);
	}
	
	noteOff = (ch: number, n: number, t?: number) => {
		if (this.rhythm[ch])
			return;
		t = this._tsConv(t);
		for (let i = this.notetab.length - 1; i >= 0; --i) {
			const nt = this.notetab[i];
			if (t >= nt.t && nt.ch == ch && nt.n == n && nt.f == 0) {
				nt.f = 1;
				if (this.sustain[ch] < 64)
					this._releaseNote(nt, t);
			}
		}
	}
	
	_tsConv = (t?: number) => {
		if (t == undefined || t <= 0) {
			t = 0;
			if (this.context)
				t = this.context.currentTime;
		} else {
			if (this.tsmode)
				t = t * .001 - this.tsdiff;
		}
		return t;
	}
	
	setTsMode = (tsmode: number) => {
		this.tsmode = tsmode;
	}
	
	send = (msg: number[], t?: number) => {    /* send midi message */
		const ch = msg[0] & 0xf;
		const cmd = msg[0] & ~0xf;
		if (cmd < 0x80 || cmd >= 0x100)
			return;
		if (this.context.state == "suspended") {
			this.context.resume();
		}
		switch (cmd) {
			case 0xb0:  /* ctl change */
				switch (msg[1]) {
					case 1:
						this.setModulation(ch, msg[2], t);
						break;
					case 7:
						this.setChVol(ch, msg[2], t);
						break;
					case 10:
						this.setPan(ch, msg[2], t);
						break;
					case 11:
						this.setExpression(ch, msg[2], t);
						break;
					case 64:
						this.setSustain(ch, msg[2], t);
						break;
					case 98:
						this.rpnidx[ch] = 0x3fff;
						break; /* nrpn lsb/msb */
					case 100:
						this.rpnidx[ch] = (this.rpnidx[ch] & 0x380) | msg[2];
						break; /* rpn lsb */
					case 101:
						this.rpnidx[ch] = (this.rpnidx[ch] & 0x7f) | (msg[2] << 7);
						break; /* rpn msb */
					case 6:  /* data entry msb */
						if (this.rpnidx[ch] == 0)
							this.brange[ch] = (msg[2] << 7) + (this.brange[ch] & 0x7f);
						break;
					case 38:  /* data entry lsb */
						if (this.rpnidx[ch] == 0)
							this.brange[ch] = (this.brange[ch] & 0x380) | msg[2];
						break;
					case 120:  /* all sound off */
					case 123:  /* all notes off */
					case 124:
					case 125:
					case 126:
					case 127: /* omni off/on mono/poly */
						this.allSoundOff(ch);
						break;
					case 121:
						this.resetAllControllers(ch);
						break;
				}
				break;
			case 0xc0:
				this.setProgram(ch, msg[1]);
				break;
			case 0xe0:
				this.setBend(ch, (msg[1] + (msg[2] << 7)), t);
				break;
			case 0x90:
				this.noteOn(ch, msg[1], msg[2], t);
				break;
			case 0x80:
				this.noteOff(ch, msg[1], t);
				break;
			case 0xf0:
				if (msg[0] != 254 && this.debug) {
					const ds = [];
					for (let ii = 0; ii < msg.length; ++ii)
						ds.push(msg[ii].toString(16));
					console.log(ds);
				}
				if (msg[1] == 0x41 && msg[2] == 0x10 && msg[3] == 0x42 && msg[4] == 0x12 && msg[5] == 0x40) {
					if ((msg[6] & 0xf0) == 0x10 && msg[7] == 0x15) {
						const ch = [9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15][msg[6] & 0xf];
						this.rhythm[ch] = msg[8];
//            console.log("UseForRhythmPart("+ch+")="+msg[8]);
					}
				}
				break;
		}
	}
	
	_createWave = (w: Float32Array) => {
		const imag = new Float32Array(w.length);
		const real = new Float32Array(w.length);
		for (let i = 1; i < w.length; ++i)
			imag[i] = w[i];
		return this.context.createPeriodicWave(real, imag);
	}
	
	getAudioContext = () => {
		return this.context;
	}
	
	getConnectSourceNode = () => {
		return this.comp;
	}
	
	destroy = () => {
		this.reset();
		
		this.out?.disconnect();
		if (this.conv)
			this.conv.disconnect();
		if (this.rev)
			this.rev.disconnect();
		this.comp?.disconnect();
		this.lfo?.disconnect();
		
		this.out = null;
		this.conv = null;
		this.rev = null
		this.comp = null;
		this.lfo = null;
		
		for (let chNum = 0; chNum < 16; ++chNum) {
			this.chvol[chNum]?.disconnect();
			this.chmod[chNum]?.disconnect();
			this.chpan[chNum]?.disconnect();
			
			this.chvol[chNum] = null;
			this.chmod[chNum] = null;
			this.chpan[chNum] = null;
		}
	}
	
	setAudioContext = (dest?: Tone.ToneAudioNode) => {
		this.context = Tone.getContext().rawContext;
		this.dest = dest ?? null;
		if (!dest)
			this.dest = this.context.destination;
		
		this.tsdiff = performance.now() * .001 - this.context.currentTime;
		console.log("TSDiff:" + this.tsdiff);
		this.out = new Tone.Gain;
		this.comp = new Tone.Compressor();
		const blen = this.context.sampleRate * .5 | 0;
		this.convBuf = new Tone.ToneAudioBuffer(this.context.createBuffer(2, blen, this.context.sampleRate));
		this.noiseBuf = {
			n0: new Tone.ToneAudioBuffer(this.context.createBuffer(1, blen, this.context.sampleRate)),
			n1: new Tone.ToneAudioBuffer(this.context.createBuffer(1, blen, this.context.sampleRate))
		};
		const d1 = this.convBuf.getChannelData(0);
		const d2 = this.convBuf.getChannelData(1);
		const dn = this.noiseBuf.n0.getChannelData(0);
		const dr = this.noiseBuf.n1.getChannelData(0);
		for (let i = 0; i < blen; ++i) {
			if (i / blen < Math.random()) {
				d1[i] = Math.exp(-3 * i / blen) * (Math.random() - .5) * .5;
				d2[i] = Math.exp(-3 * i / blen) * (Math.random() - .5) * .5;
			}
			dn[i] = Math.random() * 2 - 1;
		}
		for (let jj = 0; jj < 64; ++jj) {
			const r1 = Math.random() * 10 + 1;
			const r2 = Math.random() * 10 + 1;
			for (let i = 0; i < blen; ++i) {
				const dd = Math.sin((i / blen) * 2 * Math.PI * 440 * r1) * Math.sin((i / blen) * 2 * Math.PI * 440 * r2);
				dr[i] += dd / 8;
			}
		}
		if (this.useReverb) {
			this.conv = new Tone.Convolver();
			this.conv.buffer = this.convBuf;
			this.rev = new Tone.Gain();
			this.rev.gain.value = this.reverbLev;
			this.out?.connect(this.conv);
			this.conv.connect(this.rev);
			this.comp && this.rev.connect(this.comp);
		}
		this.setMasterVol();
		(this.comp) && this.out?.connect(this.comp);
		if (this.dest)
			this.comp?.connect(this.dest);
		this.chvol = [];
		this.chmod = [];
		this.chpan = [];
		this.wave = {"w9999": this._createWave("w9999")};
		this.lfo = new Tone.LFO();
		this.lfo.frequency.value = 5;
		this.lfo.start(0);
		for (let i = 0; i < 16; ++i) {
			this.chvol[i] = new Tone.Gain;
			this.chpan[i] = new Tone.Panner();
			this.chpan[i] && this.chvol[i]?.connect(this.chpan[i]!);
			this.out && this.chpan[i]?.connect(this.out);
			this.chmod[i] = new Tone.Gain;
			this.lfo.connect(this.chmod[i]!);
			this.pg[i] = 0;
			this.resetAllControllers(i);
		}
		this.setReverbLev();
		this.reset();
		
		this.send([0x90, 60, 1]);
		this.send([0x90, 60, 0]);
		
		if (!this.dest)
			return this.comp;
	}
}
