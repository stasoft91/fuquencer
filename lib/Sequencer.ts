import {reactive, ref} from "vue";
import * as Tone from "tone";
import type {Time} from "tone/Tone/core/type/Units";

export const DEFAULT_NOTE_OCTAVE = 'C4';

export class Sequencer {
    private _sequenceGrid: GridCell[];
    private _sequenceLength: number = 16;
    private _instrumentsLength: number = 4;

    private _currentStep = ref(0);

    private _samplers: Map<string, Tone.Sampler> = new Map();

    constructor() {
        this._sequenceGrid = reactive(this.generateGrid());
    }

    public async initSamplers(): Promise<void> {
        await this.addSampler("kick.wav");
        await this.addSampler("clap.wav");
        await this.addSampler("hat1.wav");
        await this.addSampler("hat2.wav");
    }

    public addSampler(samplePath: string): Promise<Tone.Sampler> {
        return new Promise((resolve, reject) => {
            const _sampler = new Tone.Sampler({
                urls: {
                    [DEFAULT_NOTE_OCTAVE]: samplePath,
                },
                release: 1,
                baseUrl: "/samples/",
                onload: () => {
                    _sampler.toDestination();
                    this._samplers.set(samplePath, _sampler);
                    resolve(_sampler);
                },
                onerror: (err) => {
                    reject(err);
                }
            })
        });
    }
    public get sequenceGrid(): GridCell[] {
        return this._sequenceGrid;
    }

    public get currentStep(): number {
        return this._currentStep.value;
    }

    public set currentStep(newValue: number) {
        this._currentStep.value = newValue;
    }

    public generateGrid(): GridCell[] {
        let grid: GridCell[] = [];

        let i = 0;
        for (let j = 0; j < this._sequenceLength; j++) {
            grid.push({
                id: `${i+1}-${j+1}`,
                velocity: j % 4 === 0 ? 100 : 0,
                row: i + 1,
                column: j + 1,
                noteAndOctave: j % 4 === 0 ? DEFAULT_NOTE_OCTAVE : ''
            });
        }

        i = 1;
        for (let j = 0; j < this._sequenceLength; j++) {
            grid.push({
                id: `${i+1}-${j+1}`,
                velocity: (4+j) % 8 === 0 ? 100 : 0,
                row: i + 1,
                column: j + 1,
                noteAndOctave: (4+j) % 8 === 0 ? DEFAULT_NOTE_OCTAVE : ''
            });
        }

        i = 2;
        for (let j = 0; j < this._sequenceLength; j++) {
            grid.push({
                id: `${i+1}-${j+1}`,
                velocity: j % 2 === 0 ? 100 : 0,
                row: i + 1,
                column: j + 1,
                noteAndOctave: j % 2 === 0 ? DEFAULT_NOTE_OCTAVE : ''
            });
        }

        i = 3;
        for (let j = 0; j < this._sequenceLength; j++) {
            grid.push({
                id: `${i+1}-${j+1}`,
                velocity: (2+j) % 4 === 0 ? 100 : 0,
                row: i + 1,
                column: j + 1,
                noteAndOctave: (2+j) % 4 === 0 ? DEFAULT_NOTE_OCTAVE : ''
            });
        }

        return grid;
    }

    public advanceStep(): void {
        this.currentStep = this.currentStep === this._sequenceLength - 1 ? 0 : this.currentStep + 1;
    }
    
    public readStep(): GridCell[] {
        return this._sequenceGrid.filter(cell => cell.column === this.currentStep + 1);
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

        await this.initSamplers();

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
        this.currentStep = 0;
    };

    public playNotes (time: Time) {
        this.readStep().forEach(cell => {
            if (cell.velocity > 0 && cell.row === 1) {
                this._samplers.get('kick.wav')?.triggerAttack(cell.noteAndOctave, time, cell.velocity / 100)
            }
            if (cell.velocity > 0 && cell.row === 2) {
                this._samplers.get('clap.wav')?.triggerAttack(cell.noteAndOctave, time, cell.velocity / 100)
            }
            if (cell.velocity > 0 && cell.row === 3) {
                this._samplers.get('hat1.wav')?.triggerAttack(cell.noteAndOctave, time, cell.velocity / 100)
            }
            if (cell.velocity > 0 && cell.row === 4) {
                this._samplers.get('hat2.wav')?.triggerAttack(cell.noteAndOctave, time, cell.velocity / 100)
            }
        });
    };

    static cell(row: number, column: number, params: Partial<GridCell>): GridCell {
        return {
            noteAndOctave: '',
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
    noteAndOctave: string;
    velocity: number;
    row: number;
    column: number;
};