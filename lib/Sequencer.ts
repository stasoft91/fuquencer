import type {Ref, ShallowRef} from 'vue'
import {ref, shallowRef, triggerRef} from 'vue'
import * as Tone from 'tone/Tone'
import {SoundEngine, TrackTypes} from '~/lib/SoundEngine'
import {Track} from "~/lib/Track";
import {getBarsBeatsSixteensFromStep} from "~/lib/utils/getBarsBeatsSixteensFromStep";
import {KeyboardManager} from "~/lib/KeyboardManager";
import {stepsToLoopLength} from "~/lib/utils/stepsToLoopLength";
import type {LFO} from "~/lib/LFO";
import AbstractSource from "~/lib/AbstractSource";

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
  duration: string,
  modifiers: Map<GridCellModifierTypes, GridCellModifier>
  column: number
  row: number
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
  
  private _lfos: ShallowRef<LFO[]> = shallowRef([]);

  constructor(sequenceLength: number = 16) {
    this._sequenceGrid = ref(this.generateGrid())
    this._sequenceLength = sequenceLength
  }

  public async initTracksDemo(): Promise<void> {
    this.soundEngine.clearTracks()
    
    for (let i = 0; i < SAMPLES.length; i++) {
      const abstractSourceSampler = new AbstractSource({
        sampler: {
          volume: -6,
          urls: {
            [DEFAULT_NOTE]: SAMPLES[i]
          },
          release: 1,
          baseUrl: '/samples/',
        }
      })
      
      console.log('abstractSourceSampler', SAMPLES[i])
      
      await abstractSourceSampler.init();

      this.soundEngine.addTrack(
        new Track({
          name: SAMPLES[i],
          volume: -6,
          source: abstractSourceSampler,
          type: TrackTypes.sample
        })
      ).meta.set('urls', {
        [DEFAULT_NOTE]: 'samples/' + SAMPLES[i]
      })
    }
    
    const abstractSourceSynth = new AbstractSource({
      synth: {
        oscillator: {
          type: 'pulse'
        },
        envelope: {
          attack: 0.01,
          decay: 0.42,
          sustain: 0.01,
          release: 0.25
        },
        filterEnvelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0.5,
        },
        volume: -6
      }
    })
    
    await abstractSourceSynth.init();

    this.soundEngine.addTrack(new Track({
      volume: -6,
      name: 'Bass',
      source: abstractSourceSynth,
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

  public generateGrid(): GridCell[] {
    this.initGrid()
    return this._sequenceGrid.value
  }

  public advanceStep(): void {
    this.currentStep = this.currentStep === this._sequenceLength ? 1 : this.currentStep + 1
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
        this._sequenceGrid.value.push(new GridCell({
          row: i,
          column: j,
          note: DEFAULT_NOTE,
          velocity: 0,
          duration: '16n',
          modifiers: new Map()
        }))
      }
    }
  }

  public writeCell(cell: GridCell): void {
    const cellIndex = this.getCellIndex(cell.row, cell.column)
    this._sequenceGrid.value[cellIndex] = cell
    
    if (this._parts[cell.row - 1]) {
      this._parts[cell.row - 1].at(getBarsBeatsSixteensFromStep(cell.column - 1), {
        note: cell.note,
        velocity: (cell.velocity ?? 0) / 100,
        duration: cell.duration,
        modifiers: cell.modifiers,
        column: cell.column,
        row: cell.row
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
  
  public get LFOs(): ShallowRef<LFO[]> {
    return this._lfos
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
      
      // Math.random() > 0.65 ?
      //   cell.modifiers.set(GridCellModifierTypes.probability, {type: GridCellModifierTypes.probability, probability: 75}) :
      //   cell.modifiers.delete(GridCellModifierTypes.probability)
      
      // Math.random() > 0.85 ?
      //   cell.modifiers.set(GridCellModifierTypes.skip, {type: GridCellModifierTypes.skip, skip: Math.floor(Math.random() * 3) + 2}) :
      //   cell.modifiers.delete(GridCellModifierTypes.skip)
      
      // Math.random() > 0.65 ?
      //   cell.modifiers.set(GridCellModifierTypes.swing, {type: GridCellModifierTypes.swing, swing: 25}) :
      //   cell.modifiers.delete(GridCellModifierTypes.swing)
      
      // Math.random() > 0.65 ?
      //   cell.modifiers.set(GridCellModifierTypes.flam, {type: GridCellModifierTypes.flam, roll: Math.floor(Math.random() * 3) + 2}) :
      //   cell.modifiers.delete(GridCellModifierTypes.flam)
      
      Math.random() > 0.65 ?
        cell.modifiers.set(GridCellModifierTypes.slide, {type: GridCellModifierTypes.slide, slide: 120}) :
        cell.modifiers.delete(GridCellModifierTypes.slide)
      
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
  
  public async play() {
    // TODO: this is a hack to make sure the instruments are loaded before playing, should be done better
    if (this.soundEngine.tracks.length === 0) {
      await this.initTracksDemo()
    }

    Tone.Transport.bpm.value = 120
    
    this.currentStep = 1
    
    for (let i = 0; i < this.soundEngine.tracks.length; i++) {
      const part = new Tone.Part(
        ((time, value: PartEvent) => {
          const track = this.soundEngine.tracks[i]
          
          if (value.velocity === 0) {
            return
          }
          
          // TODO Why do we suppose the very first channel to always be (only) sidechain source (kick)?..
          if (i === 0 && !track.meta.get('mute')) {
            track.sidechainEnvelope?.triggerAttackRelease(value.duration, time)
          }
          
          new Promise(() => console.log('PART', i, value.note, value.velocity, value.duration, time, Tone.Time(time).toBarsBeatsSixteenths(), value.modifiers))
          
          if (value.modifiers.has(GridCellModifierTypes.probability)) {
            const probabilityParams = value.modifiers.get(GridCellModifierTypes.probability) as ProbabilityParams
            
            if (Math.random() * 100 > probabilityParams.probability) {
              return
            }
          }
          
          if (value.modifiers.has(GridCellModifierTypes.skip)) {
            const skipParams = value.modifiers.get(GridCellModifierTypes.skip) as SkipParams
            
            this.readCell(value.row, value.column).modifiers.set(GridCellModifierTypes.skip, {
              type: GridCellModifierTypes.skip,
              skip: skipParams.skip,
              timesTriggered: skipParams.timesTriggered ? skipParams.timesTriggered + 1 : 1,
            })
            
            const skipParamsForCell = this.readCell(value.row, value.column).modifiers.get(GridCellModifierTypes.skip) as SkipParams
            
            if (skipParamsForCell.timesTriggered && skipParamsForCell.timesTriggered % skipParams.skip !== 0) {
              return
            } else {
              value.modifiers.set(GridCellModifierTypes.skip, {
                type: GridCellModifierTypes.skip,
                skip: skipParams.skip,
                timesTriggered: 0,
              })
            }
          }
          
          if (value.modifiers.has(GridCellModifierTypes.swing)) {
            const swingParams = value.modifiers.get(GridCellModifierTypes.swing) as SwingParams
            
            time = Tone.Time(time).quantize("8n", swingParams.swing / 100)
          }
          
          if (value.modifiers.has(GridCellModifierTypes.slide)) {
            const slideParams = value.modifiers.get(GridCellModifierTypes.slide) as SlideParams
            
            if ('portamento' in track.source) {
              if (slideParams.slide) {
                track.source.set({portamento: slideParams.slide / 1000})
              } else {
                track.source.set({portamento: 0})
              }
            }
          }
          
          if (value.modifiers.has(GridCellModifierTypes.flam)) {
            const flamParams = value.modifiers.get(GridCellModifierTypes.flam) as FlamParams
            
            const timeOfOneFullNote = Tone.Time(value.duration).toSeconds()
            const timeOfOneFlamNote = timeOfOneFullNote / flamParams.roll
            
            for (let i = 0; i < flamParams.roll; i++) {
              if (track.source.releaseAll) {
                track.source.releaseAll(time)
              }
              
              let velocity = flamParams.velocity ?? (value.velocity)
              
              if (flamParams.increaseVelocityFrom) {
                velocity = flamParams.increaseVelocityFrom + (velocity - flamParams.increaseVelocityFrom) * (i / flamParams.roll)
              }
              
              track.source.triggerAttackRelease(
                value.note,
                value.duration,
                time,
                velocity
              )
              time += timeOfOneFlamNote
              
            }
            
            return
          }
          
          track.source
            // .releaseAll(time)
            .triggerAttackRelease(value.note, value.duration, time, value.velocity);
        }),
        [
          ...this._sequenceGrid.value.filter(_ => ((_.row === i + 1) && (_.velocity > 0))).map(_ => {
            const step = _.column - 1
            
            return {
              time: getBarsBeatsSixteensFromStep(step),
              note: _.note,
              velocity: _.velocity / 100,
              duration: _.duration,
              modifiers: _.modifiers,
              column: _.column,
              row: _.row
            } as PartEvent
          })
        ]
      ).start(0).set({
        loop: true,
        loopStart: 0,
        loopEnd: stepsToLoopLength(this.soundEngine.tracks[i].length),
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
    
    Tone.Transport.start()
    
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
  
  public addLFO(lfo: LFO): void {
    this._lfos.value.push(lfo)
    triggerRef(this._lfos)
  }
  
  public removeLFO(lfo: LFO): void {
    const index = this._lfos.value.findIndex(_lfo => _lfo === lfo)
    
    if (index === -1) {
      return
    }
    
    this._lfos.value.splice(index, 1)
    triggerRef(this._lfos)
  }
}

export interface GridCellOptions {
  id: string
  note: string
  velocity: number
  row: number
  column: number
  duration: string
  modifiers: Map<GridCellModifierTypes, GridCellModifier>
}

export enum GridCellModifierTypes {
  swing = 'swing',
  flam = 'flam', // number of times the note is repeated
  probability = 'probability', // probability of the note being played
  skip = 'skip',
  slide = 'slide', // portamento of monophonic
  
  // reverse = 'reverse', // TODO: research if possible
  // arpeggiator = 'arpeggiator', // TODO: research if possible
  // instrumentSpecific = 'instrumentSpecific' //TODO: research if possible
}

export type GridCellModifier = SwingParams | FlamParams | ProbabilityParams | SkipParams | SlideParams

export type SwingParams = {
  type: GridCellModifierTypes.swing
  
  /**
   * Amount of swing (0-100)
   */
  swing: number
}

export type FlamParams = {
  type: GridCellModifierTypes.flam
  
  /**
   * Number of times the note is repeated (1-8)
   */
  roll: number
  
  /**
   * Velocity of the repeated notes (0-1)
   */
  velocity?: number
  
  /**
   * will make flam increase velocity of repeated notes from increaseVelocityFrom to velocity
   * (0-1)
   */
  increaseVelocityFrom?: number
}

export type ProbabilityParams = {
  type: GridCellModifierTypes.probability
  
  /**
   * Probability of the note being played (0-100)
   */
  probability: number
}

export type SkipParams = {
  type: GridCellModifierTypes.skip
  
  /**
   * How often the step is actually triggered
   * - 1 = every time
   * - 2 = every other time
   * - 3 = every third time
   * - etc.
   *
   * (1-16)
   */
  skip: number
  
  /**
   * Times the step was poked since the last actual trigger
   */
  timesTriggered?: number
}

export type SlideParams = {
  type: GridCellModifierTypes.slide
  
  /**
   * Portamento (in milliseconds)
   */
  slide: number
}

export class GridCell implements GridCellOptions {
  public note: string = ''
  public velocity: number = 0
  public row: number = 0
  public column: number = 0
  public duration: string = '16n'
  public modifiers: Map<GridCellModifierTypes, GridCellModifier> = new Map()
  
  constructor(params: Partial<GridCell>) {
    const {note, velocity, row, column, duration} = params
    
    if (!row || !column) {
      throw new Error('GridCell: row and column are required')
    }
    
    this.note = note ?? ''
    this.velocity = velocity ?? 0
    this.row = row
    this.column = column
    this.duration = duration ?? '16n'
    this.modifiers = params.modifiers ?? new Map()
  }
  
  public get id(): string {
    return `${this.row}-${this.column}`
  }
  
  public set id(id: string) {
    const [row, column] = id.split('-')
    
    this.row = parseInt(row)
    this.column = parseInt(column)
  }
}
