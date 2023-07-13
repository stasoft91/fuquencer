import {reactive, ref} from "vue";
import * as Tone from "tone";
import type {Time} from "tone/Tone/core/type/Units";

export const DEFAULT_NOTE = 'C4';

export const SAMPLES = [
    'kick.wav',
    'clap.wav',
    'hat1.wav',
    'hat2.wav',
]

export function generateListOfAvailableNotes(): string[] {
    const notes :string[] = [];
    const octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A','A#', 'B'];

    octaves.forEach(octave => {
        noteNames.forEach(noteName => {
            notes.push(`${noteName}${octave}`);
        });
    });

    return notes;
}

export const AVAILABLE_NOTES = generateListOfAvailableNotes();

export type AudioSource = Tone.Sampler | Tone.MonoSynth;

export class Sequencer {
    private readonly _sequenceGrid: GridCell[];
    private _sequenceLength: number = 16;
    private _instrumentsLength = ref(0);

    private _currentStep = ref(1);

    private _instruments: Map<string, AudioSource> = new Map();

    constructor() {
        this._sequenceGrid = reactive(this.generateGrid());
    }

    public async initInstruments(): Promise<void> {
        this._instrumentsLength.value = 0;
        this._instruments.clear();
        
        for (let i = 0; i < SAMPLES.length; i++) {
            await this.addSampler(SAMPLES[i]);
        }
        
        this.addInstrument('synth');
    }

    public get instruments(): Map<string, AudioSource> {
        return this._instruments;
    }

    public get sequenceGrid(): GridCell[] {
        return this._sequenceGrid;
    }

    public get currentStep(): number {
        return this._currentStep.value;
    }

    public get instrumentsLength(): number {
        return this._instrumentsLength.value;
    }

    public set currentStep(newValue: number) {
        this._currentStep.value = newValue;
    }

    public addSampler(samplePath: string): Promise<Tone.Sampler> {
        return new Promise((resolve, reject) => {
            const _sampler = new Tone.Sampler({
                urls: {
                    [DEFAULT_NOTE]: samplePath,
                },
                release: 1,
                baseUrl: "/samples/",
                onload: () => {
                    _sampler.toDestination();
                    this._instruments.set(samplePath, _sampler);
                    this._instrumentsLength.value ++;
                    resolve(_sampler);
                },
                onerror: (err) => {
                    reject(err);
                }
            })
        });
    }

    public addInstrument(name: string): Tone.MonoSynth {
        const instrument = new Tone.MonoSynth({
            oscillator: {
                type: "pwm"
            },
            envelope: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.02
            },
        }).toDestination();
        
        this._instruments.set(name, instrument);
        this._instrumentsLength.value ++;
        return instrument;
    }

    public initGrid(): void {
        const length = this.instruments.size * this._sequenceLength;
        for (let i = 0; i < length; i++) {
            this._sequenceGrid.push({
                id: `${i}`,
                velocity: 0,
                row: i % this.instruments.size,
                column: i % this._sequenceLength,
                note: ''
            });
        }
    }
    
    public generateGrid(): GridCell[] {
        this.initGrid();

        let grid: GridCell[] = [{"id":"1-1","velocity":100,"row":1,"column":1,"note":"C4"},{"id":"1-2","velocity":0,"row":1,"column":2,"note":""},{"id":"1-3","velocity":0,"row":1,"column":3,"note":""},{"id":"1-4","velocity":0,"row":1,"column":4,"note":""},{"id":"1-5","velocity":100,"row":1,"column":5,"note":"C4"},{"id":"1-6","velocity":0,"row":1,"column":6,"note":""},{"id":"1-7","velocity":0,"row":1,"column":7,"note":""},{"id":"1-8","velocity":0,"row":1,"column":8,"note":""},{"id":"1-9","velocity":100,"row":1,"column":9,"note":"C4"},{"id":"1-10","velocity":0,"row":1,"column":10,"note":""},{"id":"1-11","velocity":0,"row":1,"column":11,"note":""},{"id":"1-12","velocity":0,"row":1,"column":12,"note":""},{"id":"1-13","velocity":100,"row":1,"column":13,"note":"C4"},{"id":"1-14","velocity":0,"row":1,"column":14,"note":""},{"id":"1-15","velocity":0,"row":1,"column":15,"note":""},{"id":"1-16","velocity":0,"row":1,"column":16,"note":""},{"id":"2-1","velocity":0,"row":2,"column":1,"note":""},{"id":"2-2","velocity":0,"row":2,"column":2,"note":""},{"id":"2-3","velocity":0,"row":2,"column":3,"note":""},{"id":"2-4","velocity":0,"row":2,"column":4,"note":""},{"id":"2-5","velocity":100,"row":2,"column":5,"note":"C4"},{"id":"2-6","velocity":0,"row":2,"column":6,"note":""},{"id":"2-7","velocity":0,"row":2,"column":7,"note":""},{"id":"2-8","velocity":0,"row":2,"column":8,"note":""},{"id":"2-9","velocity":0,"row":2,"column":9,"note":""},{"id":"2-10","velocity":0,"row":2,"column":10,"note":""},{"id":"2-11","velocity":0,"row":2,"column":11,"note":""},{"id":"2-12","velocity":0,"row":2,"column":12,"note":""},{"id":"2-13","velocity":100,"row":2,"column":13,"note":"C4"},{"id":"2-14","velocity":0,"row":2,"column":14,"note":""},{"id":"2-15","velocity":0,"row":2,"column":15,"note":""},{"id":"2-16","velocity":0,"row":2,"column":16,"note":""},{"note":"C4","velocity":30,"id":"3-1","row":3,"column":1},{"note":"C4","velocity":70,"id":"3-2","row":3,"column":2},{"note":"C4","velocity":50,"id":"3-3","row":3,"column":3},{"note":"C4","velocity":60,"id":"3-4","row":3,"column":4},{"note":"C4","velocity":30,"id":"3-5","row":3,"column":5},{"note":"C4","velocity":60,"id":"3-6","row":3,"column":6},{"note":"C4","velocity":50,"id":"3-7","row":3,"column":7},{"note":"C4","velocity":70,"id":"3-8","row":3,"column":8},{"note":"C4","velocity":30,"id":"3-9","row":3,"column":9},{"note":"C4","velocity":70,"id":"3-10","row":3,"column":10},{"note":"C4","velocity":70,"id":"3-11","row":3,"column":11},{"note":"C4","velocity":70,"id":"3-12","row":3,"column":12},{"note":"C4","velocity":30,"id":"3-13","row":3,"column":13},{"note":"C4","velocity":80,"id":"3-14","row":3,"column":14},{"note":"C4","velocity":50,"id":"3-15","row":3,"column":15},{"note":"C4","velocity":70,"id":"3-16","row":3,"column":16},{"id":"4-1","velocity":0,"row":4,"column":1,"note":""},{"id":"4-2","velocity":0,"row":4,"column":2,"note":""},{"id":"4-3","velocity":100,"row":4,"column":3,"note":"C4"},{"id":"4-4","velocity":0,"row":4,"column":4,"note":""},{"id":"4-5","velocity":0,"row":4,"column":5,"note":""},{"id":"4-6","velocity":0,"row":4,"column":6,"note":""},{"id":"4-7","velocity":100,"row":4,"column":7,"note":"C4"},{"id":"4-8","velocity":0,"row":4,"column":8,"note":""},{"id":"4-9","velocity":0,"row":4,"column":9,"note":""},{"id":"4-10","velocity":0,"row":4,"column":10,"note":""},{"id":"4-11","velocity":100,"row":4,"column":11,"note":"C4"},{"id":"4-12","velocity":0,"row":4,"column":12,"note":""},{"id":"4-13","velocity":0,"row":4,"column":13,"note":""},{"id":"4-14","velocity":0,"row":4,"column":14,"note":""},{"id":"4-15","velocity":100,"row":4,"column":15,"note":"C4"},{"id":"4-16","velocity":0,"row":4,"column":16,"note":""},{"id":"5-1","velocity":0,"row":5,"column":1,"note":""},{"note":"C1","velocity":50,"id":"5-2","row":5,"column":2},{"note":"C1","velocity":90,"id":"5-3","row":5,"column":3},{"id":"5-4","velocity":0,"row":5,"column":4,"note":""},{"note":"C1","velocity":40,"id":"5-5","row":5,"column":5},{"id":"5-6","velocity":0,"row":5,"column":6,"note":""},{"note":"C1","velocity":60,"id":"5-7","row":5,"column":7},{"id":"5-8","velocity":0,"row":5,"column":8,"note":""},{"note":"C1","velocity":50,"id":"5-9","row":5,"column":9},{"note":"C4","velocity":0,"id":"5-10","row":5,"column":10},{"note":"C1","velocity":70,"id":"5-11","row":5,"column":11},{"id":"5-12","velocity":0,"row":5,"column":12,"note":""},{"note":"C4","velocity":0,"id":"5-13","row":5,"column":13},{"note":"C1","velocity":60,"id":"5-14","row":5,"column":14},{"note":"C4","velocity":0,"id":"5-15","row":5,"column":15},{"id":"5-16","velocity":0,"row":5,"column":16,"note":""}]

        if (grid.length < this.instruments.size * this._sequenceLength) {
            this.initGrid();
            
            return this._sequenceGrid;
        }
        return grid;
    }

    public advanceStep(): void {
        this.currentStep = this.currentStep === this._sequenceLength ? 1 : this.currentStep + 1;
    }
    
    public readStep(): GridCell[] {
        return this._sequenceGrid.filter(cell => cell.column === this.currentStep);
    }
    
    public getCellIndex(row: number, column: number): number {
        return this._sequenceGrid.findIndex(gridCell => gridCell.id === `${row}-${column}`);
    }

    public readCell(row: number, column: number): GridCell {
        const cellIndex = this.getCellIndex(row, column)
        return this._sequenceGrid[cellIndex];
    }

    public writeCell(cell: GridCell): void {
        const cellIndex = this.getCellIndex(cell.row, cell.column)
        this._sequenceGrid[cellIndex] = Sequencer.cell(cell.row, cell.column, cell)
    }

    public async play () {
        await Tone.start();

        await this.initInstruments();

        Tone.Transport.bpm.value = 120;

        Tone.Transport.scheduleRepeat((time) => {
            this.playNotes(time);

            this.advanceStep();

        }, this._sequenceLength + "n");

        Tone.Transport.start();
    };

    public stop () {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        Tone.Transport.position = 0;
        this.currentStep = 1;
    };

    public playNotes (time: Time) {
        this.readStep().forEach(cell => {
            if (cell.velocity > 0 && cell.row === 1) {
                this._instruments.get('kick.wav')?.triggerAttack(cell.note, time, cell.velocity / 100)
            }
            if (cell.velocity > 0 && cell.row === 2) {
                this._instruments.get('clap.wav')?.triggerAttack(cell.note, time, cell.velocity / 100);
            }
            if (cell.velocity > 0 && cell.row === 3) {
                this._instruments.get('hat1.wav')?.triggerAttack(cell.note, time, cell.velocity / 100);
            }
            if (cell.velocity > 0 && cell.row === 4) {
                this._instruments.get('hat2.wav')?.triggerAttack(cell.note, time, cell.velocity / 100);
            }
            if (cell.velocity > 0 && cell.row === 5) {
                this._instruments.get('synth')?.triggerAttackRelease(cell.note, '16n', time, cell.velocity / 100);
            }
        });
    };

    static cell(row: number, column: number, params: Partial<GridCell>): GridCell {
        return {
            note: '',
            velocity: 0,

            ...params,

            id: `${row}-${column}`,
            row: row,
            column: column,
        }
    }
}

export interface GridCell {
    id: string;
    note: string;
    velocity: number;
    row: number;
    column: number;
}