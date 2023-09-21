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
import type {
  FlamParams,
  GridCellArpeggiator,
  GridCellModifier,
  ProbabilityParams,
  SkipParams,
  SlideParams,
  SwingParams
} from "~/lib/GridCell";
import {GridCell, GridCellModifierTypes} from "~/lib/GridCell";
import {createEuclideanRhythmVector, shiftVector} from "~/lib/utils/createEuclideanRhythmVector";
import {PatternGenerator} from "~/lib/PatternGenerator";
import {useGridEditor} from "@/stores/gridEditor";

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
  notes: string[],
  velocity: number,
  duration: string,
  modifiers: Map<GridCellModifierTypes, GridCellModifier>
  column: number
  row: number
  arpeggiator?: GridCellArpeggiator
}

export const AVAILABLE_NOTES = generateListOfAvailableNotes()

export class Sequencer {
  private static instance: Sequencer;
  
  private constructor(sequenceLength: number = 16) {
    this._sequenceGrid = ref(this.generateGrid())
    this._sequenceLength = sequenceLength
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
  
  public get bpm(): number {
    return this._bpm.value
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

  public static getInstance(sequenceLength: number = 16): Sequencer {
    if (!Sequencer.instance) {
      Sequencer.instance = new Sequencer(sequenceLength);
      Sequencer.instance.bpm = 120;
    }
    
    return Sequencer.instance;
  }

  public writeCell(cell: GridCell): void {
    const cellIndex = this.getCellIndex(cell.row, cell.column)
    this._sequenceGrid.value[cellIndex] = cell
    
    const gridEditor = useGridEditor()
    
    if (gridEditor.selectedGridCell?.id === cell.id) {
      useGridEditor().setSelectedGridCell(cell)
    }
    
    if (this._parts[cell.row - 1]) {
      this._parts[cell.row - 1].at(getBarsBeatsSixteensFromStep(cell.column - 1), {
        notes: cell.notes,
        velocity: (cell.velocity ?? 0) / 100,
        duration: cell.duration,
        modifiers: cell.modifiers,
        column: cell.column,
        row: cell.row,
        arpeggiator: cell.arpeggiator
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
  
  public get LFOs(): ShallowRef<LFO[]> {
    return this._lfos
  }
  
  public initGrid(): void {
    for (let i = 1; i <= this.soundEngine.tracksCount.value; i++) {
      for (let j = 1; j <=  this._sequenceLength; j++) {
        this._sequenceGrid.value.push(new GridCell({
          row: i,
          column: j,
          notes: [DEFAULT_NOTE],
          velocity: 0,
          duration: Tone.Time('16n') as Tone.Unit.Time,
          modifiers: new Map()
        }))
      }
    }
  }
  
  public set bpm(value: number) {
    this._bpm.value = value
    Tone.Transport.bpm.value = value
  }
  
  public regenerateSequence(trackNumber: number, notesInKey: string[]): void {
    this.sequenceGrid.value.filter(cell => cell.row === trackNumber).map(cell => {
      cell.velocity = cell.column % 2 === 1 ? 100 : 0;
      
      Math.random() > 0.65 ?
        cell.modifiers.set(GridCellModifierTypes.probability, {type: GridCellModifierTypes.probability, probability: 50}) :
        cell.modifiers.delete(GridCellModifierTypes.probability)
      
      Math.random() > 0.65 ?
        cell.modifiers.set(GridCellModifierTypes.skip, {type: GridCellModifierTypes.skip, skip: Math.floor(Math.random() * 3) + 2}) :
        cell.modifiers.delete(GridCellModifierTypes.skip)
      
      Math.random() > 0.85 ?
        cell.modifiers.set(GridCellModifierTypes.flam, {type: GridCellModifierTypes.flam, roll: Math.floor(Math.random() * 3) + 2}) :
        cell.modifiers.delete(GridCellModifierTypes.flam)
      
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
      
      cell.notes = [
        // get random note from notesInKey
        notesInKey.sort(() => Math.random() - 0.5) [Math.floor(Math.random() * notesInKey.length)]
      ]
      
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
    
    this.currentStep = 1
    
    for (let i = 0; i < this.soundEngine.tracks.length; i++) {
      const part = new Tone.Part(
        ((time, partEvent: PartEvent) => {
          const track = this.soundEngine.tracks[i]
          
          if (partEvent.velocity === 0) {
            return
          }
          
          // TODO Why do we suppose the very first channel to always be (only) sidechain source (kick)?..
          if (i === 0 && !track.meta.get('mute')) {
            track.sidechainEnvelope?.triggerAttackRelease(partEvent.duration, time)
          }
          
          new Promise(() => console.log('PART', i, partEvent.notes, partEvent.velocity, partEvent.duration, Tone.Time(time).toBarsBeatsSixteenths(), partEvent.modifiers, partEvent.arpeggiator))
          
          if (partEvent.modifiers.has(GridCellModifierTypes.probability)) {
            const probabilityParams = partEvent.modifiers.get(GridCellModifierTypes.probability) as ProbabilityParams
            
            if (Math.random() * 100 > probabilityParams.probability) {
              return
            }
          }
          
          if (partEvent.modifiers.has(GridCellModifierTypes.skip)) {
            const skipParams = partEvent.modifiers.get(GridCellModifierTypes.skip) as SkipParams
            
            this.readCell(partEvent.row, partEvent.column).modifiers.set(GridCellModifierTypes.skip, {
              type: GridCellModifierTypes.skip,
              skip: skipParams.skip,
              timesTriggered: skipParams.timesTriggered ? skipParams.timesTriggered + 1 : 1,
            })
            
            const skipParamsForCell = this.readCell(partEvent.row, partEvent.column).modifiers.get(GridCellModifierTypes.skip) as SkipParams
            
            if (skipParamsForCell.timesTriggered && skipParamsForCell.timesTriggered % skipParams.skip !== 0) {
              return
            } else {
              partEvent.modifiers.set(GridCellModifierTypes.skip, {
                type: GridCellModifierTypes.skip,
                skip: skipParams.skip,
                timesTriggered: 0,
              })
            }
          }
          
          if (partEvent.modifiers.has(GridCellModifierTypes.swing)) {
            const swingParams = partEvent.modifiers.get(GridCellModifierTypes.swing) as SwingParams
            
            time = Tone.Time(time).quantize(swingParams.subdivision, swingParams.swing / 100)
          }
          
          // Reset portamento
          track.source.set({portamento: 0})
          
          if (partEvent.modifiers.has(GridCellModifierTypes.slide)) {
            const slideParams = partEvent.modifiers.get(GridCellModifierTypes.slide) as SlideParams
            
            if (slideParams.slide) {
              track.source.set({portamento: slideParams.slide / 1000})
            } else {
              track.source.set({portamento: 0})
            }
          }
          
          if (partEvent.modifiers.has(GridCellModifierTypes.flam)) {
            const flamParams = partEvent.modifiers.get(GridCellModifierTypes.flam) as FlamParams
            
            const timeOfOneFullNote = Tone.Time(partEvent.duration).toSeconds()
            const timeOfOneFlamNote = timeOfOneFullNote / flamParams.roll
            
            for (let i = 0; i < flamParams.roll; i++) {
              track.source.releaseAll(time)
              
              let velocity = flamParams.velocity ?? (partEvent.velocity)
              
              if (flamParams.increaseVelocityFrom) {
                velocity = flamParams.increaseVelocityFrom + (velocity - flamParams.increaseVelocityFrom) * (i / flamParams.roll)
              }
              
              let note: string;
              if (partEvent.notes.length > 1) {
                // map roll count to note of pattern
                const noteIndex = Math.floor(i / flamParams.roll * partEvent.notes.length)
                note = partEvent.notes[noteIndex]
              } else {
                note = partEvent.notes[0]
              }
              
              track.source.triggerAttackRelease(
                note,
                partEvent.duration,
                time,
                velocity
              )
              time += timeOfOneFlamNote
              
            }
            
            return
          }
          
          // TODO should we decide part is an Arpeggiator only based on the Array passed in?
          if (partEvent.notes.length > 1 && partEvent.arpeggiator) {
            const {pulses, parts, shift, type, gate} = partEvent.arpeggiator
            
            const euclideanRhythmVector = createEuclideanRhythmVector(pulses, parts)
            
            const shiftedEuclideanRhythmVector = shiftVector(euclideanRhythmVector, shift)
            
            console.log(shift, euclideanRhythmVector, shiftedEuclideanRhythmVector)
            
            const timeOfOneRhythmPart = Tone.Time(partEvent.duration).toSeconds() / shiftedEuclideanRhythmVector.length
            
            let arpMicroTime = -timeOfOneRhythmPart
            
            const patternNoteIndex = PatternGenerator(partEvent.notes.length, type)
            
            shiftedEuclideanRhythmVector.forEach((hasPulse) => {
              arpMicroTime += timeOfOneRhythmPart
              
              if (!hasPulse) {
                return
              }
              
              //todo: check arp note lengths, seems wrong to use
              
              track.source.releaseAll(time + arpMicroTime) ||
              track.source.triggerRelease(undefined, time + arpMicroTime)
              
              track.source.triggerAttackRelease(
                partEvent.notes[patternNoteIndex.next().value],
                gate,
                time + arpMicroTime,
                partEvent.velocity
              )
            })
            
            // const timeOfOneArpNote = Tone.Time(value.duration).toSeconds() / value.note.length
            // value.note.forEach((note) => {
            //   track.source.releaseAll(time)
            //   track.source.triggerAttackRelease(
            //     note,
            //     value.duration,
            //     time,
            //     value.velocity
            //   )
            //   time += timeOfOneArpNote
            // })
          } else {
            // if there is 1 note, just play it
            
            if (partEvent.notes.length > 1 && !partEvent.arpeggiator) {
              console.error('Arpeggiator is not defined, yet multiple notes came in')
            }
            
            track.source
              .triggerAttackRelease(partEvent.notes[0], partEvent.duration, time, partEvent.velocity);
          }
        }),
        [
          ...this._sequenceGrid.value.filter(_ => ((_.row === i + 1) && (_.velocity > 0))).map(_ => {
            const step = _.column - 1
            
            return {
              time: getBarsBeatsSixteensFromStep(step),
              notes: _.notes,
              velocity: _.velocity / 100,
              duration: _.duration,
              modifiers: _.modifiers,
              column: _.column,
              row: _.row,
              arpeggiator: _.arpeggiator
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
