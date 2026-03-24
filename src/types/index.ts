export type NoteName =
  | 'C' | 'C#/Db' | 'D' | 'D#/Eb' | 'E' | 'F'
  | 'F#/Gb' | 'G' | 'G#/Ab' | 'A' | 'Bb' | 'B';

export type AccidentalMode = 'flat' | 'sharp' | 'natural';

export interface DieResult {
  note: NoteName;
  landed: boolean;
}

export interface DicePairResult {
  die1: DieResult;
  die2: DieResult;
}

export type RollingPhase = 'idle' | 'shaking' | 'landing';

export type GameMode = 'notes' | 'chords';

export type ChordRootMode = 'simple' | 'all';

export interface ChordDieResult {
  note: NoteName;
  octave: number;
  landed: boolean;
}

export interface ChordGroupResult {
  root: NoteName;
  label: string;
  dice: ChordDieResult[];
  inversionLevel: number;
  spellingMode: 'flat' | 'sharp';
}
