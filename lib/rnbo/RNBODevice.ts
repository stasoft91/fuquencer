import * as Tone from 'tone/Tone';
import {context as toneContext, Gain, type ToneAudioNode} from 'tone/Tone';
import {dummy} from './utils';
import type {Device} from '@rnbo/js'
import {createDevice, MessageEvent} from '@rnbo/js'
import type {Dictionary} from '../typescript.types'
import type {Ref} from "vue";
import {ref} from "vue";

class RNBODevice {
    /** @hidden */
    input: Gain
    /** @hidden */
    output: Gain
    /** @hidden */
    device!: Device;
    /** @hidden */
    ready = false
    /** @hidden */
    json!: URL;
    /** @hidden */
        // @ts-ignore
    context: AudioContext = toneContext.rawContext._nativeAudioContext || toneContext.rawContext._context;
    /** @hidden */
    parameters: string[] = [];

    defaults: Dictionary = {}

    /** @hidden */
    state: Ref<Dictionary> = ref({})

    /** @hidden */
    constructor() {
        this.input = new Gain(1);
        this.output = new Gain(1);
        dummy.connect(this.output);
        dummy.connect(this.input);
    }

    /** @hidden */
    async initDevice() {
        const rawPatcher = await fetch(this.json);
        const patcher = await rawPatcher.json();

        this.device = await createDevice({context: this.context, patcher});
        // @ts-ignore
        this.device.node.connect(this.output._gainNode._nativeAudioNode);
        // @ts-ignore
        this.input._gainNode._nativeAudioNode.connect(this.device.node);

        this.initParams()

        this.ready = true
    }

    /** @hidden */
    initParams() {
        this.parameters.forEach(key => {
            if (this.state.value[key] === undefined) {
                this.state.value[key] = this.defaults[key]
            }
        })
    }

    /** @hidden */
    messageDevice(tag: string, payload: any, time: number) {
        const unsafeTime = (time * 1000) - (Tone.getContext().lookAhead * 1000)
        const safeTime = unsafeTime < 0 ? 0 : unsafeTime
        const message = new MessageEvent(safeTime, tag, [payload]);
        this.device.scheduleEvent(message);
    }

    /** @hidden */
    connect(node: ToneAudioNode) {
        this.disconnect()
        this.output.connect(node)
    }

    disconnect(node?: ToneAudioNode) {
        this.output.disconnect(node)
    }

    /** @hidden */
    setParams(params: Dictionary, time: number = 0) {
        Object.keys(params).forEach(key => {
            if (params[key] === undefined) {
                delete params[key]
            }
        })

        Object.keys(params)
            .filter(key => this.parameters.includes(key))
            .filter(key => params[key] !== undefined)
            .forEach((key) => {
                const value = params[key]
                // don't send messages for unchanged values, unless it's i, which is async and causes bugs
                if (key !== 'i' && this.state.value[key] === value || value === undefined) {
                    return
                }
                this.state.value[key] = value
                this.messageDevice(key, value || 0, time)
            })
    }

    /**
     * Mutate given parameters on currently playing events
     * @param {Dictionary} params - key value pairs of parameters to mutate
     * @param {number} time - time in seconds to schedule the mutation
     * @param {number} lag - time in ms that the mutation will take to complete
     * @returns {void}
     * @hidden
     */
    mutate(params: Dictionary = {}, time: number, lag: number = 100): void {
        if (!this.ready) return
        const ps = Object.entries(params).reduce((obj, [key, value]) => ({...obj, [`_${key}`]: value}), {})
        this.setParams(ps, time)
        this.messageDevice('mutate', lag, time)
    }

    chain(...args: ToneAudioNode[]): void {
        this.output.chain(...args);
    }

    /**
     * @DEPRECATED
     */
    dispose(): void {
        console.warn('dispose() not implemented')
    }
}

export default RNBODevice
