import { useCallback, useRef } from 'react';
import { Die } from './Die';
import { playArpeggio } from '../audio/engine';
import type { ChordGroupResult, RollingPhase } from '../types';

interface ChordGroupProps {
  result: ChordGroupResult | null;
  rollingPhase: RollingPhase;
  groupIndex: number;
  compact?: boolean;
}

export function ChordGroup({ result, rollingPhase, groupIndex: _groupIndex, compact = false }: ChordGroupProps) {
  const diceCount = result?.dice.length ?? 3;
  const settledCountRef = useRef(0);
  const allLanded = result?.dice.every((d) => d.landed) ?? false;
  const hasPlayedRef = useRef(allLanded);

  if (!allLanded) {
    settledCountRef.current = 0;
    hasPlayedRef.current = false;
  }

  const handleDieSettle = useCallback(() => {
    settledCountRef.current += 1;
    if (settledCountRef.current >= diceCount && !hasPlayedRef.current && result) {
      hasPlayedRef.current = true;
      const notes = result.dice.map((d) => ({ note: d.note, octave: d.octave }));
      playArpeggio(notes);
    }
  }, [diceCount, result]);

  // Compact mode: constrain width to 3 dice per row, allow wrapping
  const diceSize = 128; // sm:w-32
  const diceGapPx = 12; // gap-3
  const maxPerRow = compact ? 3 : undefined;
  const compactMaxWidth = maxPerRow
    ? maxPerRow * diceSize + (maxPerRow - 1) * diceGapPx
    : undefined;

  return (
    <div className="chord-group flex flex-col items-center">
      {/* Chord label — always reserves space to prevent layout shift */}
      <span
        className={`chord-label font-bold font-[Poppins] mb-2 ${result && allLanded ? 'animate-fade-in' : 'invisible'}`}
        style={{ fontSize: compact ? '2rem' : '2.8rem', color: '#64748b' }}
      >
        {result?.label || '\u00A0'}
      </span>

      {/* Dice grid — wraps in compact mode */}
      <div
        className={`chord-dice flex ${compact ? 'flex-wrap justify-center' : 'items-center'} gap-3`}
        style={compactMaxWidth ? { maxWidth: compactMaxWidth } : undefined}
      >
        {result?.dice.map((die, i) => (
          <Die
            key={i}
            note={die.note}
            landed={die.landed}
            rollingPhase={rollingPhase}
            dieIndex={i}
            octave={die.octave}
            playOnSettle={false}
            onSettle={handleDieSettle}
            spellingOverride={result.spellingMode}
          />
        )) ?? (
          Array.from({ length: 3 }, (_, i) => (
            <Die
              key={i}
              note={null}
              landed={false}
              rollingPhase={rollingPhase}
              dieIndex={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
