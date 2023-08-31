import type {Ref} from 'vue'
import {ref} from 'vue'
import * as Tone from 'tone/Tone'
import type {AudioSource} from '~/lib/SoundEngine'
import {SoundEngine, TrackTypes} from '~/lib/SoundEngine'
import {Track} from "~/lib/Track";
import {getBarsBeatsSixteensFromStep} from "~/lib/utils/getBarsBeatsSixteensFromStep";
import {KeyboardManager} from "~/lib/KeyboardManager";
import {stepsToLoopLength} from "~/lib/utils/stepsToLoopLength";

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

export type PartEvent = {
  time: any
  note: string,
  velocity: number,
  duration: string
}

export const AVAILABLE_NOTES = generateListOfAvailableNotes()

export class Sequencer {
  private static instance: Sequencer;
  
  public static getInstance(sequenceLength: number = 16): Sequencer {
    if (!Sequencer.instance) {
      Sequencer.instance = new Sequencer(sequenceLength);
    }
    
    return Sequencer.instance;
  }
  
  private readonly _bpm: Ref<number> = ref(120)
  
  private readonly _sequenceGrid: Ref<GridCell[]> = ref([])

  private readonly _sequenceLength: number = 16

  private _currentStep = ref(1)
  
  public readonly soundEngine: SoundEngine = SoundEngine.getInstance()
  
  public readonly keyboardManager: KeyboardManager = KeyboardManager.getInstance()
  
  private _mainLoop: Tone.Loop<any> | null = null;
  
  private _parts: Tone.Part<PartEvent>[] = []
  
  private _isPlaying: Ref<boolean> = ref(false)

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
      ).meta.set('urls', {
        [DEFAULT_NOTE]: 'samples/' + SAMPLES[i]
      })
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
    if (newValue > this._sequenceLength) {
      this._currentStep.value = 1
      return
    }
    
    this._currentStep.value = newValue
  }
  
  public get isPlaying(): boolean {
    return this._isPlaying.value
  }
  
  public set isPlaying(value: boolean) {
    this._isPlaying.value = value
  }

  static cell(row: number, column: number, params?: Partial<GridCell>): GridCell {
    return {
      note: '',
      velocity: 0,
      duration: '16n',

      ...params,

      id: `${row}-${column}`,
      row: row,
      column: column,
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

  public initGrid(): void {
    for (let i = 1; i <= this.soundEngine.tracksCount.value; i++) {
      for (let j = 1; j <=  this._sequenceLength; j++) {
        this._sequenceGrid.value.push({
          id: `${i}-${j}`,
          velocity: 0,
          row: i,
          column: j,
          note: DEFAULT_NOTE,
          duration: '16n'
        })
      }
    }
  }

  public writeCell(cell: GridCell): void {
    const cellIndex = this.getCellIndex(cell.row, cell.column)
    this._sequenceGrid.value[cellIndex] = Sequencer.cell(cell.row, cell.column, cell)
    
    if (this._parts[cell.row - 1]) {
      this._parts[cell.row - 1].at(getBarsBeatsSixteensFromStep(cell.column - 1), {
        note: cell.note,
        velocity: cell.velocity / 100,
        duration: cell.duration
      } as PartEvent)
    }
  }

  public stop() {
    this._parts.forEach((part) => part.cancel().stop().dispose())
    this._parts = []
    Tone.Transport.stop()
    this._mainLoop?.stop()
    
    this.soundEngine.tracks.forEach((track) => track.getLoops().value.forEach((loop) => loop.stop()))
    this._isPlaying.value = false;
  }
  
  // public playNotes(time: Tone.Unit.Time) {
  //   this.soundEngine.playStepData(time, this.readStep())
  // }
  
  public async play() {
    // TODO: this is a hack to make sure the instruments are loaded before playing, should be done better
    if (this.soundEngine.tracks.length === 0) {
      await this.initTracksDemo()
    }

    Tone.Transport.bpm.value = 120
    
    this.currentStep = 1
    
    for (let i = 0; i < this.soundEngine.tracks.length; i++) {
      const part = new Tone.Part(
        ((time, value) => {
          const track = this.soundEngine.tracks[i]
          
          if (value.velocity === 0) {
            return
          }
          
          // TODO Why do we suppose the very first channel to always be (only) sidechain source (kick)?..
          if (i === 0 && !track.meta.get('mute')) {
            track.sidechainEnvelope?.triggerAttackRelease(value.duration, time)
          }
          
          track.source.releaseAll(time).triggerAttackRelease(value.note, value.duration, time, value.velocity);
        }),
        [
          ...this._sequenceGrid.value.filter(_ => ((_.row === i + 1) && (_.velocity > 0))).map(_ => {
            const step = _.column - 1
            
            return {
              time: getBarsBeatsSixteensFromStep(step),
              note: _.note,
              velocity: _.velocity / 100,
              duration: _.duration
            }
          })
        ]
      ).start(0).set({
        loop: true,
        loopStart: 0,
        loopEnd: stepsToLoopLength(this.soundEngine.tracks[i].length)
      })
      
      this._parts.push(
        part
      )
    }
    
    this._mainLoop = new Tone.Loop((time) => {
      // triggered every eighth note.
      Tone.Draw.schedule(() => {
        this.currentStep++
      }, time);
    }, "16n").start(0);
    
    setTimeout(() => {
      Tone.Transport.start(undefined, '1:0:0')
    });
    
    this._isPlaying.value = true;
    
    //
    // this._mainLoop = Tone.Transport.scheduleRepeat((time) => {
    //   const step = getStepFromBarsBeatsSixteens(Tone.Transport.position as Tone.Unit.BarsBeatsSixteenths)
    //
    //   for (let i = 0; i < this.soundEngine.tracks.length; i++) {
    //     const cell = this._sequenceGrid.value.filter(_ => _.column === step)[i]
    //     this.soundEngine.tracks[i].source.releaseAll().triggerAttackRelease(
    //       cell.note,
    //       '8n',
    //       time,
    //       cell.velocity / 100
    //     )
    //   }
    //
    //   Tone.Draw.schedule(() => {
    //     this.currentStep++
    //   }, time);
    // }, '16n', 0)
    
    //
    // this._mainLoop = Tone.Transport.scheduleRepeat((time) => {
    //   console.log('NOTE',
    //     this.currentStep,
    //     Tone.Transport.position,
    //     getStepFromBarsBeatsSixteens(Tone.Time(time).toBarsBeatsSixteenths()),
    //     Tone.Time(time).toBarsBeatsSixteenths(),
    //     Tone.Time(Tone.Time('@1m').quantize('2m')).toBarsBeatsSixteenths()
    //   )
    //
    //   this.playNotes(time)
    //
    //   ++this.currentStep
    // }, this._sequenceLength + 'n')
    

    //
    //
    // const seq = new Tone.Sequence((time, note) => {
    //   this.soundEngine.tracks[4].source.triggerAttackRelease(note, 0.1, time);
    //   // synth.triggerAttackRelease(note, 0.1, time);
    //   // subdivisions are given as subarrays
    // }, ["C3", ["E3", "D3"], "G3", ["A3", "G3"], ["G3", "E3"]]).start(0);
  }
  
  public get bpm(): Ref<number> {
    return this._bpm
  }
  
  public set bpm(value: number) {
    this._bpm.value = value
    Tone.Transport.bpm.value = value
  }
  
  public regenerateSequence(trackNumber: number, notesInKey: string[]): void {
    this.sequenceGrid.value.filter(cell => cell.row === trackNumber).map(cell => {
      cell.velocity = cell.column % 2 === 1 ? 100 : 0;
      
      if (cell.column % 3 === 0 && Math.random() > 0.75) {
        cell.velocity = 100;
        this.writeCell(cell)
        
        return
      }
      
      if (cell.velocity === 100 && Math.random() > 0.65) {
        cell.velocity = 0;
        this.writeCell(cell)
        
        return
      }
      
      
      cell.note = notesInKey.sort(() => Math.random() - 0.5)[Math.floor(Math.random() * notesInKey.length)]
      
      this.writeCell(cell)
    })
  }
  
  public updatePartLength(trackNumber: number, length: number): void {
    if (!this._parts[trackNumber - 1]) {
      return
    }
    
    this._parts[trackNumber - 1].loopEnd = stepsToLoopLength(length)
  }
}

export interface GridCell {
  id: string
  note: string
  velocity: number
  row: number
  column: number
  duration: string
}
