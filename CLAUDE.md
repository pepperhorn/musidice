# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Musidice — a musical dice game built with React, TypeScript, Vite, and Tailwind CSS. Two modes: Notes (random note pairs) and Chords (random chord groups with extensions/inversions).

## Architecture

- **State**: Zustand store at `src/state/store.ts`
- **Audio**: Smplr piano soundfont at `src/audio/engine.ts` — `playNote()` and `playArpeggio()`
- **Physics**: `src/hooks/useDiePhysics.ts` — rAF-driven dice animation (no libraries)
- **Roll orchestration**: `src/hooks/useRollAnimation.ts` — manages shake → land → idle phases
- **Chord theory**: `src/constants/chords.ts` — interval maps, chord generation, key-signature spelling, inversions
- **Components**: `Die.tsx` (single die), `DicePair.tsx` (note mode), `ChordGroup.tsx` (chord mode), `DiceArea.tsx` (layout + pagination)

## Audio Playback Rules

- **Notes mode**: Each die plays its note when the physics settle (`onSettle` callback from `useDiePhysics`). Never play sound before the die has visually landed.
- **Chords mode**: Individual dice do NOT play on settle (`playOnSettle={false}`). Instead, `ChordGroup` tracks settle count and plays an arpeggio only when ALL dice in the group have settled.
- **Page navigation**: When switching pages to view already-landed dice, arpeggios play after the slide animation completes (400ms delay). Dice that were already landed on mount skip physics animation and do NOT fire `onSettle`.
- **Click replay**: Clicking a landed die replays its note at the correct octave.

## Chord Spelling

- Each chord root maps to sharp or flat spelling based on circle-of-fifths key signatures (`ROOT_SPELLING` in `chords.ts`)
- Sharp keys: C, D, E, G, A, B, F# → spell chord tones with sharps
- Flat keys: F, Bb, Eb, Ab, Db → spell chord tones with flats
- The `spellingMode` is stored on `ChordGroupResult` and passed to dice via `spellingOverride` prop
- Never mix sharps and flats within a chord

## CSS Class Names

Always add contextual class names to elements alongside Tailwind utility classes (e.g., `chord-group`, `die-note-label`, `btn-shuffle`).

## Dev Server

Run on a specific port with `--host 0.0.0.0` for network access:
```bash
npm run dev -- --host 0.0.0.0 --port 5174
```
