import type {Ref, ShallowRef} from 'vue'
import {ref, shallowRef, triggerRef} from 'vue'
import * as Tone from 'tone/Tone'
import {SoundEngine, SOURCE_TYPES} from '~/lib/SoundEngine'
import {Track, type TrackExportOptions} from "~/lib/Track";
import {getBarsBeatsSixteensFromStep} from "~/lib/utils/getBarsBeatsSixteensFromStep";
import {KeyboardManager} from "~/lib/KeyboardManager";
import {stepsToLoopLength} from "~/lib/utils/stepsToLoopLength";
import {LFO, type LFOOptions} from "~/lib/LFO";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {GridCell, GridCellNoteModeEnum} from "~/lib/GridCell";
import {useGridEditorStore} from "@/stores/gridEditor";
import {HistoryManager} from "~/lib/HistoryManager";
import {GRID_COLS, GRID_ROWS} from "@/constants";
import type {UniversalEffect} from "~/lib/Effects.types";
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";
import LegacySource from "~/lib/sources/LegacySource";
import {createPartFromData} from "~/lib/utils/createPartFromData";
import {Pattern, PatternManager} from "~/lib/PatternManager";
import {patternToTrackData} from "~/lib/utils/patternToTrackData";
import {type PartEvent, PartsManager} from "~/lib/PartsManager";
import {Midi} from '@tonejs/midi'
import getStepFromBarsBeatsSixteens from "~/lib/utils/getStepFromBarsBeatsSixteens";
import {createNewSource} from "~/lib/utils/createNewSource";

export const DEFAULT_NOTE = 'C4'

export const SAMPLES = ['kick.wav', 'clap.wav', 'hat1.wav', 'hat2.wav']

export function generateListOfAvailableNotes(track?: Track): string[] {
  const notes: string[] = []
  const octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  if (track?.sourceType.value === SOURCE_TYPES.SMPLR_Drum) {
    track.source.drumMap.size && track.source.drumMap.forEach((name, freq) => {
      notes.push(
        Tone.Frequency(freq, 'midi').toNote()
      )
    })
  } else {
    octaves.forEach((octave) => {
      noteNames.forEach((noteName) => {
        notes.push(`${noteName}${octave}`)
      })
    })
  }
  
  return notes
}

export type ImproviseOptions = {
  notesInKey: string[],
  probabilityModProbability?: number,
  skipModProbability?: number,
  flamModeProbability?: number,
  slideModProbability?: number,
  columnMutationMod?: number,
  columnMutationProbability?: number,
  columnMuteProbability?: number,
}

export class Sequencer {
  private static instance: Sequencer;
  
  private readonly historyManager = new HistoryManager<GridCell>(42)
  
  private readonly _bpm: Ref<number> = ref(120)
  
  public readonly selectedPatternId: Ref<string> = ref('')
  /**
   * patternIds in order of playback
   */
  public patternChain: Ref<string[]> = ref([])
  private readonly _patternMemory: PatternManager = new PatternManager()
  private _indicatorWatchdog: Tone.Loop<any> | null = null;
  private partsManager: PartsManager = new PartsManager()

  private _currentStep = ref(1)
  
  public readonly soundEngine: SoundEngine = SoundEngine.getInstance()
  
  public readonly keyboardManager: KeyboardManager = KeyboardManager.getInstance()
  
  private constructor() {
    this.patternMemory.set(new Pattern({
      cells: this.initGrid(1),
      name: 'Pattern 1',
    }))
    this.patternMemory.set(new Pattern({
      cells: this.initGrid(1),
      name: 'Pattern 2',
    }))
    
    this.selectedPatternId.value = this.patternMemory.patterns[0].id
    this.patternChain.value = [this.patternMemory.patterns[0].id]
  }
  
  public get patternMemory(): PatternManager {
    return this._patternMemory
  }
  
  private _mainLoop: Tone.Loop<any> | null = null;
  
  public set currentPage(value: number) {
    this._currentPage.value = value
    
    // If there is no grid cells for this page, populate them
    if (this.selectedPatternCells.filter((gridCell) => gridCell.column >= 1 + 16 * (value - 1) && gridCell.column <= 16 * value).length === 0) {
      this.selectedPatternCells.push(...this.initGrid(value))
    }
  }
  
  public get sequenceGrid(): GridCell[] {
    return this.selectedPatternCells
  }
  
  private _isPlaying: Ref<boolean> = ref(false)
  
  private _currentPage: Ref<number> = ref(1);
  
  private _lfos: ShallowRef<LFO[]> = shallowRef([]);
  
  private _indicatorLoops: Tone.Loop[] = []
  
  public get currentPage(): number {
    return this._currentPage.value
  }
  
  private get selectedPatternCells(): GridCell[] {
    return this.patternMemory.byId(this.selectedPatternId.value)?.cells || []
  }

  public get indicatorLoops(): Tone.Loop[] {
    return this._indicatorLoops
  }
  
  public get bpm(): number {
    return this._bpm.value
  }
  
  public static async importFrom(data: string): Promise<Sequencer> {
    const parsedData = JSON.parse(data) as SequencerExportData
    
    const sequencer = Sequencer.getInstance()
    
    sequencer.bpm = parseInt(String(parsedData.bpm))
    
    sequencer.soundEngine.clearTracks()
    
    for (let trackIndex = 0; trackIndex < parsedData.tracks.length; trackIndex++) {
      const track = await Track.importFrom(parsedData.tracks[trackIndex])
      sequencer.soundEngine.addTrack(track)
      
      const autoDuck = parsedData.tracks[trackIndex].middlewares.find((middleware: UniversalEffect) => middleware.name === 'AutoDuck')
      if (autoDuck) {
        const options = autoDuck.options as any
        sequencer.soundEngine.toggleSidechain(sequencer.soundEngine.tracks.value[0], track, options)
      }
    }
    
    for (let lfoIndex = 0; lfoIndex < parsedData.lfos.length; lfoIndex++) {
      sequencer.addLFO(parsedData.lfos[lfoIndex])
    }
    
    // sequencer.sequenceGrid = parsedData.sequenceGrid.map((gridCell: GridCell) => {
    //   return new GridCell({
    //     ...gridCell,
    //     modifiers: new Map(gridCell.modifiers),
    //   })
    // })
    
    sequencer.patternMemory.clear()
    
    parsedData.patterns.forEach((pattern: Pattern) => {
      sequencer.patternMemory.set(new Pattern({
        cells: pattern.cells.map((gridCell: GridCell) => {
          const modifiers = Object.keys(gridCell.modifiers).length > 0 ? new Map(gridCell.modifiers) : new Map()
          
          return new GridCell({
            ...gridCell,
            modifiers: modifiers,
          })
        }),
        name: pattern.name,
        id: pattern.id,
        tracksDurationInSteps: pattern.tracksDurationInSteps,
      }))
    })
    
    sequencer.patternChain.value = parsedData.patternChain
    
    sequencer.selectedPatternId.value = parsedData.selectedPatternId
    
    sequencer.patternMemory.triggerUpdate()
    
    return sequencer
  }
  
  public selectPatternById(id: string): void {
    this.selectedPatternId.value = id
  }
  
  public sequenceGridForDisplay(page: number = 1): GridCell[] {
    return this.selectedPatternCells.filter((gridCell) => gridCell.column >= 1 + 16 * (page - 1) && gridCell.column <= 16 * page)
  }

  public get currentStep(): number {
    return this._currentStep.value
  }

  public set currentStep(newValue: number) {
    this._currentStep.value = newValue
  }
  
  public get isPlaying(): boolean {
    return this._isPlaying.value
  }
  
  private _indicatorMatrix = ref(Array.from({length: GRID_COLS}, () => Array.from({length: GRID_ROWS}, () => false)))
  
  public set isPlaying(value: boolean) {
    this._isPlaying.value = value
  }
  
  public getCellIndex(row: number, column: number, patternId?: string): number {
    const pattern = patternId ? this.patternMemory.byId(patternId) : this.patternMemory.byId(this.selectedPatternId.value)
    return pattern.cells.findIndex((gridCell) => gridCell.id === `${row}-${column}`)
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
  
  public readCell(row: number, column: number, patternId?: string): GridCell {
    const cellIndex = this.getCellIndex(row, column, patternId)
    
    if (cellIndex === -1) {
      throw new Error(`Cell with row ${row} and column ${column} does not exist`)
    }
    
    const pattern = patternId ? this.patternMemory.byId(patternId) : this.patternMemory.byId(this.selectedPatternId.value)
    
    return pattern.cells[cellIndex]
  }
  
  public get LFOs(): ShallowRef<LFO[]> {
    return this._lfos
  }
  
  public writeCell(newCell: GridCell, options?: { ignoreHistory?: boolean, patternId?: string }): void {
    newCell = new GridCell({...newCell})
    const {ignoreHistory, patternId} = options ?? {}
    
    const partIndex = newCell.row - 1
    
    const safePatternId = patternId ?? this.selectedPatternId.value
    
    if (this.partsManager.has(safePatternId) && this.partsManager.get(safePatternId)![partIndex]) {
      this.partsManager.at({
        time: getBarsBeatsSixteensFromStep(newCell.column - 1),
        value: {
          notes: newCell.notes,
          velocity: (newCell.velocity ?? 0) / 100,
          duration: newCell.duration,
          modifiers: newCell.modifiers,
          column: newCell.column,
          row: newCell.row,
          arpeggiator: newCell.arpeggiator,
          mode: newCell.mode
        },
        patternId: safePatternId,
        partIndex
      })
    }
    
    const targetPattern = this.patternMemory.byId(safePatternId)
    
    if (!ignoreHistory) {
      const originalCell = targetPattern.cells.find(_ => _.id === newCell.id) ?? null as GridCell | null
      
      originalCell && this.historyManager.push(
        new GridCell({
          ...originalCell
        }),
        new GridCell({
          ...newCell
        })
      )
    }
    const cellIndex = targetPattern.cells.findIndex(_ => _.id === newCell.id) ?? -1
    targetPattern.cells[cellIndex] = new GridCell({...newCell})
    
    const selectedGridCell = useGridEditorStore().selectedGridCell
    
    if (selectedGridCell?.id === newCell.id) {
      if (!newCell.velocity) {
        useGridEditorStore().setSelectedGridCell(null)
      } else {
        useGridEditorStore().setSelectedGridCell(newCell)
      }
    }
    
    this.patternMemory.triggerUpdate();
  }
  
  public set bpm(value: number) {
    this._bpm.value = value
    Tone.Transport.bpm.value = value
  }

  public regenerateSequence(trackNumber: number): void {
    const {
      notesInKey,
      probabilityModProbability,
      skipModProbability,
      flamModeProbability,
      slideModProbability,
      columnMutationMod,
      columnMutationProbability,
      columnMuteProbability
      // we are sure they will be present in store
    }: Required<ImproviseOptions> = useGridEditorStore().improviseOptions as unknown as Required<ImproviseOptions>
    
    this.sequenceGrid.filter(cell => cell.row === trackNumber &&
      cell.column >= 1 + 16 * (this.currentPage - 1) &&
      cell.column <= 16 * this.currentPage
    ).map(cell => {
      
      cell.velocity = cell.column % 2 === 1 ? 100 : 0;

      Math.random() > (1 - probabilityModProbability) ?
        cell.modifiers.set(GridCellModifierTypes.probability, {type: GridCellModifierTypes.probability, probability: 50}) :
        cell.modifiers.delete(GridCellModifierTypes.probability)

      Math.random() > (1 - skipModProbability) ?
        cell.modifiers.set(GridCellModifierTypes.skip, {type: GridCellModifierTypes.skip, skip: Math.floor(Math.random() * 3) + 2}) :
        cell.modifiers.delete(GridCellModifierTypes.skip)

      Math.random() > (1 - flamModeProbability) ?
        cell.modifiers.set(GridCellModifierTypes.flam, {type: GridCellModifierTypes.flam, roll: Math.floor(Math.random() * 3) + 2}) :
        cell.modifiers.delete(GridCellModifierTypes.flam)

      Math.random() > (1 - slideModProbability) ?
          cell.modifiers.set(GridCellModifierTypes.slide, {type: GridCellModifierTypes.slide, slide: 20}) :
        cell.modifiers.delete(GridCellModifierTypes.slide)

      let columnMutationModFinal = columnMutationMod;
      if (!columnMutationModFinal) {
        columnMutationModFinal = Math.random() > 0.5 ? 2 : 3
      }

      if (cell.column % columnMutationModFinal === 0 && Math.random() > (1 - columnMutationProbability)) {
        cell.velocity = 100;
        this.writeCell(cell)
        
        return
      }

      if (cell.velocity === 100 && Math.random() > (1 - columnMuteProbability)) {
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
  
  public static async importFromMidi(midiUrl: string): Promise<void> {
    const midi = await Midi.fromUrl(midiUrl)
    const sequencer = Sequencer.getInstance()
    
    sequencer.bpm = midi.header.tempos[0].bpm
    
    sequencer.soundEngine.clearTracks()
    
    sequencer.patternMemory.clear()
    
    let timeOfFirstNote = midi.tracks[0]?.notes[0]?.time ?? 99
    
    const trackLengths: number[] = []
    midi.tracks.filter(track => track.notes.length).forEach((track, index) => {
      track.notes[track.notes.length - 1] && trackLengths.push(
        Tone.Time(Tone.Time(track.notes[track.notes.length - 1].time).quantize('16n')).toSeconds() +
        Tone.Time(Tone.Time(track.notes[track.notes.length - 1].duration).quantize('16n')).toSeconds()
      )
      
      timeOfFirstNote = Math.min(timeOfFirstNote, Tone.Time(track.notes[0].time).toSeconds())
    })
    
    console.log(timeOfFirstNote)
    const numOfPatterns = Math.ceil(Math.max(...trackLengths) / (64 * Tone.Time('16n').toSeconds()))
    
    for (let i = 1; i < numOfPatterns; i++) {
      sequencer.patternMemory.set(new Pattern({
        cells: [
          ...sequencer.initGrid(1, []),
          ...sequencer.initGrid(2, []),
          ...sequencer.initGrid(3, []),
          ...sequencer.initGrid(4, [])
        ],
        name: `Pattern ${i}`,
        tracksDurationInSteps: new Array(midi.tracks.length).fill(64),
      }))
    }
    
    midi.tracks.filter(track => track.notes.length).forEach((track, index) => {
      const trackName = track.instrument.name || 'Track #' + (index + 1)
      
      if (!track.instrument.percussion) {
        let source = undefined
        
        try {
          source = createNewSource({
            sourceType: SOURCE_TYPES.SMPLR_Instrument,
            source: {
              instrument: track.instrument.name.toLowerCase().replaceAll(' ', '_').replaceAll('-', '_').replaceAll('(', '').replaceAll(')', '')
            }
          })
        } catch (e) {
          console.error(e)
          source = createNewSource({
            sourceType: SOURCE_TYPES.SMPLR_Instrument,
            source: {
              instrument: 'acoustic_grand_piano'
            }
          })
        }
        source.init()
        sequencer.soundEngine.addTrack(
          new Track({
            name: trackName,
            source,
            sourceType: SOURCE_TYPES.SMPLR_Instrument,
          })
        )
      }
      
      if (track.instrument.percussion) {
        return
      }
      
      track.notes.forEach((note) => {
        const patternIndex = Math.floor(Tone.Time(note.time).toSeconds() / (64 * Tone.Time('16n').toSeconds()))
        
        if (!sequencer.patternMemory.patterns[patternIndex]) {
          return
        }
        
        let time = note.time - timeOfFirstNote
        while (time > 64 * Tone.Time('16n').toSeconds()) {
          time = time - 64 * Tone.Time('16n').toSeconds()
        }
        
        const gridCell = sequencer.patternMemory.patterns[patternIndex].cells.find((cell) => {
          const position = Tone.Time(Tone.Time(time).quantize('32n')).toBarsBeatsSixteenths()
          const step = getStepFromBarsBeatsSixteens(position)
          return cell.row === index + 1 && cell.column === step
        })
        
        if (!gridCell) {
          return
        }
        
        gridCell.notes.push(Tone.Frequency(note.midi, 'midi').toNote())
        
        if (gridCell.notes.length > 1) {
          gridCell.mode = GridCellNoteModeEnum.chord
        }
        
        gridCell.velocity = note.velocity * 100
        gridCell.duration = Tone.Time(Tone.Time(note.duration).quantize('16n')).toSeconds() || Tone.Time('16n').toSeconds()
      })
    })
    
    sequencer.patternChain.value = sequencer.patternMemory.patterns.map((pattern) => pattern.id)
    sequencer.selectedPatternId.value = sequencer.patternMemory.patterns[0].id
    
    sequencer.indicatorMatrix.value = Array.from({length: GRID_COLS}, () => Array.from({length: sequencer.soundEngine.tracks.value.length}, () => false))
  }
  
  public removeLFO(lfo: LFO): void {
    const index = this._lfos.value.findIndex(_lfo => _lfo === lfo)
    
    if (index === -1) {
      return
    }
    
    this._lfos.value.splice(index, 1)
    triggerRef(this._lfos)
  }
  
  public updatePartDuration(trackNumber: number, numOfSixteenths: number, patternId?: string): void {
    const safePatternId = patternId ?? this.selectedPatternId.value
    
    if (this.partsManager.has(safePatternId) && this.partsManager.get(safePatternId)![trackNumber - 1]) {
      this.partsManager.get(safePatternId)![trackNumber - 1].part.loopEnd = stepsToLoopLength(numOfSixteenths)
    }
    
    this.patternMemory.byId(safePatternId).tracksDurationInSteps[trackNumber - 1] = numOfSixteenths
    
    this.setupIndicatorLoops(patternId)
    this.setupTransport()
  }
  
  public addLFO(lfoOptions: LFOOptions): void {
    const lfo = new LFO(lfoOptions)
    this._lfos.value.push(lfo)
    triggerRef(this._lfos)
  }
  
  /**
   * @deprecated
   */
  public async initTracksDemoLegacy(): Promise<void> {
    this.soundEngine.clearTracks()

    const urls = {
      'C4': 'samples/kick.wav',
      'C#4': 'samples/clap.wav',
      'D4': 'samples/hat1.wav',
      'D#4': 'samples/hat2.wav',
      'E4': 'samples/kick2.wav',
    }

    const abstractSourceSampler = new LegacySource({
      sampler: {
        volume: -6,
        urls,
        release: 1,
        baseUrl: '/',
      }
    })

    await abstractSourceSampler.init();

    this.soundEngine.addTrack(
        new Track({
          name: 'Sampler',
          source: abstractSourceSampler,
          sourceType: SOURCE_TYPES.sampler,
        })
    ).meta.set('urls', urls)
    
    // for (let i = 0; i < SAMPLES.length; i++) {
    //
    // }
    //
    // const abstractSourceSynth = new RNBOSource(TRACK_TYPES.RNBO_Sub)
    //
    // await abstractSourceSynth.init();
    //
    // this.soundEngine.addTrack(new Track({
    //   name: 'Bass',
    //   source: abstractSourceSynth,
    //   sourceType: TRACK_TYPES.RNBO_Sub,
    // }))
    //
    // const abstractSourceSynth2 = new LegacySource({
    //   synth: {
    //     oscillator: {
    //       type: 'pulse'
    //     },
    //     envelope: {
    //       attack: 0.01,
    //       decay: 0.42,
    //       sustain: 0.01,
    //       release: 0.25
    //     },
    //     filterEnvelope: {
    //       attack: 0.001,
    //       decay: 0.1,
    //       sustain: 0.5,
    //     },
    //     volume: -6
    //   }
    // })
    //
    // await abstractSourceSynth2.init();
    //
    // this.soundEngine.addTrack(new Track({
    //   name: 'Bass 2',
    //   source: abstractSourceSynth2,
    //   sourceType: TRACK_TYPES.legacyMono,
    // }))
    //
    // const abstractSourceSynth3 = new RNBOSource(TRACK_TYPES.RNBO_Synth)
    //
    // await abstractSourceSynth3.init();
    //
    // this.soundEngine.addTrack(new Track({
    //   name: 'Arp 1',
    //   source: abstractSourceSynth3,
    //   sourceType: TRACK_TYPES.RNBO_Synth
    // }))
  }
  
  public stop() {
    this._isPlaying.value = false;
    this.currentStep = 1
    
    this.partsManager.parts.forEach((_) => _.part.cancel().stop().dispose())
    this.partsManager = new PartsManager()
    
    this._indicatorWatchdog?.cancel().stop().dispose()
    this._indicatorWatchdog = null
    this._indicatorLoops.forEach((loop) => loop.cancel().stop().dispose())
    this._indicatorLoops = []
    
    this.soundEngine.tracks.value.forEach((_, trackIndex) => {
      this.indicatorMatrix.value[trackIndex].forEach((__, columnIndex) => {
        this.toggleIndicator(trackIndex + 1, columnIndex + 1, false)
      })
    })
    
    this.soundEngine.tracks.value.forEach((track) => track.getLoops().value.forEach((loop) => loop.stop()))
    
    Tone.Transport.stop().cancel()
    this._mainLoop?.stop().dispose()
  }
  
  public toggleIndicator(row: number, column: number, value: boolean): void {
    const matrix = this._indicatorMatrix.value
    matrix[row - 1][column - 1] = value
    this._indicatorMatrix.value = matrix
  }
  
  public setupTransport(): void {
    let lastPatternEnd: number = 0
    this.patternChain.value.forEach((patternId, index) => {
      lastPatternEnd += Tone.Time(this.scheduleNextPattern(patternId, lastPatternEnd)).toSeconds()
    });
    
    Tone.Transport.loopEnd = Tone.Time(lastPatternEnd).toSeconds()
  }
  
  public async play() {
    this.currentStep = 1
    
    this.setupIndicatorLoops()
    
    this.setupTransport()
    
    Tone.Transport.loop = true
    
    this._mainLoop = new Tone.Loop((time) => {
      // triggered every eighth note.
      Tone.Draw.schedule(() => {
        const realPartDurationInSteps = Math.max(...this.patternMemory.byId(this.selectedPatternId.value).tracksDurationInSteps)
        this.currentStep++
        
        if (this.currentStep >= realPartDurationInSteps) {
          this.currentStep = 1
        }
      }, time);
    }, "16n").start(0);
    
    this._indicatorWatchdog = new Tone.Loop((time) => {
      Tone.Draw.schedule(() => {
        const realPartDurationInSteps = Math.max(...this.patternMemory.byId(this.selectedPatternId.value).tracksDurationInSteps)
        
        this.setupIndicatorLoops();
        if (this.currentStep >= realPartDurationInSteps) {
          this.currentStep = 1
        }
      }, time);
      
    }, "1m").start(0);
    
    Tone.Transport.start()
    
    this._isPlaying.value = true;
  }
  
  public scheduleNextPattern(patternId: string, time?: Tone.Unit.Time): Tone.Unit.Time {
    const nextMeasure = time ?? getToneTimeNextMeasure()
    
    this.partsManager.get(patternId)?.forEach((part) => part.part.stop(nextMeasure))
    
    const partDurationInSteps = Math.max(...this.patternMemory.byId(patternId).tracksDurationInSteps)
    const partDuration = Tone.Time(stepsToLoopLength(partDurationInSteps)).toSeconds()
    
    const parts: Tone.Part<PartEvent>[] = []
    for (let trackIndex = 0; trackIndex < this.soundEngine.tracks.value.length; trackIndex++) {
      parts.push(createPartFromData({
        track: this.soundEngine.tracks.value[trackIndex],
        trackIndex,
        trackData: patternToTrackData(this.patternMemory.byId(patternId), trackIndex + 1),
        patternId,
        lengthInSteps: this.patternMemory.byId(patternId).tracksDurationInSteps[trackIndex],
      }).start(time).stop(Tone.Time(time).toSeconds() + partDuration))
    }
    
    this.partsManager.set(patternId, parts.map(part => ({
      part,
      startTime: time as number,
    })))
    
    const maxPartDuration = Math.max(...parts.map((part) => part.loopEnd as number))
    return Tone.Time(maxPartDuration).toSeconds()
  }
  
  public setupIndicatorLoops(patternId?: string): void {
    const durationOf16n = Tone.Time('16n')
    const safePatternId = patternId ?? this.selectedPatternId.value
    
    this.soundEngine.tracks.value.forEach((track, trackIndex) => {
      const length = this.patternMemory.byId(safePatternId).tracksDurationInSteps[trackIndex]
      
      if (!this.indicatorLoops[trackIndex]) {
        this.indicatorLoops.push(
          new Tone.Loop(this.indicatorDrawCallback(trackIndex, length), durationOf16n.toSeconds())
        )
      } else {
        this.indicatorLoops[trackIndex].set({
          callback: this.processDisplayIndicatorTick(trackIndex, length),
        })
      }
      
      Tone.Draw.schedule(() => {
        this.indicatorMatrix.value[trackIndex].forEach((__, columnIndex) => {
          this.indicatorMatrix.value[trackIndex][columnIndex] = false
        })
        
        this.toggleIndicator(trackIndex + 1, 1, true)
      }, 0)
    })
    
    this._indicatorLoops.forEach(loop => loop.start(Tone.getContext().lookAhead))
  }
  
  private processDisplayIndicatorTick(trackIndex: number, trackLength: number): (time: number) => void {
    return (time: number) => Tone.Draw.schedule(this.indicatorDrawCallback(trackIndex, trackLength), time)
  }
  
  public export(): string {
    const data: SequencerExportData = {
      bpm: this.bpm,
      patterns: this.patternMemory.export(),
      tracks: this.soundEngine.tracks.value.map((track) => track.export()),
      lfos: this.LFOs.value.map((lfo) => lfo.export()),
      patternChain: this.patternChain.value,
      selectedPatternId: this.selectedPatternId.value,
    }
    return JSON.stringify(data)
  }
  
  public addTrack(track: Track): Track {
    const result = this.soundEngine.addTrack(track)
    this.setupTransport()
    
    return result
  }
  
  public initGrid(page: number = 1, defaultNotes = [DEFAULT_NOTE]): GridCell[] {
    const result: GridCell[] = []
    
    for (let i = 1; i <= GRID_ROWS; i++) {
      // todo either page or 32
      for (let j = 1 + 16 * (page - 1); j <= 16 * page; j++) {
        result.push(new GridCell({
          row: i,
          column: j,
          notes: defaultNotes,
          velocity: 0,
          duration: Tone.Time('16n').toSeconds(),
          modifiers: new Map()
        }))
      }
    }
    return result
  }
  
  public getCurrentlyPlayingPatternId(): string {
    const patternChainDurations = this.patternChain.value
      .map(patternId => {
        return this.patternMemory.patterns.find(pattern => pattern.id === patternId)!
      })
      .map(_ => Math.max(..._.tracksDurationInSteps) * Tone.Time('16n').toSeconds())
    
    const currentSongPosition = Tone.Time(Tone.Transport.position).toSeconds()
    
    let position = 0
    for (let i = 0; i < patternChainDurations.length; i++) {
      position += patternChainDurations[i]
      if (currentSongPosition < position) {
        return this.patternChain.value[i]
      }
    }
  }
  
  private indicatorDrawCallback(trackIndex: number, trackLength: number): () => void {
    return () => {
      if (!this.isPlaying || !this.indicatorMatrix.value[trackIndex]) {
        return
      }
      
      const cellIndexOfEnabledIndicator = this.indicatorMatrix.value[trackIndex].findIndex(_ => _)
      
      this.indicatorMatrix.value[trackIndex][cellIndexOfEnabledIndicator] = false
      
      let columnOfNextStep = cellIndexOfEnabledIndicator + 1
      if (columnOfNextStep >= trackLength) {
        columnOfNextStep = 0
      }
      
      this.indicatorMatrix.value[trackIndex][columnOfNextStep] = true
    }
  }
}

export type SequencerExportData = {
  bpm: number,
  patterns: Pattern[],
  tracks: TrackExportOptions[],
  lfos: LFOOptions[],
  patternChain: string[],
  selectedPatternId: string,
}
