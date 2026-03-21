import { useCallback } from 'react';
import { useDiceStore } from '../state/store';
import { DIE1_FACES, DIE2_FACES } from '../constants/music';
import type { DicePairResult } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Shared landing sequence: shakes then lands dice one by one */
async function animateLanding(allResults: DicePairResult[]) {
  const count = allResults.length;

  // Initialize results with nothing landed
  useDiceStore.setState({
    results: allResults.map((r) => ({
      die1: { ...r.die1, landed: false },
      die2: { ...r.die2, landed: false },
    })),
    rollingPhase: 'shaking',
    currentPairIndex: 0,
  });

  // Shake phase
  await delay(700 + Math.random() * 300);

  // Sequential landing for each pair with randomized gaps
  for (let i = 0; i < count; i++) {
    useDiceStore.setState({ currentPairIndex: i });

    if (i > 0) await delay(300 + Math.random() * 200);

    // Land die 1
    useDiceStore.setState((state) => {
      const results = [...state.results];
      results[i] = {
        ...results[i],
        die1: { ...results[i].die1, landed: true },
      };
      return { results, rollingPhase: 'landing' };
    });

    // Random gap before die 2 lands
    await delay(400 + Math.random() * 400);

    // Land die 2
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

export function useRollAnimation() {
  const pairCount = useDiceStore((s) => s.pairCount);
  const rollingPhase = useDiceStore((s) => s.rollingPhase);

  const roll = useCallback(async () => {
    if (rollingPhase !== 'idle') return;

    const store = useDiceStore.getState();
    const count = store.pairCount;
    const isNatural = store.accidentalMode === 'natural';

    const allResults: DicePairResult[] = Array.from({ length: count }, () => ({
      die1: { note: randomFrom(DIE1_FACES), landed: false },
      die2: { note: randomFrom(isNatural ? DIE1_FACES : DIE2_FACES), landed: false },
    }));

    await animateLanding(allResults);
  }, [rollingPhase, pairCount]);

  const shuffle = useCallback(async () => {
    if (rollingPhase !== 'idle') return;

    const store = useDiceStore.getState();
    const currentResults = store.results;
    if (currentResults.length === 0) return;

    // Collect all notes, shuffle them, re-pair
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
  }, [rollingPhase]);

  return { roll, shuffle, isRolling: rollingPhase !== 'idle' };
}
