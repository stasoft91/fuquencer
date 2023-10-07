import * as Tone from 'tone/Tone';
import {SmplrSource} from "~/lib/sources/SmplrSource";
import {DrumMachine, type DrumMachineOptions} from "~/modules/tonejs-smplr/src";
import {DEFAULT_NOTE} from "~/lib/Sequencer";

export class SmplrDrumSource extends SmplrSource {
    declare options: DrumMachineOptions
    public drumMap: Map<Tone.Unit.Frequency, string> = new Map();
    // @ts-ignore we are indeed overriding the shit out of it
    protected _voice: DrumMachine
    
    // it gets incapsulated in the SmplrSource class, no need to uncomment it
    // AVAILABLE_SETTINGS: string[] = ['lpfCutoffHz', 'decayTime', 'playbackRate', 'reverse']
    private output: Tone.Gain = new Tone.Gain();
    
    constructor(options: DrumMachineOptions) {
        super(options, true)
        this.options = options
    }
    
    public async init(): Promise<void> {
        this._voice = new DrumMachine({
            ...this.options,
            destination: this.output
        });
        
        await this._voice.load
        
        this.initDrumMap()
        
        this._isInitialized = true;
    }
    
    /**
     * Parent SmplrSource would try to call drum sounds by their note,
     * DrumMachine though uses a sound name instead
     *
     * @param note
     */
    public convertNoteToDrum(note: Tone.Unit.Frequency): string | undefined {
        return this.drumMap.get(note)
    }
    
    private initDrumMap(): void {
        this._voice.sampleNames.forEach((name, index) => {
            this.drumMap.set(Tone.Frequency(DEFAULT_NOTE).transpose(index).toMidi(), name)
        });
    }
}
