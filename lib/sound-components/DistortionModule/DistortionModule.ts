/**
 * COPIED FROM Razz21/vue-synth
 * ORIGINAL: https://github.com/Razz21/vue-synth
 * THIS FILE IS UNDER MIT LICENSE ACCORDING TO ORIGINAL AUTHOR
 */

import * as Tone from "tone/Tone";
import {Distortion, optionsFromArguments} from "tone/Tone";
import {DISTORTION_ALGORITHMS} from "./DistortionModule.utils";

export type DistortionModuleOptions = Tone.DistortionOptions & { type: string };
export default class DistortionModule extends Distortion {
  private _algorithmFn: Function | null = null;

  constructor(_: DistortionModuleOptions) {
    // eslint-disable-next-line prefer-rest-params
    super(optionsFromArguments(DistortionModule.getDefaults(), arguments));
    // eslint-disable-next-line prefer-rest-params
    const options = optionsFromArguments(DistortionModule.getDefaults(), arguments);
    this._algorithmFn = null;
    this.type = null;
    this.type = options.type;
  }
  
  private _type: string | null = null;
  
  get type() {
    return this._type;
  }
  
  set type(value) {
    if (!value || value === this._type) return;
    
    const fn = DistortionModule.getAlgorithm(value);
    if (!fn) return;
    this._type = value;
    this._algorithmFn = fn;
    this._setDistortionAlgorithm();
  }
  
  /**
   * The amount of distortion. Nominal range is between 0 and 1.
   */
  get distortion() {
    // @ts-ignore
    
    return this._distortion;
  }
  
  set distortion(amount) {
    if (this.type == undefined) return;
    // @ts-ignore
    
    this._distortion = amount;
    this._setDistortionAlgorithm();
  }
  
  static getDefaults() {
    return Object.assign(Distortion.getDefaults(), {
      type: Object.keys(DISTORTION_ALGORITHMS)[0]
    });
  }
  
  static getAlgorithm(idx: string) {
    return DISTORTION_ALGORITHMS[idx];
  }
  
  _setDistortionAlgorithm() {
    // @ts-ignore
    const fn = this._algorithmFn(this._distortion);
    // @ts-ignore
    this._shaper.setMap(fn);
  }
}
