import { useCallback } from 'react';
import { useDiceStore } from '../state/store';
import { DIE1_FACES, DIE2_FACES } from '../constants/music';
import { playNote } from '../audio/engine';
import type { DicePairResult } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useRollAnimation() {
  const pairCount = useDiceStore((s) => s.pairCount);
  const rollingPhase = useDiceStore((s) => s.rollingPhase);

  const roll = useCallback(async () => {
    if (rollingPhase !== 'idle') return;

    const store = useDiceStore.getState();
    const count = store.pairCount;

    // Generate all results upfront
    const allResults: DicePairResult[] = Array.from({ length: count }, () => ({
      die1: { note: randomFrom(DIE1_FACES), landed: false },
      die2: { note: randomFrom(DIE2_FACES), landed: false },
    }));

    // Initialize results with nothing landed
    useDiceStore.setState({
      results: allResults.map((r) => ({
        die1: { ...r.die1, landed: false },
        die2: { ...r.die2, landed: false },
      })),
      rollingPhase: 'shaking',
      currentPairIndex: 0,
    });

    // Shake phase — randomize duration slightly
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
      playNote(allResults[i].die1.note);

      // Random gap before die 2 lands (feels like real dice)
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
      playNote(allResults[i].die2.note);
      await delay(300 + Math.random() * 200);
    }

    useDiceStore.setState({ rollingPhase: 'idle' });
  }, [rollingPhase, pairCount]);

  return { roll, isRolling: rollingPhase !== 'idle' };
}
