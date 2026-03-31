import type { ChordGroupResult, NoteName } from '../types';
import { spellNote, spellNoteEnharmonic } from '../constants/chords';

/** Chromatic row index — C=0 through B=11 */
const ROW_MAP: Record<NoteName, number> = {
  'C': 0, 'C#/Db': 1, 'D': 2, 'D#/Eb': 3,
  'E': 4, 'F': 5, 'F#/Gb': 6, 'G': 7,
  'G#/Ab': 8, 'A': 9, 'Bb': 10, 'B': 11,
};

/**
 * Convert a ChordGroupResult into a dottl play-grid-clip JSON string.
 * This format is what dottl's pasteFromSystem expects on Ctrl+V.
 */
export function chordToClip(chord: ChordGroupResult): string {
  const spell = chord.respelled ? spellNoteEnharmonic : spellNote;
  const noteNames = chord.dice.map(d => spell(d.note, chord.spellingMode));
  const label = `${noteNames.length} notes (${noteNames.join(', ')})`;

  const notes = chord.dice.map((die, i) => ({
    name: die.note as string,
    col: 1,
    row: ROW_MAP[die.note],
    octave: die.octave,
    isRoot: i === 0,
    sustainCells: 0,
  }));

  const clip = {
    _type: 'play-grid-clip',
    label,
    timestamp: Date.now(),
    data: {
      notes,
      lines: [],
      originCol: 1,
      originRow: ROW_MAP[chord.dice[0]?.note ?? 'C'],
    },
  };

  return JSON.stringify(clip);
}
