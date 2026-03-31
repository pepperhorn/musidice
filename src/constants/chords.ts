import type { NoteName, AccidentalMode, ChordRootMode, ChordGroupResult, ChordDieResult } from '../types';

/** Chromatic scale in order */
const CHROMATIC: NoteName[] = [
  'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F',
  'F#/Gb', 'G', 'G#/Ab', 'A', 'Bb', 'B',
];

const NATURAL_ROOTS: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function chromaticIndex(note: NoteName): number {
  return CHROMATIC.indexOf(note);
}

/** Add semitones to a root note, return the resulting note + octave offset */
function noteFromSemitones(root: NoteName, semitones: number): { note: NoteName; octave: number } {
  const rootIdx = chromaticIndex(root);
  const total = rootIdx + semitones;
  const noteIdx = ((total % 12) + 12) % 12;
  const octaveOffset = Math.floor(total / 12);
  return { note: CHROMATIC[noteIdx], octave: octaveOffset };
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Key-signature-based spelling ---

/**
 * Maps each MAJOR key root to sharp or flat spelling.
 * Based on circle of fifths:
 *   Sharp keys: C, G, D, A, E, B, F#
 *   Flat keys:  F, Bb, Eb, Ab, Db, Gb
 */
const MAJOR_KEY_SPELLING: Record<NoteName, 'sharp' | 'flat'> = {
  'C':     'sharp',
  'C#/Db': 'flat',   // Db major (5 flats)
  'D':     'sharp',
  'D#/Eb': 'flat',   // Eb major (3 flats)
  'E':     'sharp',
  'F':     'flat',
  'F#/Gb': 'sharp',  // F# major (6 sharps)
  'G':     'sharp',
  'G#/Ab': 'flat',   // Ab major (4 flats)
  'A':     'sharp',
  'Bb':    'flat',
  'B':     'sharp',
};

/**
 * Correct enharmonic spelling for each chromatic degree in sharp and flat contexts.
 */
const SHARP_SPELLING: Record<NoteName, string> = {
  'C': 'C', 'C#/Db': 'C♯', 'D': 'D', 'D#/Eb': 'D♯',
  'E': 'E', 'F': 'F', 'F#/Gb': 'F♯', 'G': 'G',
  'G#/Ab': 'G♯', 'A': 'A', 'Bb': 'A♯', 'B': 'B',
};

const FLAT_SPELLING: Record<NoteName, string> = {
  'C': 'C', 'C#/Db': 'D♭', 'D': 'D', 'D#/Eb': 'E♭',
  'E': 'E', 'F': 'F', 'F#/Gb': 'G♭', 'G': 'G',
  'G#/Ab': 'A♭', 'A': 'A', 'Bb': 'B♭', 'B': 'B',
};

/**
 * Get the correct spelling mode for a chord based on its root and quality.
 * Minor/diminished chords use the spelling of their relative major:
 *   relative major = root + 3 semitones (minor 3rd up)
 * Augmented chords use the major key spelling of the root.
 *
 * Examples:
 *   Cm → relative major Eb → flat
 *   Am → relative major C → sharp
 *   F#m → relative major A → sharp
 *   Gm → relative major Bb → flat
 */
export function rootSpellingMode(root: NoteName, quality?: string): 'sharp' | 'flat' {
  if (quality === 'minor' || quality === 'diminished') {
    // Use relative major's spelling (minor 3rd up = 3 semitones)
    const { note: relativeMajor } = noteFromSemitones(root, 3);
    return MAJOR_KEY_SPELLING[relativeMajor];
  }
  return MAJOR_KEY_SPELLING[root];
}

/** Spell a note correctly based on the chord root's key signature */
export function spellNote(note: NoteName, mode: 'sharp' | 'flat'): string {
  return mode === 'sharp' ? SHARP_SPELLING[note] : FLAT_SPELLING[note];
}

/**
 * Expanded enharmonic spelling — includes natural↔accidental equivalents
 * (B↔C♭, E↔F♭, C↔B♯, F↔E♯). Used after user respells a chord.
 */
const SHARP_ENHARMONIC: Record<NoteName, string> = {
  ...SHARP_SPELLING,
  'C': 'B♯', 'F': 'E♯',
};

const FLAT_ENHARMONIC: Record<NoteName, string> = {
  ...FLAT_SPELLING,
  'B': 'C♭', 'E': 'F♭',
};

/** Spell a note with full enharmonic support (for respelled chords) */
export function spellNoteEnharmonic(note: NoteName, mode: 'sharp' | 'flat'): string {
  return mode === 'sharp' ? SHARP_ENHARMONIC[note] : FLAT_ENHARMONIC[note];
}

// --- Chord quality and interval definitions ---

type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented';

// --- Chart-based chord templates (from PepperHorn Common Chord Spellings) ---

interface ChordTemplate {
  label: string;          // chord symbol suffix (e.g., 'm7', 'maj9(#11)')
  quality: ChordQuality;  // base quality for spelling mode
  intervals: number[];    // semitones from root
  complexity: number;     // how many extension "partials" this needs (0=triad, 1-5=extensions)
}

/**
 * Every valid chord type, sourced from the PepperHorn Common Chord Spellings sheet.
 * Complexity controls which chords appear at each partials setting.
 */
const CHORD_TEMPLATES: ChordTemplate[] = [
  // --- Major triads & simple extensions (complexity 0-1) ---
  { label: '',           quality: 'major',      intervals: [0, 4, 7],          complexity: 0 },
  { label: '+',          quality: 'augmented',   intervals: [0, 4, 8],          complexity: 0 },
  { label: 'dim',        quality: 'diminished',  intervals: [0, 3, 6],          complexity: 0 },
  { label: '6',          quality: 'major',       intervals: [0, 4, 7, 9],       complexity: 1 },
  { label: '7',          quality: 'major',       intervals: [0, 4, 7, 10],      complexity: 1 },
  { label: 'maj7',       quality: 'major',       intervals: [0, 4, 7, 11],      complexity: 1 },
  { label: '5',          quality: 'major',       intervals: [0, 7],             complexity: 1 },
  { label: 'sus2',       quality: 'major',       intervals: [0, 2, 7],          complexity: 1 },
  { label: 'sus4',       quality: 'major',       intervals: [0, 5, 7],          complexity: 1 },
  { label: '(add9)',     quality: 'major',       intervals: [0, 4, 7, 14],      complexity: 1 },

  // --- Minor triads & simple extensions (complexity 0-1) ---
  { label: 'm',          quality: 'minor',       intervals: [0, 3, 7],          complexity: 0 },
  { label: 'm+',         quality: 'minor',       intervals: [0, 3, 8],          complexity: 0 },
  { label: 'm6',         quality: 'minor',       intervals: [0, 3, 7, 9],       complexity: 1 },
  { label: 'm7',         quality: 'minor',       intervals: [0, 3, 7, 10],      complexity: 1 },
  { label: 'm(add9)',    quality: 'minor',       intervals: [0, 3, 7, 14],      complexity: 1 },

  // --- Dominant 7th extensions (complexity 2) ---
  { label: '7(b5)',      quality: 'major',       intervals: [0, 4, 6, 10],      complexity: 2 },
  { label: '7(#5)',      quality: 'major',       intervals: [0, 4, 8, 10],      complexity: 2 },
  { label: '6/9',        quality: 'major',       intervals: [0, 4, 7, 9, 14],   complexity: 2 },
  { label: '9',          quality: 'major',       intervals: [0, 4, 7, 10, 14],  complexity: 2 },
  { label: '7(b9)',      quality: 'major',       intervals: [0, 4, 7, 10, 13],  complexity: 2 },
  { label: '7(#9)',      quality: 'major',       intervals: [0, 4, 7, 10, 15],  complexity: 2 },
  { label: '7sus',       quality: 'major',       intervals: [0, 5, 7, 10],      complexity: 2 },

  // --- Major 7th extensions (complexity 2) ---
  { label: 'maj7(b5)',   quality: 'major',       intervals: [0, 4, 6, 11],      complexity: 2 },
  { label: 'maj7(#5)',   quality: 'major',       intervals: [0, 4, 8, 11],      complexity: 2 },
  { label: 'maj9',       quality: 'major',       intervals: [0, 4, 7, 11, 14],  complexity: 2 },
  { label: 'maj7(b9)',   quality: 'major',       intervals: [0, 4, 7, 11, 13],  complexity: 2 },
  { label: 'maj7(#9)',   quality: 'major',       intervals: [0, 4, 7, 11, 15],  complexity: 2 },

  // --- Minor 7th extensions (complexity 2) ---
  { label: 'm7(b5)',     quality: 'minor',       intervals: [0, 3, 6, 10],      complexity: 2 },
  { label: 'm7(#5)',     quality: 'minor',       intervals: [0, 3, 8, 10],      complexity: 2 },
  { label: 'm6/9',       quality: 'minor',       intervals: [0, 3, 7, 9, 14],   complexity: 2 },
  { label: 'm9',         quality: 'minor',       intervals: [0, 3, 7, 10, 14],  complexity: 2 },
  { label: 'm(maj7)',    quality: 'minor',       intervals: [0, 3, 7, 11],      complexity: 2 },
  { label: 'm7sus',      quality: 'minor',       intervals: [0, 5, 7, 10],      complexity: 2 },

  // --- Diminished extensions (complexity 2) ---
  { label: 'dim7',       quality: 'diminished',  intervals: [0, 3, 6, 9],       complexity: 2 },
  { label: 'ø7',         quality: 'diminished',  intervals: [0, 3, 6, 10],      complexity: 2 },

  // --- Augmented extensions (complexity 2) ---
  { label: '+7',         quality: 'augmented',   intervals: [0, 4, 8, 10],      complexity: 2 },

  // --- Higher dominant extensions (complexity 3) ---
  { label: '9(b5)',      quality: 'major',       intervals: [0, 4, 6, 10, 14],  complexity: 3 },
  { label: '9(#5)',      quality: 'major',       intervals: [0, 4, 8, 10, 14],  complexity: 3 },
  { label: '9(#11)',     quality: 'major',       intervals: [0, 4, 7, 10, 14, 18], complexity: 3 },
  { label: '9sus',       quality: 'major',       intervals: [0, 5, 7, 10, 14],  complexity: 3 },
  { label: '13',         quality: 'major',       intervals: [0, 4, 7, 10, 14, 21], complexity: 3 },
  { label: '13(b9)',     quality: 'major',       intervals: [0, 4, 7, 10, 13, 21], complexity: 3 },
  { label: '13(#9)',     quality: 'major',       intervals: [0, 4, 7, 10, 15, 21], complexity: 3 },
  { label: '13(#11)',    quality: 'major',       intervals: [0, 4, 7, 10, 14, 18, 21], complexity: 3 },
  { label: '13sus',      quality: 'major',       intervals: [0, 5, 7, 10, 14, 21], complexity: 3 },

  // --- Higher major 7th extensions (complexity 3) ---
  { label: 'maj9(b5)',   quality: 'major',       intervals: [0, 4, 6, 11, 14],  complexity: 3 },
  { label: 'maj9(#5)',   quality: 'major',       intervals: [0, 4, 8, 11, 14],  complexity: 3 },
  { label: 'maj9(#11)',  quality: 'major',       intervals: [0, 4, 7, 11, 14, 18], complexity: 3 },
  { label: 'maj13',      quality: 'major',       intervals: [0, 4, 7, 11, 14, 21], complexity: 3 },
  { label: 'maj13(#5)',  quality: 'major',       intervals: [0, 4, 8, 11, 14, 21], complexity: 3 },
  { label: 'maj13(#11)', quality: 'major',       intervals: [0, 4, 7, 11, 14, 18, 21], complexity: 3 },

  // --- Higher minor extensions (complexity 3) ---
  { label: 'm9(b5)',     quality: 'minor',       intervals: [0, 3, 6, 10, 14],  complexity: 3 },
  { label: 'm9(#5)',     quality: 'minor',       intervals: [0, 3, 8, 10, 14],  complexity: 3 },
  { label: 'm7(b9)',     quality: 'minor',       intervals: [0, 3, 7, 10, 13],  complexity: 3 },
  { label: 'm11',        quality: 'minor',       intervals: [0, 3, 7, 10, 14, 17], complexity: 3 },
  { label: 'm(maj9)',    quality: 'minor',       intervals: [0, 3, 7, 11, 14],  complexity: 3 },
  { label: 'm(maj7b5)',  quality: 'minor',       intervals: [0, 3, 6, 11],      complexity: 3 },
  { label: 'm(maj7#5)',  quality: 'minor',       intervals: [0, 3, 8, 11],      complexity: 3 },

  // --- Complex dominant alterations (complexity 4-5) ---
  { label: '7(b9,b5)',   quality: 'major',       intervals: [0, 4, 6, 10, 13],  complexity: 4 },
  { label: '7(b9,#5)',   quality: 'major',       intervals: [0, 4, 8, 10, 13],  complexity: 4 },
  { label: '7(#9,b5)',   quality: 'major',       intervals: [0, 4, 6, 10, 15],  complexity: 4 },
  { label: '7(#9,#5)',   quality: 'major',       intervals: [0, 4, 8, 10, 15],  complexity: 4 },
  { label: '7(#11,b9)',  quality: 'major',       intervals: [0, 4, 7, 10, 13, 18], complexity: 4 },
  { label: '7(#11,#9)',  quality: 'major',       intervals: [0, 4, 7, 10, 15, 18], complexity: 4 },
  { label: '13(b5)',     quality: 'major',       intervals: [0, 4, 6, 10, 14, 21], complexity: 4 },
  { label: '13(#5)',     quality: 'major',       intervals: [0, 4, 8, 10, 14, 21], complexity: 4 },
  { label: 'm11(b5)',    quality: 'minor',       intervals: [0, 3, 6, 10, 14, 17], complexity: 4 },
  { label: 'm9(#11)',    quality: 'minor',       intervals: [0, 3, 7, 10, 14, 18], complexity: 4 },
  { label: 'm13',        quality: 'minor',       intervals: [0, 3, 7, 10, 14, 17, 21], complexity: 4 },
  { label: 'm13(b5)',    quality: 'minor',       intervals: [0, 3, 6, 10, 14, 17, 21], complexity: 4 },
  { label: 'm13(#5)',    quality: 'minor',       intervals: [0, 3, 8, 10, 14, 17, 21], complexity: 4 },
  { label: 'm(maj9b5)',  quality: 'minor',       intervals: [0, 3, 6, 11, 14],  complexity: 4 },
  { label: 'm(maj9#5)',  quality: 'minor',       intervals: [0, 3, 8, 11, 14],  complexity: 4 },

  // --- Extreme compound alterations (complexity 5) ---
  { label: '7(#11,b9,b5)',  quality: 'major',    intervals: [0, 4, 6, 10, 13, 18],  complexity: 5 },
  { label: '7(#11,#9,b5)',  quality: 'major',    intervals: [0, 4, 6, 10, 15, 18],  complexity: 5 },
  { label: '7(#11,b9,#5)',  quality: 'major',    intervals: [0, 4, 8, 10, 13, 18],  complexity: 5 },
  { label: '7(#11,#9,#5)',  quality: 'major',    intervals: [0, 4, 8, 10, 15, 18],  complexity: 5 },
  { label: '9(#11,#5)',     quality: 'major',    intervals: [0, 4, 8, 10, 14, 18],  complexity: 5 },
  { label: '13(b9,b5)',     quality: 'major',    intervals: [0, 4, 6, 10, 13, 21],  complexity: 5 },
  { label: '13(b9,#5)',     quality: 'major',    intervals: [0, 4, 8, 10, 13, 21],  complexity: 5 },
  { label: '13(#9,b5)',     quality: 'major',    intervals: [0, 4, 6, 10, 15, 21],  complexity: 5 },
  { label: '13(#9,#5)',     quality: 'major',    intervals: [0, 4, 8, 10, 15, 21],  complexity: 5 },
  { label: '13(#11,#5)',    quality: 'major',    intervals: [0, 4, 8, 10, 14, 18, 21], complexity: 5 },
  { label: '13(#11,b9)',    quality: 'major',    intervals: [0, 4, 7, 10, 13, 18, 21], complexity: 5 },
  { label: '13(#11,#9)',    quality: 'major',    intervals: [0, 4, 7, 10, 15, 18, 21], complexity: 5 },
  { label: 'maj9(#11,#5)',  quality: 'major',    intervals: [0, 4, 8, 11, 14, 18],  complexity: 5 },
  { label: 'maj13(#11,#5)', quality: 'major',    intervals: [0, 4, 8, 11, 14, 18, 21], complexity: 5 },
];

// --- Main chord generation ---

export function generateChord(partials: number, _accidentalMode: AccidentalMode, chordRootMode: ChordRootMode = 'all'): ChordGroupResult {
  // Pick root — 'simple' uses only natural (white key) roots
  const roots = chordRootMode === 'simple' ? NATURAL_ROOTS : CHROMATIC;
  const root = randomFrom(roots);

  // Filter templates by complexity (partials setting = max complexity allowed)
  const available = CHORD_TEMPLATES.filter(t => t.complexity <= partials);
  const template = randomFrom(available);

  // Build intervals and dice
  const intervals = [...template.intervals].sort((a, b) => a - b);
  const baseOctave = 4;
  const dice: ChordDieResult[] = intervals.map(semitones => {
    const { note, octave } = noteFromSemitones(root, semitones);
    return { note, octave: baseOctave + octave, landed: false };
  });

  const spelling = rootSpellingMode(root, template.quality);
  const rootStr = spellNote(root, spelling);
  const label = `${rootStr}${template.label}`;

  return {
    root,
    label,
    dice,
    inversionLevel: 0,
    spellingMode: spelling,
  };
}

// --- Inversions ---

export function applyInversion(chord: ChordGroupResult, level: number): ChordGroupResult {
  const maxInversion = chord.dice.length - 1;
  const actualLevel = Math.min(level, maxInversion);

  const newDice = [...chord.dice.map(d => ({ ...d }))];

  // Move bottom N notes up an octave
  for (let i = 0; i < actualLevel; i++) {
    newDice[i] = { ...newDice[i], octave: newDice[i].octave + 1 };
  }

  // Re-sort by octave then chromatic position
  newDice.sort((a, b) => {
    if (a.octave !== b.octave) return a.octave - b.octave;
    return chromaticIndex(a.note) - chromaticIndex(b.note);
  });

  return {
    ...chord,
    dice: newDice,
    inversionLevel: actualLevel,
    label: chord.label,
  };
}

/** Flip a chord's spelling mode (sharp↔flat) and rebuild the label */
export function respellChord(chord: ChordGroupResult): ChordGroupResult {
  const wasRespelled = chord.respelled ?? false;
  const newSpelling: 'sharp' | 'flat' = chord.spellingMode === 'sharp' ? 'flat' : 'sharp';
  const willBeRespelled = !wasRespelled;

  // Use enharmonic spelling for the label when respelling, standard when reverting
  const oldRoot = wasRespelled
    ? spellNoteEnharmonic(chord.root, chord.spellingMode)
    : spellNote(chord.root, chord.spellingMode);
  const newRoot = willBeRespelled
    ? spellNoteEnharmonic(chord.root, newSpelling)
    : spellNote(chord.root, newSpelling);

  const newLabel = oldRoot !== newRoot
    ? chord.label.replace(oldRoot, newRoot)
    : chord.label;

  return {
    ...chord,
    label: newLabel,
    spellingMode: newSpelling,
    respelled: willBeRespelled,
  };
}

export function randomInversion(chord: ChordGroupResult): ChordGroupResult {
  // Reset to root position first
  const rootChord: ChordGroupResult = {
    ...chord,
    dice: [...chord.dice.map(d => ({ ...d }))],
    inversionLevel: 0,
  };
  // Re-sort to root position by stripping extra octaves
  // Rebuild from stored intervals would be cleaner, but we can just
  // pick a random inversion level on the current chord
  const maxInv = Math.min(chord.dice.length - 1, 3);
  const level = Math.floor(Math.random() * (maxInv + 1));
  return applyInversion(rootChord, level);
}
