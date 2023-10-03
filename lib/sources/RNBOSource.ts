import * as Tone from 'tone/Tone';
import type {Dictionary} from "~/lib/typescript.types";
import {DEFAULT_NOTE} from "~/lib/Sequencer";
import type BaseSynth from "~/lib/rnbo/BaseSynth";
import {getParameters, SynthFactory, type VoiceType} from "~/lib/rnbo/data";
import {AbstractSource} from "~/lib/sources/AbstractSource";

export default class RNBOSource extends AbstractSource {
    public parameters!: string[];
    private _voice: BaseSynth;
    private _voiceType: VoiceType

    constructor(voiceType: VoiceType) {
        super()
        this._voice = SynthFactory.create(voiceType) as BaseSynth;
        this._voiceType = voiceType;

        this.parameters = getParameters(this._voiceType)
    }

    public async init(): Promise<void> {
        await this._voice.initDevice();
        this._isInitialized = true;
    }

    public get(): Dictionary {
        return this._voice.state.value
    }

    public set(options: Dictionary<string | number>, time: number): void {
        this._voice.set({
            ...this._voice.state.value,
            ...options
        }, time)
    }

    public disconnect(): this {
        this._voice.disconnect();

        return this
    }

    public chain(...args: Tone.ToneAudioNode[]): this {
        this._voice.chain(...args);

        return this
    }

    public triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity?: number): this {
        this._voice.play({
            n: Tone.Frequency(note).toMidi(),
            amp: (velocity ?? 100),
            dur: Tone.Time(duration).toMilliseconds()
        }, time as number)

        this._voice.release(Tone.Frequency(note).toMidi(), duration as number + (time as number))
		
        return this
    }

    /**
     * @deprecated
     */
    public dispose(): this {
        this._voice.dispose();

        return this
    }

    /**
     * @deprecated
     * @param time
     */
    public releaseAll(time?: Tone.Unit.Time): this {
        this._voice.release(0, time as number)

        return this
    }

    public triggerRelease(note: Tone.Unit.Frequency = DEFAULT_NOTE, time?: Tone.Unit.Time): this {
        this._voice.release(Tone.Frequency(note).toMidi(), time as number)

        return this
    }

    public triggerAttack(note: Tone.Unit.Frequency = DEFAULT_NOTE, time?: Tone.Unit.Time, velocity?: number): this {
        this._voice.play({
            n: Tone.Frequency(note).toMidi(),
            amp: (velocity ?? 100),
            dur: Tone.Time('1m').toMilliseconds()
        }, time as number)
        return this
    }

    public export(): Dictionary {
        return {
            type: this._voiceType
        };
    }
}
