import type {Ref} from 'vue'
import {ref} from 'vue'
import * as Tone from 'tone/Tone'
import type {AudioSource} from '~/lib/SoundEngine'
import {SoundEngine, TrackTypes} from '~/lib/SoundEngine'
import {Track} from "~/lib/Track";

export const DEFAULT_NOTE = 'C4'

export const SAMPLES = ['kick.wav', 'clap.wav', 'hat1.wav', 'hat2.wav']

export function generateListOfAvailableNotes(): string[] {
  const notes: string[] = []
  const octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  octaves.forEach((octave) => {
    noteNames.forEach((noteName) => {
      notes.push(`${noteName}${octave}`)
    })
  })

  return notes
}

export const AVAILABLE_NOTES = generateListOfAvailableNotes()

export class Sequencer {
  private readonly _bpm: Ref<number> = ref(120)
  
  private readonly _sequenceGrid: Ref<GridCell[]> = ref([])

  private readonly _sequenceLength: number = 16

  private _currentStep = ref(1)
  
  public readonly soundEngine: SoundEngine = SoundEngine.getInstance()

  constructor(sequenceLength: number = 16) {
    this._sequenceGrid = ref(this.generateGrid())
    this._sequenceLength = sequenceLength
  }

  public async initTracksDemo(): Promise<void> {
    this.soundEngine.clearTracks()
    
    for (let i = 0; i < SAMPLES.length; i++) {
      this.soundEngine.addTrack(
        new Track({
          name: SAMPLES[i],
          volume: -6,
          source: (await SoundEngine.createSampler(SAMPLES[i])) as unknown as AudioSource,
          type: TrackTypes.sample
        })
      )
    }

    this.soundEngine.addTrack(new Track({
      volume: -6,
      name: 'Bass',
      source: SoundEngine.createInstrument() as unknown as AudioSource,
      type: TrackTypes.synth
    }))
  }
  
  public get sequenceLength(): number {
    return this._sequenceLength
  }

  public get sequenceGrid(): Ref<GridCell[]> {
    return this._sequenceGrid
  }

  public get currentStep(): number {
    return this._currentStep.value
  }

  public set currentStep(newValue: number) {
    this._currentStep.value = newValue
  }

  public initGrid(): void {
    for (let i = 1; i <= this.soundEngine.tracksCount.value; i++) {
      for (let j = 1; j <=  this._sequenceLength; j++) {
        this._sequenceGrid.value.push({
          id: `${i}-${j}`,
          velocity: 0,
          row: i,
          column: j,
          note: DEFAULT_NOTE
        })
      }
    }
  }

  public generateGrid(): GridCell[] {
    this.initGrid()
    return this._sequenceGrid.value
  }

  public advanceStep(): void {
    this.currentStep = this.currentStep === this._sequenceLength ? 1 : this.currentStep + 1
  }

  public readStep(): GridCell[] {
    return this._sequenceGrid.value.filter((cell) => cell.column === this.currentStep)
  }

  public getCellIndex(row: number, column: number): number {
    return this._sequenceGrid.value.findIndex((gridCell) => gridCell.id === `${row}-${column}`)
  }

  public readCell(row: number, column: number): GridCell {
    const cellIndex = this.getCellIndex(row, column)
    return this._sequenceGrid.value[cellIndex]
  }

  public writeCell(cell: GridCell): void {
    const cellIndex = this.getCellIndex(cell.row, cell.column)
    this._sequenceGrid.value[cellIndex] = Sequencer.cell(cell.row, cell.column, cell)
  }

  public async play() {
    await Tone.start()

    // TODO: this is a hack to make sure the instruments are loaded before playing, should be done better
    if (this.soundEngine.tracks.length === 0) {
      await this.initTracksDemo()
    }

    Tone.Transport.bpm.value = 120

    Tone.Transport.scheduleRepeat((time) => {
      this.playNotes(time)

      this.advanceStep()
    }, this._sequenceLength + 'n')
    
    // const loop = new Tone.Loop((time) => {
    //   // triggered every eighth note.
    //   this.soundEngine.tracks[2].source.triggerAttackRelease("C4", "8n", time);
    // }, "2n.").start(0);
    //
    //
    // const seq = new Tone.Sequence((time, note) => {
    //   this.soundEngine.tracks[4].source.triggerAttackRelease(note, 0.1, time);
    //   // synth.triggerAttackRelease(note, 0.1, time);
    //   // subdivisions are given as subarrays
    // }, ["C3", ["E3", "D3"], "G3", ["A3", "G3"], ["G3", "E3"]]).start(0);
    
    Tone.Transport.start()
  }

  public stop() {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    Tone.Transport.position = 0
    this.currentStep = 1
  }

  public playNotes(time: Tone.Unit.Time) {
    this.soundEngine.playStepData(time, this.readStep())
  }
  
  public get bpm(): Ref<number> {
    return this._bpm
  }
  
  public set bpm(value: number) {
    this._bpm.value = value
    Tone.Transport.bpm.value = value
  }

  static cell(row: number, column: number, params: Partial<GridCell>): GridCell {
    return {
      note: '',
      velocity: 0,

      ...params,

      id: `${row}-${column}`,
      row: row,
      column: column
    }
  }
}

export interface GridCell {
  id: string
  note: string
  velocity: number
  row: number
  column: number
}
