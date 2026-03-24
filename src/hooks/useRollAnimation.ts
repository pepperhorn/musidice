import { useCallback } from 'react';
import { useDiceStore } from '../state/store';
import { DIE1_FACES, DIE2_FACES } from '../constants/music';
import { generateChord, applyInversion } from '../constants/chords';
import type { ChordGroupResult, DicePairResult } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Shared landing sequence for note pairs */
async function animateLanding(allResults: DicePairResult[]) {
  const count = allResults.length;

  useDiceStore.setState({
    results: allResults.map((r) => ({
      die1: { ...r.die1, landed: false },
      die2: { ...r.die2, landed: false },
    })),
    rollingPhase: 'shaking',
    currentPairIndex: 0,
  });

  await delay(700 + Math.random() * 300);

  for (let i = 0; i < count; i++) {
    useDiceStore.setState({ currentPairIndex: i });
    if (i > 0) await delay(300 + Math.random() * 200);

    useDiceStore.setState((state) => {
      const results = [...state.results];
      results[i] = {
        ...results[i],
        die1: { ...results[i].die1, landed: true },
      };
      return { results, rollingPhase: 'landing' };
    });

    await delay(400 + Math.random() * 400);

    useDiceStore.setState((state) => {
      const results = [...state.results];
      results[i] = {
        ...results[i],
        die2: { ...results[i].die2, landed: true },
      };
      return { results };
    });
    await delay(300 + Math.random() * 200);
  }

  useDiceStore.setState({ rollingPhase: 'idle' });
}

/** Landing sequence for chord groups — all dice in a group land simultaneously */
async function animateChordLanding(allChords: ChordGroupResult[]) {
  const count = allChords.length;

  useDiceStore.setState({
    chordResults: allChords.map((chord) => ({
      ...chord,
      dice: chord.dice.map((d) => ({ ...d, landed: false })),
    })),
    rollingPhase: 'shaking',
    currentPairIndex: 0,
  });

  await delay(700 + Math.random() * 300);

  for (let i = 0; i < count; i++) {
    useDiceStore.setState({ currentPairIndex: i });
    if (i > 0) await delay(600 + Math.random() * 400);

    // Land ALL dice in this chord group at once
    useDiceStore.setState((state) => {
      const chordResults = [...state.chordResults];
      chordResults[i] = {
        ...chordResults[i],
        dice: chordResults[i].dice.map((d) => ({ ...d, landed: true })),
      };
      return { chordResults, rollingPhase: 'landing' };
    });

    await delay(800 + Math.random() * 400);
  }

  useDiceStore.setState({ rollingPhase: 'idle' });
}

export function useRollAnimation() {
  const rollingPhase = useDiceStore((s) => s.rollingPhase);

  const roll = useCallback(async () => {
    if (rollingPhase !== 'idle') return;
    const store = useDiceStore.getState();

    if (store.mode === 'chords') {
      const chords: ChordGroupResult[] = Array.from(
        { length: store.chordCount },
        () => generateChord(store.partials, store.accidentalMode, store.chordRootMode),
      );
      await animateChordLanding(chords);
    } else {
      const die2Pool = store.accidentalMode === 'natural' ? DIE1_FACES
        : store.accidentalMode === 'off' ? [...DIE1_FACES, ...DIE2_FACES]
        : DIE2_FACES;
      const allResults: DicePairResult[] = Array.from({ length: store.pairCount }, () => ({
        die1: { note: randomFrom(DIE1_FACES), landed: false },
        die2: { note: randomFrom(die2Pool), landed: false },
      }));
      await animateLanding(allResults);
    }
  }, [rollingPhase]);

  const shuffle = useCallback(async () => {
    if (rollingPhase !== 'idle') return;
    const store = useDiceStore.getState();

    if (store.mode === 'chords') {
      // Re-roll chords with same count and partials
      const chords: ChordGroupResult[] = Array.from(
        { length: store.chordCount },
        () => generateChord(store.partials, store.accidentalMode, store.chordRootMode),
      );
      await animateChordLanding(chords);
    } else {
      const currentResults = store.results;
      if (currentResults.length === 0) return;

      const allNotes = currentResults.flatMap((r) => [r.die1.note, r.die2.note]);
      for (let i = allNotes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allNotes[i], allNotes[j]] = [allNotes[j], allNotes[i]];
      }

      const shuffledResults: DicePairResult[] = [];
      for (let i = 0; i < allNotes.length; i += 2) {
        shuffledResults.push({
          die1: { note: allNotes[i], landed: false },
          die2: { note: allNotes[i + 1], landed: false },
        });
      }
      await animateLanding(shuffledResults);
    }
  }, [rollingPhase]);

  const invert = useCallback(async () => {
    if (rollingPhase !== 'idle') return;
    const store = useDiceStore.getState();
    if (store.mode !== 'chords' || store.chordResults.length === 0) return;

    const inverted = store.chordResults.map((chord) => {
      const maxInv = Math.min(chord.dice.length - 1, 3);
      const level = 1 + Math.floor(Math.random() * maxInv);
      return applyInversion(chord, level);
    });

    await animateChordLanding(inverted);
  }, [rollingPhase]);

  return { roll, shuffle, invert, isRolling: rollingPhase !== 'idle' };
}
