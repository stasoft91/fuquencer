import {MIDIEvent} from '@rnbo/js'
import RNBODevice from './RNBODevice'
import type {Dictionary} from '../typescript.types'


/**
 * The BaseSynth class contains methods shared by all instruments in the CT-Synths library.
 * It should not be instantiated directly.
 * @class
 * @extends RNBODevice
 */
class BaseSynth extends RNBODevice {

    static DEFAULTS = {
        dur: 0.1, n: 60, pan: 0.5, vol: 1, amp: 1, hold: 0,
        a: 10, d: 100, s: 0.8, r: 1000,
        moda: 10, modd: 100, mods: 0.8, modr: 1000,
        fila: 10, fild: 100, fils: 0.8, filr: 1000,
        res: 0, cutoff: 20000, detune: 0,
    }

    /** @hidden */
    defaults: Dictionary = BaseSynth.DEFAULTS

    /** @hidden */
    constructor() {
        super()
    }

    /**
     * Trigger a musical event with the given parameters, at the given time.
     * @param {Dictionary} params - parameters to set
     * @hidden
     */
    play(params: Dictionary = {}, time: number): void {
        if (!this.ready) return
        const ps = {...this.state.value, ...params}
        const {n, amp} = ps

        if (n === this.state.value.n) {
            // this.cut(time)
        }

        this.setParams(ps, time)

        const noteOnEvent = new MIDIEvent(time * 1000, 0, [144, (n || 60), amp * 127]);
        this.device.scheduleEvent(noteOnEvent);
    }

    /**
     * Release any events playing at the given note
     * @param {number} n - midi note number
     * @hidden
     */
    release(n: number, time: number): void {
        if (!this.ready) return

        const noteOffEvent = new MIDIEvent((time * 1000), 0, [128, n, 0]);
        this.device.scheduleEvent(noteOffEvent)
    }

    /**
     * Cut all events playing at the given time
     * @param {number} ms - time in ms taken to release events
     * @example
     * // when used in Zen, supply a list of streams to cut
     * s0.set({cut: [0,1]}) // cuts itself and s1
     */
    cut(time: number, ms: number = 5): void {
        if (!this.ready) return
        this.messageDevice('cut', ms, time)
    }

    set(params: Dictionary = {}, time: number): void {
        this.setParams(params, time)
    }
}

export default BaseSynth
