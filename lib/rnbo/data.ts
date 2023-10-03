// TODO: check types and ranges
// Types are used to generate docs rather than to type variables

import BaseSynth from "~/lib/rnbo/BaseSynth";
import Sampler from "~/lib/rnbo/Sampler";
import Granular from "~/lib/rnbo/Granular";
import {AcidSynth} from "~/lib/rnbo/AcidSynth";
import SubSynth from "~/lib/rnbo/SubSynth";
import Additive from "~/lib/rnbo/Additive";
import DroneSynth from "~/lib/rnbo/DroneSynth";
import FXChain from "~/lib/rnbo/FXChain";
import Synth from "~/lib/rnbo/Synth";

/**
 * Synth types
 */
export type VoiceType =
    'synth' |
    'sampler' |
    'granular' |
    'additive' |
    'acid' |
    'sub' |
    'drone' |
    'fx'

export const voiceTypesAsStrings: VoiceType[] = ['synth', 'sampler', 'granular', 'additive', 'acid', 'sub', 'drone', 'sampler']

/**
 * FX Parameters
 * @param {number} dist - `dist`: distortion amount (0 - 1)
 * @param {number} drive - `drive`: drive amount (0 - 1)
 * @param {number} ring - `ring`: ring modulator amount (0 - 1)
 * @param {number} ringf - `ringf`: ring modulator frequency
 * @param {number} ringspread - `ringspread`: ring modulator spread (0 - 1)
 * @param {number} ringmode - `ringmode`: ring modulator mode (0 or 1)
 * @param {number} chorus - `chorus`: chorus amount (0 - 1)
 * @param {number} chdepth - `chdepth`: chorus depth (0 - 1)
 * @param {number} chlfo - `chlfo`: chorus LFO rate (Hz)
 * @param {number} chspread - `chspread`: chorus spread (0 - 1)
 * @param {number} hicut - `hicut`: high cut amount (0 - 1)
 * @param {number} locut - `locut`: low cut amount (0 - 1)
 * @param {number} delay - `delay`: delay amount (0 - 1)
 * @param {number} dtime - `dtime`: delay time (ms)
 * @param {number} dfb - `dfb`: delay feedback (0 - 1)
 * @param {number} dspread - `dspread`: delay spread (0 - 1)
 * @param {number} dcolour - `dcolour`: delay colour (0 - 1)
 * @param {number} dfilter - `dfilter`: delay filter (0 - 1)
 * @param {number} reverb - `reverb`: reverb amount (0 - 1)
 * @param {number} rsize - `rsize`: reverb size (0 - 1)
 * @param {number} rdamp - `rdamp`: reverb damping (0 - 1)
 * @param {number} rdiff - `rdiff`: reverb diffusion (0 - 1)
 * @param {number} rjitter - `rjitter`: reverb jitter (0 - 1)
 * @param {number} rdecay - `rdecay`: reverb decay (0 - 1)
 * @param {number} lthresh - `lthresh`: limiter threshold (0 - 1)
 * @param {number} gain - `gain`: gain amount (0 - 1)
 */
export const fxParams = [
    'dist', 'drive',
    'ring', 'ringf', 'ringspread', 'ringmode',
    'chorus', 'chdepth', 'chlfo', 'chspread',
    'hicut', 'locut',
    'delay', 'dtime', 'dfb', 'dspread', 'dcolour', 'dfilter',
    'reverb', 'rsize', 'rdamp', 'rdiff', 'rjitter', 'rdecay',
    'gain', 'lthresh'
]

export const baseSynthParams = [
    'dur', 'n', 'pan', 'amp', 'vol', 'hold',
    'a', 'd', 's', 'r', 'acurve', 'dcurve', 'rcurve',
    'moda', 'modd', 'mods', 'modr', 'modacurve', 'moddcurve', 'modrcurve',
    'fila', 'fild', 'fils', 'filr', 'filacurve', 'fildcurve', 'filrcurve',
    'res', 'cutoff', 'detune'
]

export const additiveParams = ['drift', 'pmuln', 'pmul', 'pdisp', 'pexp']

export const granularParams = ['i', 'snap', 'bank', 'grainrate', 'grainsize', 'grainslope', 'grainpan', 'rate', 'bpm', 'direction', 'begin', 'end', 'loop']

export const samplerParams = ['i', 'snap', 'bank', 'begin', 'end', 'loop', 'rate', 'bpm', 'oneshot', 'loopsize']

export const synthParams = ['osc', 'drift', 'harm', 'modi']

export const acidParams = ['osc', 'slide', 'fil', 'sub']

export const subParams = ['fat', 'slide', 'lforate', 'lfodepth']

export const droneParams = ['lforate', 'lfodepth', 'spread', 'offset', 'damp', 'dynamic', 'rand', 'slide', 'pitch']

export const getParameters = (type: VoiceType): string[] => {
    switch (type) {
        case 'synth':
            return baseSynthParams.concat(synthParams)
        case 'sampler':
            return baseSynthParams.concat(samplerParams)
        case 'granular':
            return baseSynthParams.concat(granularParams)
        case 'additive':
            return baseSynthParams.concat(additiveParams)
        case 'acid':
            return baseSynthParams.concat(acidParams)
        case 'sub':
            return baseSynthParams.concat(subParams)
        case 'fx':
            return fxParams
        default:
            return []
    }
}


export class SynthFactory {
    static create(type: VoiceType) {
        switch (type) {
            case 'synth':
                return new Synth()
            case 'sampler':
                return new Sampler(['./samples/amen.wav'])
            case 'granular':
                return new Granular(['./samples/amen.wav'])
            case 'additive':
                return new Additive()
            case 'acid':
                return new AcidSynth()
            case 'sub':
                return new SubSynth()
            case 'drone':
                return new DroneSynth()
            case 'fx':
                return new FXChain()
            default:
                return new BaseSynth()
        }
    }
}
