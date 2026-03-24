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

// --- Chord quality and interval definitions ---

type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented';

/** Base triad intervals (semitones from root) */
const BASE_TRIADS: Record<ChordQuality, number[]> = {
  major:      [0, 4, 7],
  minor:      [0, 3, 7],
  diminished: [0, 3, 6],
  augmented:  [0, 4, 8],
};

// --- Partial extension system ---

interface Extension {
  name: string;           // suffix for chord label
  intervals: number[];    // semitones to ADD to the triad
  replaces3rd?: number;   // if set, replaces the 3rd with this semitone
  removesNotes?: number[];// semitone positions to remove (e.g., power chord removes 3rd)
  requires7th?: boolean;  // needs a 7th to already be present
  count: number;          // how many partial slots this uses
}

/** Extensions available per quality at partials=1 */
const EXTENSIONS_P1: Record<ChordQuality, Extension[]> = {
  major: [
    { name: 'sus2', intervals: [], replaces3rd: 2, count: 1 },
    { name: 'sus4', intervals: [], replaces3rd: 5, count: 1 },
    { name: '6', intervals: [9], count: 1 },
    { name: 'maj7', intervals: [11], count: 1 },
    { name: '7', intervals: [10], count: 1 },
    { name: '5', intervals: [], removesNotes: [4], count: 1 },
  ],
  minor: [
    { name: '7', intervals: [10], count: 1 },
    { name: '6', intervals: [9], count: 1 },
    { name: 'maj7', intervals: [11], count: 1 },
  ],
  diminished: [
    { name: '7', intervals: [9], count: 1 },   // dim7 = 9 semitones
    { name: 'm7b5', intervals: [10], count: 1 }, // half-dim
  ],
  augmented: [
    { name: '7', intervals: [10], count: 1 },
  ],
};

/** Higher extensions available at partials=2+ (require a 7th) */
const HIGHER_EXTENSIONS: Extension[] = [
  { name: '9', intervals: [14], requires7th: true, count: 1 },
  { name: 'b9', intervals: [13], requires7th: true, count: 1 },
  { name: '#9', intervals: [15], requires7th: true, count: 1 },
  { name: '11', intervals: [17], requires7th: true, count: 1 },
  { name: '#11', intervals: [18], requires7th: true, count: 1 },
  { name: '13', intervals: [21], requires7th: true, count: 1 },
  { name: 'b13', intervals: [20], requires7th: true, count: 1 },
];

/** Special multi-slot extensions */
const MULTI_EXTENSIONS: Extension[] = [
  { name: '6/9', intervals: [9, 14], requires7th: false, count: 2 },
  { name: 'add9', intervals: [14], requires7th: false, count: 1 },
  { name: 'add11', intervals: [17], requires7th: false, count: 1 },
];

// --- Chord label building ---

function buildChordLabel(root: NoteName, quality: ChordQuality, extensionNames: string[], spelling: 'sharp' | 'flat'): string {
  const rootStr = spellNote(root, spelling);

  // Base quality suffix
  let qualitySuffix = '';
  switch (quality) {
    case 'major': qualitySuffix = ''; break;
    case 'minor': qualitySuffix = 'm'; break;
    case 'diminished': qualitySuffix = 'dim'; break;
    case 'augmented': qualitySuffix = 'aug'; break;
  }

  // If we have sus, it replaces the quality for major
  const hasSus = extensionNames.some(n => n.startsWith('sus'));
  if (hasSus && quality === 'major') {
    qualitySuffix = '';
  }

  // Build extension string
  // Special handling: if we have '7' and '9', label as '9' not '7,9'
  let extStr = '';
  const has7 = extensionNames.includes('7') || extensionNames.includes('maj7');
  const hasMaj7 = extensionNames.includes('maj7');

  // Filter out intermediate 7ths when higher extensions are present
  const highExtNames = ['9', 'b9', '#9', '11', '#11', '13', 'b13'];
  const highExts = extensionNames.filter(n => highExtNames.includes(n));

  if (highExts.length > 0 && has7) {
    // Use the highest extension as the main label
    const highest = highExts[highExts.length - 1];
    if (hasMaj7) {
      extStr = `maj${highest}`;
    } else {
      extStr = highest;
    }
    // Add any modifiers (b9 alongside 13, etc.)
    const others = highExts.slice(0, -1);
    if (others.length > 0) {
      extStr += `(${others.join(',')})`;
    }
  } else {
    extStr = extensionNames.join('');
  }

  // Special cases
  if (extensionNames.includes('5') && quality === 'major') {
    return `${rootStr}5`;
  }
  if (extensionNames.includes('m7b5')) {
    return `${rootStr}m7b5`;
  }

  return `${rootStr}${qualitySuffix}${extStr}`;
}

// --- Main chord generation ---

export function generateChord(partials: number, accidentalMode: AccidentalMode, chordRootMode: ChordRootMode = 'all'): ChordGroupResult {
  // Pick root — 'simple' uses only natural (white key) roots
  const roots = chordRootMode === 'simple' ? NATURAL_ROOTS : CHROMATIC;
  const root = randomFrom(roots);

  // Pick quality
  const qualities: ChordQuality[] = ['major', 'minor', 'diminished', 'augmented'];
  const quality = randomFrom(qualities);

  // Start with base triad intervals
  let intervals = [...BASE_TRIADS[quality]];
  const extensionNames: string[] = [];
  let has7th = false;

  if (partials > 0) {
    // Decide how many partials to actually use (1 to partials)
    const numPartials = 1 + Math.floor(Math.random() * partials);
    let slotsRemaining = numPartials;

    // First, maybe pick a P1 extension (7th, sus, etc.)
    const p1Pool = EXTENSIONS_P1[quality];
    if (p1Pool.length > 0 && slotsRemaining > 0) {
      const ext = randomFrom(p1Pool);
      slotsRemaining -= ext.count;

      if (ext.replaces3rd !== undefined) {
        // Replace the 3rd (index 1) with the sus interval
        intervals[1] = ext.replaces3rd;
      }
      if (ext.removesNotes) {
        intervals = intervals.filter(i => !ext.removesNotes!.includes(i));
      }
      ext.intervals.forEach(i => {
        if (!intervals.includes(i)) intervals.push(i);
      });
      extensionNames.push(ext.name);

      // Track if we now have a 7th
      has7th = [10, 11, 9].some(s => intervals.includes(s) && s >= 9);
    }

    // Then, if slots remain and partials >= 2, try higher extensions
    if (slotsRemaining > 0 && partials >= 2) {
      // Build available pool
      const available = [
        ...HIGHER_EXTENSIONS.filter(e => !e.requires7th || has7th),
        ...MULTI_EXTENSIONS.filter(e => e.count <= slotsRemaining && (!e.requires7th || has7th)),
      ];

      // Pick extensions until slots run out
      const used = new Set<string>();
      while (slotsRemaining > 0 && available.length > 0) {
        const candidates = available.filter(e => e.count <= slotsRemaining && !used.has(e.name));
        if (candidates.length === 0) break;

        const ext = randomFrom(candidates);
        used.add(ext.name);
        slotsRemaining -= ext.count;

        ext.intervals.forEach(i => {
          if (!intervals.includes(i)) intervals.push(i);
        });
        extensionNames.push(ext.name);
      }
    }
  }

  // Sort intervals ascending
  intervals.sort((a, b) => a - b);

  // Build dice from intervals
  const baseOctave = 4;
  const dice: ChordDieResult[] = intervals.map(semitones => {
    const { note, octave } = noteFromSemitones(root, semitones);
    return { note, octave: baseOctave + octave, landed: false };
  });

  const spelling = rootSpellingMode(root, quality);
  const label = buildChordLabel(root, quality, extensionNames, spelling);

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
