/**
 * Original source: https://github.com/valent-in/pulseq/#pulsequeue
 * Original License: GPL-3.0 license
 */

import type {Gain} from "tone/Tone";
import * as Tone from "tone/Tone";
import {DEFAULT_PULSEQ_PARAMS} from "@/constants";

export class PulseqSynth {
	public triggerRelease: (time: number) => void;
	public triggerAttack: (note, volumeMod, time, duration) => void;
	public glideTo: (note: Tone.Unit.Frequency, volumeMod: number, time: Tone.Unit.Time, duration: Tone.Unit.Time) => void;
	public destroy: () => void;
	private isMuted: boolean;
	private envelope: Tone.AmplitudeEnvelope;
	private ampAM: Gain<"gain">;
	private ampout: Gain<"gain">;
	private modulatorValues: { osc1_modgain: number; ampAM_modgain: number; osc2_modgain: number; filter_modgain: number };
	private values: { envModAttackValue: number; envDecayValue: number; lfo1Value: number; osc2octaveValue: number; envModDecayValue: number; osc3gainValue: number; filterQValue: number; panValue: number; osc2detuneValue: number; FXWetValue: number; osc3octaveValue: number; envReleaseValue: number; osc3detuneValue: number; FXAmountValue: number; envModSustainValue: number; envModReleaseValue: number; volumeValue: number; osc1gainValue: number; envSustainValue: number; FXRateValue: number; filterFreqValue: number; osc2gainValue: number; noiseValue: number; lfo2Value: number; osc1octaveValue: number; envAttackValue: number; osc1detuneValue: number };
	private noise!: Tone.Noise;
	private noisegain!: Gain<"gain">;
	private FX!: Tone.ToneAudioNode;
	private lfo1sync: boolean;
	private bpm: number;
	private glide: number;
	private FXsync: boolean;
	private disconnect: () => void;
	private calculateVolume: () => number;
	private mute: (isMute: boolean) => void;
	private addOsc1: (isOsc: boolean) => void;
	private osc1!: Tone.Oscillator;
	private setVolume: (value: number) => void;
	private gain1!: Gain<"gain"> | null;
	private addOsc2: (isOsc: boolean) => void;
	private osc2!: Tone.Oscillator;
	private gain2!: Gain<"gain">;
	private addOsc3: (isOsc: boolean) => void;
	private osc3!: Tone.Oscillator;
	private gain3!: Gain<"gain">;
	private freqSignalReconnect: () => void;
	private addFilter: (filterType: BiquadFilterType) => void;
	private filter!: Tone.BiquadFilter;
	private addNoise: (isNoise: boolean) => void;
	private addFX: (type) => void;
	private addLfo2: (isLfo) => void;
	private setBpm: (bpm) => void;
	private setLfo1Frequency: (frequency: number) => void;
	private addLfo1: (isLfo) => void;
	private addModEnvelope: (type) => void;
	private addPan: (isPan) => void;
	private syncModEnvelope: () => void;
	private setModulator: (modulatorStr, carrierGainStr) => void;
	private setFXRate: (value?) => void;
	private setFXValue: (value?) => void;
	private lfo2: Tone.Oscillator;
	private lfo1: Tone.Oscillator;
	private restoreModulator: (modulatorStr) => void;
	private envelopeMod: Tone.Envelope;
	private modEnvelopeType: string;
	private pan: Tone.Panner;

	constructor(outputNode: Tone.ToneAudioNode) {
		/*
		 * Main audio chain:
		 * VCO1+VCO2+O3+Noise -> Mixer -> Envelope -> VC Filter -> VC Amplifier -> Pan -> Amplifier -> FX ->
		 */

		this.isMuted = false;

		this.envelope = new Tone.AmplitudeEnvelope();
		this.ampAM = new Tone.Gain(1);
		this.ampout = new Tone.Gain(1);

		this.values = {
			osc1detuneValue: 0, osc1octaveValue: 0, osc2detuneValue: 0, osc2octaveValue: 0, osc3detuneValue: 0, osc3octaveValue: 0,

			filterFreqValue: 0, filterQValue: 0, noiseValue: 0, osc1gainValue: 0, osc2gainValue: 0, osc3gainValue: 0, lfo1Value: 0, lfo2Value: 0, panValue: 0, volumeValue: 0,

			envAttackValue: 0, envDecayValue: 0, envSustainValue: 0, envReleaseValue: 0,

			envModAttackValue: 0, envModDecayValue: 0, envModSustainValue: 0, envModReleaseValue: 0,

			FXAmountValue: 0, FXRateValue: 0, FXWetValue: 0,
		};

		this.modulators = {
			osc1_modgain: null, osc2_modgain: null, filter_modgain: null, ampAM_modgain: null
		};

		this.modulatorValues = {
			osc1_modgain: 0, osc2_modgain: 0, filter_modgain: 0, ampAM_modgain: 0
		};

		this.bpm = Tone.Transport.bpm.value;
		this.modEnvelopeType = "[none]";
		this.FXType = "[none]";
		this.lastFXType = null;
		this.FXsync = false;
		this.glide = 0;
		this.lfo1sync = false;

		this.envelope.chain(this.ampAM);
		this.ampAM.chain(this.ampout);
		this.ampout.connect(outputNode);

		let freqSignal = new Tone.Signal({units: "frequency"});
		let lastVolumeMod = 0;
		let lastNote = "";

		this.disconnect = () => {
			Object.getOwnPropertyNames(this).forEach((prop) => {
				console.log("disconnect " + prop);
				if (prop.disconnect) prop.disconnect();
			});
		}

		this.triggerAttack = function (note, volumeMod, time, duration) {
			lastNote = note;
			freqSignal.setValueAtTime(note, time);

			if (volumeMod != lastVolumeMod) {
				if (lastVolumeMod < volumeMod) {
					lastVolumeMod = volumeMod;
					const attackMod = Math.min(this.values.envAttackValue, duration);
					this.ampout.gain.linearRampTo(this.calculateVolume(), attackMod, time);
				} else {
					lastVolumeMod = volumeMod;
					// Reduce volume before triggerAttack
					this.ampout.gain.linearRampTo(this.calculateVolume(), 0.01, time - 0.011);
				}
			}
			this.envelope.triggerAttack(time);

			if (this.envelopeMod) this.envelopeMod.triggerAttack(time);
		}

		this.triggerRelease = function (time) {
			this.envelope.triggerRelease(time);

			if (this.envelopeMod) this.envelopeMod.triggerRelease(time);
		}

		this.glideTo = function (note, volumeMod, time, duration) {
			if (note != lastNote) {
				lastNote = note;
				const freq = Tone.Frequency(note).toFrequency();
				freqSignal.linearRampTo(freq, duration * this.glide, time);
			}

			if (volumeMod != lastVolumeMod) {
				lastVolumeMod = volumeMod;
				const glideTime = Math.max(duration * this.glide, 0.01);
				this.ampout.gain.linearRampTo(this.calculateVolume(), glideTime, time);
			}
		}

		this.calculateVolume = function () {
			const volume = (1 + lastVolumeMod / 100) * this.values.volumeValue;
			return (Math.exp(volume * 5.76) - 1) / 1000 * 3.1611;
		}

		this.setVolume = function (value) {
			this.values.volumeValue = value
			this.ampout.gain.value = this.calculateVolume();
		}

		this.mute = function (isMute) {
			this.isMuted = isMute;

			if (isMute) {
				if (this.FX) this.FX.disconnect(); else this.ampout.disconnect();
			} else {
				if (this.FX) this.FX.chain(outputNode); else this.ampout.chain(outputNode);
			}
		}

		this.addOsc1 = function (isOsc) {
			if (isOsc) {
				if (this.osc1) return;

				this.osc1 = new Tone.Oscillator();
				this.osc1.detune.value = this.values.osc1octaveValue + this.values.osc1detuneValue;
				this.gain1 = new Tone.Gain(0);
				this.gain1.gain.value = this.values.osc1gainValue;

				this.osc1.start();
				this.osc1.chain(this.gain1);
				this.gain1.chain(this.envelope);
				this.restoreModulator("osc1");

				if (this.osc1_modgain) this.osc1_modgain.connect(this.osc1.frequency);

				console.log("add osc1");
			} else {
				if (!this.osc1) return;

				if (this.osc1_modgain) this.osc1_modgain.disconnect();

				this.osc1.stop();
				this.osc1.disconnect();
				this.osc1.dispose();
				this.osc1 = null;
				this.gain1.disconnect();
				this.gain1.dispose();
				this.gain1 = null;
				console.log("remove osc1");
			}
			this.freqSignalReconnect();
		}

		this.addOsc2 = function (isOsc) {
			if (isOsc) {
				if (this.osc2) return;

				this.osc2 = new Tone.Oscillator();
				this.osc2.detune.value = this.values.osc2octaveValue + this.values.osc2detuneValue;
				this.gain2 = new Tone.Gain(0);
				this.gain2.gain.value = this.values.osc2gainValue;

				this.osc2.start();
				this.osc2.chain(this.gain2);
				this.gain2.chain(this.envelope);
				this.restoreModulator("osc2");

				if (this.osc2_modgain) this.osc2_modgain.connect(this.osc2.frequency);

				console.log("add osc2");
			} else {
				if (!this.osc2) return;

				if (this.osc2_modgain) this.osc2_modgain.disconnect();

				this.osc2.stop();
				this.osc2.disconnect();
				this.osc2.dispose();
				this.osc2 = null;
				this.gain2.disconnect();
				this.gain2.dispose();
				this.gain2 = null;
				console.log("remove osc2");
			}
			this.freqSignalReconnect();
		}

		this.addOsc3 = function (isOsc) {
			if (isOsc) {
				if (this.osc3) return;

				this.osc3 = new Tone.Oscillator();
				this.osc3.detune.value = this.values.osc3octaveValue + this.values.osc3detuneValue;
				this.gain3 = new Tone.Gain(0);

				this.gain3.gain.value = this.values.osc3gainValue;
				freqSignal.connect(this.osc3.frequency);

				this.osc3.chain(this.gain3);
				this.gain3.chain(this.envelope);
				this.osc3.start();
				this.restoreModulator("osc3");
				console.log("add osc3");
			} else {
				if (!this.osc3) return;

				this.osc3.stop();
				this.gain3.disconnect();
				this.osc3.disconnect();
				this.gain3.dispose();
				this.osc3.dispose();
				this.gain3 = null;
				this.osc3 = null;
				console.log("remove osc3");
			}
			this.freqSignalReconnect();
		}

		this.freqSignalReconnect = function () {
			freqSignal.disconnect();

			if (this.osc1) freqSignal.connect(this.osc1.frequency);
			if (this.osc2) freqSignal.connect(this.osc2.frequency);
			if (this.osc3) freqSignal.connect(this.osc3.frequency);
		}

		this.addNoise = function (isNoise) {
			if (isNoise) {
				if (this.noise) return;

				this.noise = new Tone.Noise();
				this.noise.channelCount = 1;
				this.noise.channelCountMode = "explicit";
				this.noisegain = new Tone.Gain(0);
				this.noisegain.gain.value = this.values.noiseValue;

				this.noise.chain(this.noisegain);
				this.noisegain.chain(this.envelope);
				this.noise.start();
				this.restoreModulator("noise");
				console.log("add noise");
			} else {
				if (!this.noise) return;

				this.noise.stop();
				this.noisegain.disconnect();
				this.noise.disconnect();
				this.noisegain.dispose();
				this.noise.dispose();
				this.noisegain = null;
				this.noise = null;
				console.log("remove noise");
			}
		}

		this.addFilter = function (filterType: BiquadFilterType) {
			if (filterType == "[none]") {
				if (!this.filter) return;

				if (this.filter_modgain) this.filter_modgain.disconnect();

				this.envelope.disconnect(this.filter);
				this.filter.disconnect(this.ampAM);
				this.filter.dispose();
				this.filter = null;

				this.envelope.chain(this.ampAM);
				console.log("remove filter");
			} else {
				if (this.filter) {
					this.filter.type = filterType;
				} else {
					this.filter = new Tone.BiquadFilter(this.values.filterFreqValue, filterType);

					this.envelope.disconnect(this.ampAM);
					this.envelope.chain(this.filter);
					this.filter.chain(this.ampAM);

					if (this.filter_modgain) this.filter_modgain.connect(this.filter.frequency);

					console.log("add filter");
				}
				this.filter.frequency.value = this.values.filterFreqValue;
				this.filter.Q.value = this.values.filterQValue;
			}
		}

		this.addFX = function (type) {
			if (this.FX) {
				this.ampout.disconnect();
				this.FX.disconnect();
				this.FX.dispose();
				this.FX = null;

				if (!this.isMuted) this.ampout.chain(outputNode);

				console.log("remove FX");
			}

			this.FXType = type;
			if (type == "[none]") return

			this.lastFXType = type;

			switch (type) {
				case "distort":
					this.FX = new Tone.Distortion();
					break;

				case "delay":
					this.FX = new Tone.FeedbackDelay();
					break;

				case "pingpong":
					this.FX = new Tone.PingPongDelay();
					break;

				case "panner":
					this.FX = new Tone.AutoPanner();
					this.FX.start();
					break;

				case "reverb":
					this.FX = new Tone.Reverb();
					break;

				case "chorus":
					this.FX = new Tone.Chorus(0.5);
					this.FX.start();
					break;

				case "stereo":
					this.FX = new Tone.StereoWidener();
					break;

				case "phaser":
					this.FX = new Tone.Phaser({baseFrequency: 440});
					break;

				case "tremolo":
					this.FX = new Tone.Tremolo();
					this.FX.start();
					break;

				case "vibrato":
					this.FX = new Tone.Vibrato();
					break;
			}

			if (!this.FX) return;

			this.ampout.disconnect();
			this.ampout.chain(this.FX);

			if (!this.isMuted) this.FX.chain(outputNode);

			this.setFXValue();
			this.setFXRate();
			this.FX.wet.value = this.values.FXWetValue;
			console.log("add FX - " + type);
		}

		this.setFXValue = function (value) {
			if (value !== undefined) this.values.FXAmountValue = value;

			if (!this.FX) return;

			switch (this.FXType) {
				case "distort":
					this.FX.distortion = this.values.FXAmountValue;
					break;

				case "delay":
				case "pingpong":
					this.FX.feedback.value = this.values.FXAmountValue * 0.9;
					break;

				case "panner":
					this.FX.depth.value = this.values.FXAmountValue;
					break;

				case "reverb":
					this.FX.ready.then(() => {
						this.FX.decay = this.values.FXAmountValue * 4 + 0.001;
					}).catch(() => console.log("async reverb deletion"));
					break;

				case "chorus":
					this.FX.depth = this.values.FXAmountValue;
					break;

				case "stereo":
					this.FX.width.value = this.values.FXAmountValue;
					break;

				case "phaser":
					this.FX.octaves = this.values.FXAmountValue * 5;
					break;

				case "tremolo":
				case "vibrato":
					this.FX.depth.value = this.values.FXAmountValue;
					break;
			}
		}

		this.setFXRate = function (value) {
			if (value !== undefined) this.values.FXRateValue = value;

			if (!this.FX) return;

			switch (this.FXType) {
				case "delay":
				case "pingpong":
					if (this.FXsync) {
						this.FX.delayTime.value = (2 ** (4 - Math.round(this.values.FXRateValue * 3))) + "n";
					} else {
						this.FX.delayTime.value = this.values.FXRateValue;
					}
					break;

				case "panner":
					this.FX.frequency.value = this.values.FXRateValue * 12;
					break;

				case "chorus":
					this.FX.delayTime = this.values.FXRateValue * 18 + 2;
					break;

				case "phaser":
					this.FX.frequency.value = this.values.FXRateValue * 20;
					break;

				case "tremolo":
				case "vibrato":
					this.FX.frequency.value = this.values.FXRateValue * 50;
					break;
			}
		}

		this.addPan = function (isPan) {
			if (isPan) {
				if (this.pan) return;

				this.pan = new Tone.Panner(0);
				this.pan.pan.value = this.values.panValue;
				this.ampAM.disconnect();
				this.ampAM.chain(this.pan);
				this.pan.chain(this.ampout);

				console.log("add pan");
			} else {
				if (!this.pan) return;

				this.ampAM.disconnect();
				this.pan.disconnect();
				this.pan.dispose();
				this.pan = null;
				this.ampAM.connect(this.ampout);
				console.log("remove pan");
			}
		}

		this.addLfo1 = function (isLfo) {
			if (isLfo) {
				if (this.lfo1) return;

				this.lfo1 = new Tone.Oscillator(this.values.lfo1Value);

				if (this.values.lfo1Value > 0) this.setLfo1Frequency();

				this.lfo1.start();
				this.restoreModulator("lfo1");
				console.log("add lfo1");
			} else {
				if (!this.lfo1) return;

				this.lfo1.stop();
				this.lfo1.disconnect();
				this.lfo1.dispose();
				this.lfo1 = null;
				console.log("remove lfo1");
			}
		}

		this.setLfo1Frequency = function (frequency) {
			if (frequency != undefined) this.values.lfo1Value = frequency;

			if (!this.lfo1) return;

			if (this.lfo1sync) {
				this.lfo1.frequency.value = syncFreqToBpm(this.values.lfo1Value, this.bpm);
			} else {
				this.lfo1.frequency.value = this.values.lfo1Value;
			}

			function syncFreqToBpm(freq, bpm) {
				if (freq == 0 || bpm == 0) return 0;

				const freqPerMin = freq * 60;

				if (freqPerMin >= bpm) {
					return Math.round(freqPerMin / bpm) * bpm / 60;
				} else {
					const bpmInHz = bpm / 60;
					return bpmInHz / Math.round(bpmInHz / freq);
				}
			}
		}

		this.setBpm = function (bpm) {
			this.bpm = bpm;
			this.setLfo1Frequency(this.values.lfo1Value);
			this.addFX(this.FXType);
		}

		this.addLfo2 = function (isLfo) {
			if (isLfo) {
				if (this.lfo2) return;

				this.lfo2 = new Tone.Oscillator(this.values.lfo2Value);
				this.lfo2.start();
				this.restoreModulator("lfo2");
				console.log("add lfo2");
			} else {
				if (!this.lfo2) return;

				this.lfo2.stop();
				this.lfo2.disconnect();
				this.lfo2.dispose();
				this.lfo2 = null;
				console.log("remove lfo2");
			}
		}

		this.addModEnvelope = function (type) {
			if (type == "[none]") {
				if (!this.envelopeMod) return

				this.envelopeMod.disconnect();
				this.envelopeMod.dispose();
				this.envelopeMod = null;

				console.log("remove mod envelope");
			} else if (!this.envelopeMod) {
				this.envelopeMod = new Tone.Envelope();
				console.log("add mod envelope");
			}

			if (this.modEnvelopeType == "[none]" && type != "[none]") {
				this.restoreModulator("envelopeMod");
			}

			this.modEnvelopeType = type;
		}

		this.syncModEnvelope = function () {
			if (!this.envelopeMod) return;

			this.envelopeMod.decayCurve = this.modEnvelopeType;
			this.envelopeMod.releaseCurve = this.modEnvelopeType;

			this.envelopeMod.attack = this.values.envModAttackValue;
			this.envelopeMod.decay = this.values.envModDecayValue;
			this.envelopeMod.sustain = this.values.envModSustainValue;
			this.envelopeMod.release = this.values.envModReleaseValue;

			console.log("envelope sync");
		}

		this.setModulator = function (modulatorStr, carrierGainStr) {
			const carrierGain = this[carrierGainStr];
			const previousModulator = this[this.modulators[carrierGainStr]];

			if (previousModulator && carrierGain) {
				previousModulator.disconnect(carrierGain);
			}

			if (modulatorStr == "[none]") {
				if (carrierGain && carrierGain.disconnect) {
					carrierGain.disconnect();
					carrierGain.dispose();
					this[carrierGainStr] = null;
				}
			} else {
				if (!carrierGain) {
					// Get carrier name - remove "_modgain" from "carrier_modgain"
					const targetStr = carrierGainStr.substr(0, carrierGainStr.indexOf("_"));
					this[carrierGainStr] = new Tone.Gain(this.modulatorValues[carrierGainStr]);

					if (this[targetStr]) {
						if (this[targetStr].frequency) this[carrierGainStr].connect(this[targetStr].frequency); else this[carrierGainStr].connect(this[targetStr].gain);
					}
				}

				if (this[modulatorStr]) {
					this[modulatorStr].connect(this[carrierGainStr]);
				}
			}

			this.modulators[carrierGainStr] = modulatorStr == "[none]" ? null : modulatorStr;
		}

		this.restoreModulator = function (modulatorStr) {
			const modulator = this[modulatorStr];
			if (!modulator) return;

			for (const key in this.modulators) {
				if (this.modulators[key] == modulatorStr) modulator.connect(this[key]);
			}
		}

		this.destroy = () => {
			for (const key in this) if (this[key] && this[key].disconnect) this[key].disconnect();

			freqSignal.disconnect();

			for (const key in this) if (this[key] && this[key].dispose) {
				this[key].dispose();
				this[key] = null;
			}

			freqSignal.dispose();
			freqSignal = null;
		}

		const synthOptions = DEFAULT_PULSEQ_PARAMS.synthState

		for (let key in synthOptions) {
			synthParamApply(key, synthOptions[key], this);
		}
	}

}

export function synthParamApply(paramId, controlValue, synth) {
	let value = Number(controlValue);

	const envelopeExp = (x) => (2 ** x - 1) / 255;

	const lfoExp = (x) => (2 ** x) / 32;

	const freqModExp = (x) => {
		let absX = Math.abs(x);
		let mod = x > 0 ? 1 : -1;
		return (2 ** absX - 1) * 20 * mod;
	}

	const filterExp = (x) => {
		let absX = Math.abs(x);
		let mod = x > 0 ? 1 : -1;
		return (2 ** absX - 1) * 320 * mod;
	};

	switch (paramId) {
		// Oscillator 1
		case "synth-osc1-octave":
			synth.values.osc1octaveValue = controlValue * 1200;
			if (synth.osc1)
				synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
			break;

		case "synth-osc1-detune":
			synth.values.osc1detuneValue = value;
			if (synth.osc1)
				synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
			break;

		case "synth-osc1-reset-detune":
			synth.values.osc1detuneValue = 0;
			value = 0;
			paramId = "synth-osc1-detune"
			if (synth.osc1)
				synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
			break;

		case "synth-osc1-level":
			synth.values.osc1gainValue = value;
			if (synth.gain1)
				synth.gain1.gain.value = synth.values.osc1gainValue;
			break;

		case "synth-osc1-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addOsc1(false);
			} else {
				synth.addOsc1(true);
				synth.osc1.type = controlValue;
			}
			break;

		// Oscillator 2
		case "synth-osc2-octave":
			synth.values.osc2octaveValue = controlValue * 1200;
			if (synth.osc2)
				synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
			break;

		case "synth-osc2-detune":
			synth.values.osc2detuneValue = value;
			if (synth.osc2)
				synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
			break;

		case "synth-osc2-reset-detune":
			synth.values.osc2detuneValue = 0;
			value = 0;
			paramId = "synth-osc2-detune"
			if (synth.osc2)
				synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
			break;

		case "synth-osc2-level":
			synth.values.osc2gainValue = value;
			if (synth.gain2)
				synth.gain2.gain.value = synth.values.osc2gainValue;
			break;

		case "synth-osc2-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addOsc2(false);
			} else {
				synth.addOsc2(true);
				synth.osc2.type = controlValue;
			}
			break;

		// Oscillator 3
		case "synth-osc3-octave":
			synth.values.osc3octaveValue = controlValue * 1200;
			if (synth.osc3)
				synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;
			break;

		case "synth-osc3-detune":
			synth.values.osc3detuneValue = value;
			if (synth.osc3)
				synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;
			;
			break;

		case "synth-osc3-reset-detune":
			synth.values.osc3detuneValue = 0;
			value = 0;
			paramId = "synth-osc3-detune"
			if (synth.osc3)
				synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;
			break;

		case "synth-osc3-level":
			synth.values.osc3gainValue = value;
			if (synth.osc3)
				synth.gain3.gain.value = synth.values.osc3gainValue;
			break;

		case "synth-osc3-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addOsc3(false);
			} else {
				synth.addOsc3(true);
				synth.osc3.type = controlValue;
			}
			break;

		// Noise
		case "synth-noise-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addNoise(false);
			} else {
				synth.addNoise(true);
				synth.noise.type = value;
			}
			break;

		case "synth-noise-level":
			synth.values.noiseValue = value;
			if (synth.noisegain)
				synth.noisegain.gain.value = value;
			break;

		// Amplitude envelope
		case "synth-envelope-attack":
			synth.values.envAttackValue = envelopeExp(value);
			synth.envelope.attack = synth.values.envAttackValue;
			break;

		case "synth-envelope-decay":
			synth.values.envDecayValue = envelopeExp(value) + 0.001;
			synth.envelope.decay = synth.values.envDecayValue;
			break;

		case "synth-envelope-sustain":
			synth.values.envSustainValue = value;
			synth.envelope.sustain = synth.values.envSustainValue;
			break;

		case "synth-envelope-release":
			synth.values.envReleaseValue = envelopeExp(value) + 0.001;
			synth.envelope.release = synth.values.envReleaseValue;
			break;

		case "synth-envelope-type":
			value = controlValue;
			synth.envelope.decayCurve = value;
			synth.envelope.releaseCurve = value;
			break;

		// Filter
		case "synth-filter-type":
			value = controlValue;
			synth.addFilter(value);
			break;

		case "synth-filter-frequency":
			synth.values.filterFreqValue = filterExp(value);
			if (synth.filter)
				synth.filter.frequency.value = synth.values.filterFreqValue;
			break;

		case "synth-filter-quality":
			synth.values.filterQValue = value;
			if (synth.filter)
				synth.filter.Q.value = value;
			break;

		// Amplifier
		case "synth-amplifier-gain":
			synth.setVolume(value);
			break;

		//Glide
		case "synth-glide":
			synth.glide = value;
			break;

		// Panner
		case "synth-pan":
			synth.addPan(!!value);
			synth.values.panValue = value;
			if (synth.pan)
				synth.pan.pan.value = value;
			break;

		case "synth-pan-reset":
			value = 0;
			paramId = "synth-pan"

			synth.addPan(false);
			synth.values.panValue = 0;
			if (synth.pan)
				synth.pan.pan.value = 0;
			break;

		//LFO1
		case "synth-lfo1-frequency":
			synth.setLfo1Frequency(lfoExp(value));
			break;

		case "synth-lfo1-sync":
			value = controlValue;
			synth.lfo1sync = value;
			synth.setLfo1Frequency();
			break;

		case "synth-lfo1-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addLfo1(false);
			} else {
				synth.addLfo1(true);
				synth.lfo1.type = controlValue;
			}
			break;

		//LFO2
		case "synth-lfo2-frequency":
			synth.values.lfo2Value = lfoExp(value);
			if (synth.lfo2)
				synth.lfo2.frequency.value = synth.values.lfo2Value;
			break;

		case "synth-lfo2-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addLfo2(false);
			} else {
				synth.addLfo2(true);
				synth.lfo2.type = controlValue;
			}
			break;

		// Modulation envelope
		case "synth-mod-envelope-type":
			value = controlValue;
			synth.addModEnvelope(value);
			synth.syncModEnvelope();
			break;

		case "synth-mod-envelope-attack":
			synth.values.envModAttackValue = envelopeExp(value);
			synth.syncModEnvelope();
			break;

		case "synth-mod-envelope-decay":
			synth.values.envModDecayValue = envelopeExp(value) + 0.001;
			synth.syncModEnvelope();
			break;

		case "synth-mod-envelope-sustain":
			synth.values.envModSustainValue = value;
			synth.syncModEnvelope();
			break;

		case "synth-mod-envelope-release":
			synth.values.envModReleaseValue = envelopeExp(value) + 0.001;
			synth.syncModEnvelope();
			break;

		// Modulators
		case "synth-osc1-mod-input":
			value = controlValue;
			synth.setModulator(value, "osc1_modgain");
			break;

		case "synth-osc1-mod-value":
			synth.modulatorValues.osc1_modgain = freqModExp(value);
			if (synth.osc1_modgain)
				synth.osc1_modgain.gain.value = synth.modulatorValues.osc1_modgain;
			break;

		case "synth-osc2-mod-input":
			value = controlValue;
			synth.setModulator(value, "osc2_modgain");
			break;

		case "synth-osc2-mod-value":
			synth.modulatorValues.osc2_modgain = freqModExp(value);
			if (synth.osc2_modgain)
				synth.osc2_modgain.gain.value = synth.modulatorValues.osc2_modgain;
			break;

		case "synth-filter-mod-input":
			value = controlValue;
			synth.setModulator(value, "filter_modgain");
			break;

		case "synth-filter-mod-value":
			synth.modulatorValues.filter_modgain = filterExp(value);
			if (synth.filter_modgain)
				synth.filter_modgain.gain.value = synth.modulatorValues.filter_modgain;
			break;

		case "synth-amplifier-mod-input":
			value = controlValue;
			synth.setModulator(value, "ampAM_modgain");
			break;

		case "synth-amplifier-mod-value":
			synth.modulatorValues.ampAM_modgain = value;
			if (synth.ampAM_modgain)
				synth.ampAM_modgain.gain.value = value;
			break;

		// FX
		case "synth-fx-type":
			value = controlValue;
			synth.addFX(value);
			break;

		case "synth-fx-amount":
			synth.setFXValue(value);
			break;

		case "synth-fx-rate":
			synth.setFXRate(value);
			break;

		case "synth-fx-sync":
			value = controlValue;
			synth.FXsync = value;
			synth.setFXRate();
			break;

		case "synth-fx-wet":
			synth.values.FXWetValue = value;
			if (synth.FX)
				synth.FX.wet.value = synth.values.FXWetValue;
			break;

		default:
			console.log("Function not implemented for : " + paramId);
			return null;
	}

	return {id: paramId, value: value};
}
