import type { NoteName } from '../types';

export const CRF_COLORS: Record<NoteName, string> = {
  'C': '#f86e6e',
  'C#/Db': '#f58841',
  'D': '#ffbc57',
  'D#/Eb': '#b8a334',
  'E': '#fff56d',
  'F': '#b3f888',
  'F#/Gb': '#93d154',
  'G': '#6bc6a0',
  'G#/Ab': '#7ee8df',
  'A': '#88a7f8',
  'Bb': '#cc97e8',
  'B': '#e277b1',
};

/** Die 1: natural notes */
export const DIE1_FACES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A'];

/** Die 2: accidentals + B */
export const DIE2_FACES: NoteName[] = ['C#/Db', 'D#/Eb', 'F#/Gb', 'G#/Ab', 'Bb', 'B'];

export const BLACK_KEYS: Set<NoteName> = new Set([
  'C#/Db', 'D#/Eb', 'F#/Gb', 'G#/Ab', 'Bb',
]);

const FLAT_LABELS: Partial<Record<NoteName, string>> = {
  'C#/Db': 'D♭',
  'D#/Eb': 'E♭',
  'F#/Gb': 'G♭',
  'G#/Ab': 'A♭',
  'Bb': 'B♭',
};

const SHARP_LABELS: Partial<Record<NoteName, string>> = {
  'C#/Db': 'C♯',
  'D#/Eb': 'D♯',
  'F#/Gb': 'F♯',
  'G#/Ab': 'G♯',
  'Bb': 'A♯',
};

export function noteLabel(name: NoteName, mode: 'off' | 'flat' | 'sharp' | 'natural'): string {
  // Natural and off modes fall back to flat spelling for display.
  // Off mode affects which notes can be rolled (any), not display.
  const displayMode = (mode === 'natural' || mode === 'off') ? 'flat' : mode;
  return (displayMode === 'flat' ? FLAT_LABELS : SHARP_LABELS)[name] ?? name;
}

export const SMPLR_NOTE_MAP: Record<NoteName, string> = {
  'C': 'C',
  'C#/Db': 'C#',
  'D': 'D',
  'D#/Eb': 'D#',
  'E': 'E',
  'F': 'F',
  'F#/Gb': 'F#',
  'G': 'G',
  'G#/Ab': 'G#',
  'A': 'A',
  'Bb': 'Bb',
  'B': 'B',
};
