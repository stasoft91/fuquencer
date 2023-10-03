import BaseSynth from "./BaseSynth";
import type {Dictionary} from "../typescript.types";
import {getParameters} from "~/lib/rnbo/data";

/**
 * An all purpose synth with filters and FM
 * @example
 * s0.p.set({inst: 'synth'})
 */
class Synth extends BaseSynth {
    /** @hidden */
    defaults: Dictionary = {
        ...BaseSynth.DEFAULTS,
        osc: 1,
        drift: 0,
        modi: 0,
        harm: 1
    }

    /** @hidden */
    constructor(args: any = {}) {
        super()
        this.json = new URL('./json/synth.export.json', import.meta.url)

        this.parameters = getParameters('synth')
        console.log(this.defaults)
    }
}

export default Synth
