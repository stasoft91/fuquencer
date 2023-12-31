import BaseSynth from "./BaseSynth";
import type {Dictionary} from "../typescript.types";
import {getParameters} from "~/lib/rnbo/data";

/**
 * A simple synth for creating sine wave sub bass sounds, with some FM modulation.
 * @example
 * s0.set({inst: 'sub'})
 */
class SubSynth extends BaseSynth {
    parameters: string[] = getParameters('sub')
    
    /** @hidden */
    json = new URL('./json/sub.export.json', import.meta.url)
    
    /** @hidden */
    defaults: Dictionary = {
        ...BaseSynth.DEFAULTS,
        slide: 10, fat: 0.5,
        dur: 1000, a: 100, d: 100, s: 0.75, r: 1000, fila: 0, fild: 100, fils: 1, filr: 100, res: 3,
        moda: 0, modd: 10,
        lfodepth: 0, lforate: 1,
    }

    /** @hidden */
    constructor() {
        super()
        this.parameters = getParameters('sub')
    }

    /**
     * Synth fatness - amount of FM applied
     * @param value - 0 is not fat, 1 is max fat
     */
    fat(value: number = 0, time: number): void {
        this.messageDevice('fat', value, time)
    }
    
    /**
     * Mutate the synth fatness
     * @param value - 0 is not fat, 1 is max fat
     */
    _fat(value: number = 0, time: number): void {
        this.messageDevice('_fat', value, time)
    }
    
    /**
     * Portamento time
     * @param value - portamento time in ms
     */
    slide(value: number = 10, time: number): void {
        this.messageDevice('slide', value, time)
    }

    /**
     * LFO rate
     * @param value - LFO rate in Hz
     */
    lforate(value: number = 1, time: number): void {
        this.messageDevice('lforate', value, time)
    }

    /**
     * Mutate the LFO rate
     * @param value - LFO rate in Hz
     */
    _lforate(value: number = 1, time: number): void {
        this.messageDevice('_lforate', value, time)
    }
    
    /**
     * LFO depth
     * @param value - LFO depth, 0 to 1
     */
    lfodepth(value: number = 0, time: number): void {
        this.messageDevice('lfodepth', value, time)
    }
    
    /**
     * Mutate the LFO depth
     * @param value - LFO depth, 0 to 1
     */
    _lfodepth(value: number = 0, time: number): void {
        this.messageDevice('_lfodepth', value, time)
    }
}

export default SubSynth
