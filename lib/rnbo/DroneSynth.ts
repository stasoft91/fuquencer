import BaseSynth from "./BaseSynth";
import {getParameters} from "./data";

class DroneSynth extends BaseSynth {
    json = new URL('./json/drone.export.json', import.meta.url)
    defaults = {
        // ...this.defaults,
        vol: 1, amp: 1,
        lforate: 0.1, lfodepth: 0.1, spread: 1, offset: 0, damp: 0.5, dynamic: 0.5, rand: 1, slide: 100, pitch: 0.5,
        dur: 40000, a: 1000, d: 0, s: 1, r: 1000, res: 1, moda: 5000, modd: 5000
    }

    constructor() {
        super()
        this.parameters = getParameters('drone')
        this.initParams()
    }

}

export default DroneSynth
