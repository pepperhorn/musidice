import { Soundfont } from 'smplr';
import { SMPLR_NOTE_MAP } from '../constants/music';
import type { NoteName } from '../types';

let audioContext: AudioContext | null = null;
let piano: Soundfont | null = null;
let loading = false;

async function ensurePiano(): Promise<Soundfont> {
  if (piano) return piano;
  if (loading) {
    while (loading) await new Promise((r) => setTimeout(r, 50));
    return piano!;
  }
  loading = true;
  audioContext = new AudioContext();
  piano = new Soundfont(audioContext, { instrument: 'acoustic_grand_piano' });
  await piano.load;
  loading = false;
  return piano;
}

export async function initAudio() {
  await ensurePiano();
}

function noteToMidi(pitch: string, octave: number): number {
  const semitones: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
  };
  return (octave + 1) * 12 + (semitones[pitch] ?? 0);
}

export async function playNote(name: NoteName, octave: number = 4, duration: number = 1.0) {
  const pitch = SMPLR_NOTE_MAP[name];
  const midi = noteToMidi(pitch, octave);
  const p = await ensurePiano();
  p.start({ note: midi, duration });
}
