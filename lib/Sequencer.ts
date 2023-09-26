import type {Ref, ShallowRef} from 'vue'
import {ref, shallowRef, triggerRef} from 'vue'
import * as Tone from 'tone/Tone'
import {SoundEngine, TrackTypes} from '~/lib/SoundEngine'
import {Track} from "~/lib/Track";
import {getBarsBeatsSixteensFromStep} from "~/lib/utils/getBarsBeatsSixteensFromStep";
import {KeyboardManager} from "~/lib/KeyboardManager";
import {stepsToLoopLength} from "~/lib/utils/stepsToLoopLength";
import {LFO, type LFOOptions} from "~/lib/LFO";
import AbstractSource from "~/lib/AbstractSource";
import type {
  FlamParams,
  GridCellArpeggiator,
  GridCellModifier,
  ProbabilityParams,
  SkipParams,
  SlideParams,
  SwingParams
} from "~/lib/GridCell.types";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {GridCell} from "~/lib/GridCell";
import {createEuclideanRhythmVector, shiftVector} from "~/lib/utils/createEuclideanRhythmVector";
import {PatternGenerator} from "~/lib/PatternGenerator";
import {useGridEditorStore} from "@/stores/gridEditor";
import {HistoryManager} from "~/lib/HistoryManager";
import {cloneDeep} from "lodash";
import {GRID_COLS, GRID_ROWS} from "@/constants";
import type {UniversalEffect} from "~/lib/Effects.types";

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
  
  private readonly historyManager = new HistoryManager<GridCell>(42)
  
  private readonly _bpm: Ref<number> = ref(120)
  
  private readonly _sequenceGrid: Ref<GridCell[]> = ref([])

  private _currentStep = ref(1)
  
  public readonly soundEngine: SoundEngine = SoundEngine.getInstance()
  
  public readonly keyboardManager: KeyboardManager = KeyboardManager.getInstance()
  
  private constructor() {
    this.initGrid()
  }
  
  private _mainLoop: Tone.Loop<any> | null = null;
  
  private _parts: Tone.Part<PartEvent>[] = []
  
  private _isPlaying: Ref<boolean> = ref(false)
  
  private _lfos: ShallowRef<LFO[]> = shallowRef([]);
  
  private _indicatorLoops: Tone.Loop[] = []

  public get indicatorLoops(): Tone.Loop[] {
    return this._indicatorLoops
  }
  
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

  public get sequenceGrid(): Ref<GridCell[]> {
    return this._sequenceGrid
  }

  public get currentStep(): number {
    return this._currentStep.value
  }

  public set currentStep(newValue: number) {
    if (newValue > GRID_COLS) {
      this._currentStep.value = 1
      return
    }
    
    this._currentStep.value = newValue
  }
  
  public get isPlaying(): boolean {
    return this._isPlaying.value
  }
  
  private _indicatorMatrix = ref(Array.from({length: GRID_COLS}, () => Array.from({length: GRID_ROWS}, () => false)))
  
  public set isPlaying(value: boolean) {
    this._isPlaying.value = value
  }

  public getCellIndex(row: number, column: number): number {
    return this._sequenceGrid.value.findIndex((gridCell) => gridCell.id === `${row}-${column}`)
  }

  public get history(): HistoryManager<GridCell> {
    return this.historyManager
  }
  
  public static getInstance(): Sequencer {
    if (!Sequencer.instance) {
      Sequencer.instance = new Sequencer();
      Sequencer.instance.bpm = 120;
    }
    
    return Sequencer.instance;
  }
  
  public static async importFrom(data: string): Promise<Sequencer> {
    const parsedData = JSON.parse(data)
    
    const sequencer = Sequencer.getInstance()
    
    sequencer.bpm = parseInt(parsedData.bpm)
    
    sequencer.soundEngine.clearTracks()
    
    for (let trackIndex = 0; trackIndex < parsedData.tracks.length; trackIndex++) {
      const track = await Track.importFrom(parsedData.tracks[trackIndex])
      sequencer.soundEngine.addTrack(track)
      
      if (parsedData.tracks[trackIndex].middlewares.find((middleware: UniversalEffect) => middleware.name === 'AutoDuck')) {
        const options = parsedData.tracks[trackIndex].middlewares.find((middleware: UniversalEffect) => middleware.name === 'AutoDuck').options
        sequencer.soundEngine.toggleSidechain(sequencer.soundEngine.tracks[0], track, options)
      }
    }
    
    for (let lfoIndex = 0; lfoIndex < parsedData.lfos.length; lfoIndex++) {
      sequencer.addLFO(parsedData.lfos[lfoIndex])
    }
    
    sequencer.sequenceGrid.value = parsedData.sequenceGrid.map((gridCell: GridCell) => {
      return new GridCell({
        ...gridCell,
        modifiers: new Map(gridCell.modifiers),
        notes: gridCell.notes,
        arpeggiator: gridCell.arpeggiator
      })
    })
    
    return sequencer
  }

  public readCell(row: number, column: number): GridCell {
    const cellIndex = this.getCellIndex(row, column)
    
    return <GridCell>({
      ...this._sequenceGrid.value[cellIndex],
      modifiers: this._sequenceGrid.value[cellIndex].modifiers,
      notes: this._sequenceGrid.value[cellIndex].notes,
      arpeggiator: this._sequenceGrid.value[cellIndex].arpeggiator
    })
  }
  
  public get LFOs(): ShallowRef<LFO[]> {
    return this._lfos
  }
  
  public writeCell(newCell: GridCell, ignoreHistory?: boolean): void {
    newCell = new GridCell({...newCell})
    
    if (this._parts[newCell.row - 1]) {
      this._parts[newCell.row - 1].at(getBarsBeatsSixteensFromStep(newCell.column - 1), {
        notes: newCell.notes,
        velocity: (newCell.velocity ?? 0) / 100,
        duration: newCell.duration,
        modifiers: newCell.modifiers,
        column: newCell.column,
        row: newCell.row,
        arpeggiator: newCell.arpeggiator
      } as PartEvent)
    }
    
    if (!ignoreHistory) {
      const originalCell = this._sequenceGrid.value.find(_ => _.id === newCell.id) ?? null as GridCell | null
      
      originalCell && this.historyManager.push(
        cloneDeep((
          new GridCell({
            ...originalCell,
            modifiers: (originalCell.modifiers),
            notes: (originalCell.notes),
            arpeggiator: (originalCell.arpeggiator)
          })
        )),
        
        cloneDeep((
          new GridCell({
            ...newCell,
            modifiers: newCell.modifiers,
            notes: newCell.notes,
            arpeggiator: newCell.arpeggiator
          })
        ))
      )
    }
    const cellIndex = this.getCellIndex(newCell.row, newCell.column)
    this._sequenceGrid.value[cellIndex] = new GridCell({...newCell})
    
    const selectedGridCell = useGridEditorStore().selectedGridCell
    
    if (selectedGridCell?.id === newCell.id) {
      if (!newCell.velocity) {
        useGridEditorStore().setSelectedGridCell(null)
      } else {
        useGridEditorStore().setSelectedGridCell(newCell)
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
      
      Math.random() > 0.75 ?
        cell.modifiers.set(GridCellModifierTypes.probability, {type: GridCellModifierTypes.probability, probability: 50}) :
        cell.modifiers.delete(GridCellModifierTypes.probability)
      
      Math.random() > 0.65 ?
        cell.modifiers.set(GridCellModifierTypes.skip, {type: GridCellModifierTypes.skip, skip: Math.floor(Math.random() * 3) + 2}) :
        cell.modifiers.delete(GridCellModifierTypes.skip)
      
      Math.random() > 0.85 ?
        cell.modifiers.set(GridCellModifierTypes.flam, {type: GridCellModifierTypes.flam, roll: Math.floor(Math.random() * 3) + 2}) :
        cell.modifiers.delete(GridCellModifierTypes.flam)
      
      Math.random() > 0.75 ?
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
  
  public get indicatorMatrix(): Ref<boolean[][]> {
    return this._indicatorMatrix
  }
  
  public get isPlayingRef(): Ref<boolean> {
    return this._isPlaying
  }
  
  public initGrid(): void {
    for (let i = 1; i <= this.soundEngine.tracksCount.value; i++) {
      for (let j = 1; j <= 16; j++) {
        this._sequenceGrid.value.push(new GridCell({
          row: i,
          column: j,
          notes: [DEFAULT_NOTE],
          velocity: 0,
          duration: Tone.Time('16n').toSeconds(),
          modifiers: new Map()
        }))
      }
    }
  }
  
  public removeLFO(lfo: LFO): void {
    const index = this._lfos.value.findIndex(_lfo => _lfo === lfo)
    
    if (index === -1) {
      return
    }
    
    this._lfos.value.splice(index, 1)
    triggerRef(this._lfos)
  }
  
  public updatePartDuration(trackNumber: number, numOfParts: number): void {
    if (!this._parts[trackNumber - 1]) {
      return
    }
    
    this._parts[trackNumber - 1].loopEnd = stepsToLoopLength(numOfParts)
    
    this.setupIndicatorLoops()
  }
  
  public addLFO(lfoOptions: LFOOptions): void {
    const lfo = new LFO(lfoOptions)
    this._lfos.value.push(lfo)
    triggerRef(this._lfos)
  }
  
  public stop() {
    console.log(this._parts)
    
    this._parts.forEach((part) => part.cancel().stop().dispose())
    this._parts = []
    
    this._indicatorLoops.forEach((loop) => loop.cancel().stop().dispose())
    this._indicatorLoops = []
    
    this.soundEngine.tracks.forEach((_, trackIndex) => {
      this.indicatorMatrix.value[trackIndex].forEach((__, columnIndex) => {
        this.indicatorMatrix.value[trackIndex][columnIndex] = false
      })
      
      this.toggleIndicator(trackIndex + 1, 1)
    })
    
    Tone.Transport.stop()
    this._mainLoop?.stop()
    
    this.soundEngine.tracks.forEach((track) => track.getLoops().value.forEach((loop) => loop.stop()))
    
    this._isPlaying.value = false;
  }
  
  public async play() {
    this.currentStep = 1
    
    this.setupIndicatorLoops()
    
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
          
          const cell = this.readCell(partEvent.row, partEvent.column)
          const modifiers = new Map(cloneDeep(cell.modifiers))
          
          if (partEvent.modifiers.has(GridCellModifierTypes.skip)) {
            const skipParams = partEvent.modifiers.get(GridCellModifierTypes.skip) as SkipParams
            
            modifiers.set(GridCellModifierTypes.skip, {
              type: GridCellModifierTypes.skip,
              skip: skipParams.skip,
              timesTriggered: skipParams.timesTriggered ? skipParams.timesTriggered + 1 : 1,
            })
            
            let newGridCell = new GridCell({
              ...cell,
              modifiers,
            })
            this.writeCell(newGridCell, true)
            
            const skipParamsForCell = this.readCell(partEvent.row, partEvent.column).modifiers.get(GridCellModifierTypes.skip) as SkipParams
            
            if (skipParamsForCell.timesTriggered && skipParamsForCell.timesTriggered % skipParams.skip !== 0) {
              return
            } else {
              modifiers.set(GridCellModifierTypes.skip, {
                type: GridCellModifierTypes.skip,
                skip: skipParams.skip,
                timesTriggered: 0,
              })
            }
            
            newGridCell = new GridCell({
              ...cell,
              modifiers,
            })
            this.writeCell(newGridCell, true)
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
          
          const flamParams = partEvent.modifiers.get(GridCellModifierTypes.flam) as FlamParams | undefined
          
          if (partEvent.modifiers.has(GridCellModifierTypes.flam) && flamParams && flamParams.roll > 1) {
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
          
          if (partEvent.notes.length > 1 && partEvent.arpeggiator) {
            const {pulses, parts, shift, type, gate} = partEvent.arpeggiator
            
            const euclideanRhythmVector = createEuclideanRhythmVector(pulses, parts)
            
            const shiftedEuclideanRhythmVector = shiftVector(euclideanRhythmVector, shift)
            
            const timeOfOneRhythmPart = Tone.Time(partEvent.duration).toSeconds() / shiftedEuclideanRhythmVector.length
            
            let arpMicroTime = -timeOfOneRhythmPart
            
            const patternNoteIndex = PatternGenerator(partEvent.notes.length, type)
            
            shiftedEuclideanRhythmVector.forEach((hasPulse) => {
              arpMicroTime += timeOfOneRhythmPart
              
              if (!hasPulse) {
                return
              }
              
              track.source.releaseAll(time + arpMicroTime) ||
              track.source.triggerRelease(undefined, time + arpMicroTime)
              
              track.source.triggerAttackRelease(
                partEvent.notes[patternNoteIndex.next().value],
                gate,
                time + arpMicroTime,
                partEvent.velocity
              )
            })
          } else {
            if (partEvent.notes.length > 1 && !partEvent.arpeggiator) {
              console.error(`Row: ${partEvent.row}, Col: ${partEvent.column} has more than 1 note but no arpeggiator, playing only the first note`)
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
    
    this._indicatorLoops.forEach(loop => loop.start(0))
    
    
    Tone.Transport.start()
    
    this._isPlaying.value = true;
  }
  
  public toggleIndicator(row: number, column: number): void {
    const matrix = this._indicatorMatrix.value
    matrix[row - 1][column - 1] = !matrix[row - 1][column - 1]
    this._indicatorMatrix.value = matrix
  }
  
  public setupIndicatorLoops() {
    const durationOf16n = Tone.Time('16n')
    
    this.soundEngine.tracks.forEach((track, trackIndex) => {
      if (!this.indicatorLoops[trackIndex]) {
        this.indicatorLoops.push(
          new Tone.Loop((time) => {
            Tone.Draw.schedule(() => {
              const columnOfEnabledIndicator = this.indicatorMatrix.value[trackIndex].findIndex(_ => _)
              
              this.indicatorMatrix.value[trackIndex].forEach(() => {
                this.indicatorMatrix.value[trackIndex][columnOfEnabledIndicator] = false
              })
              
              let columnOfNextStep = columnOfEnabledIndicator + 1
              columnOfNextStep >= track.length && (columnOfNextStep = 0)
              
              this.indicatorMatrix.value[trackIndex][columnOfNextStep] = true
            }, time)
          }, durationOf16n.toSeconds())
        )
      }
    })
  }
  
  public export(): string {
    const data = {
      bpm: this.bpm,
      sequenceGrid: cloneDeep(this.sequenceGrid.value).map((gridCell) => {
        // @ts-ignore
        gridCell.modifiers = Array.from(gridCell.modifiers.entries())
        
        return gridCell
      }),
      tracks: this.soundEngine.tracks.map((track) => track.export()),
      lfos: this.LFOs.value.map((lfo) => lfo.export())
    }
    return JSON.stringify(data)
  }
}
