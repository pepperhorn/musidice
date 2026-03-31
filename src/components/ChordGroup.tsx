import { useCallback, useRef, useState } from 'react';
import { Die } from './Die';
import { playArpeggio } from '../audio/engine';
import { chordToClip } from '../utils/dottl';
import dottlIcon from '../assets/dottl-icon.svg';
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

  const [copied, setCopied] = useState(false);

  const copyDottl = () => {
    if (!result || !allLanded) return;
    navigator.clipboard.writeText(chordToClip(result)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Compact mode: constrain width to 3 dice per row, allow wrapping
  const diceSize = 128; // sm:w-32
  const diceGapPx = 12; // gap-3
  const maxPerRow = compact ? 3 : undefined;
  const compactMaxWidth = maxPerRow
    ? maxPerRow * diceSize + (maxPerRow - 1) * diceGapPx
    : undefined;

  return (
    <div className="chord-group flex flex-col items-center">
      {/* Chord label + copy button — always reserves space to prevent layout shift */}
      <div className={`chord-header flex items-center gap-2 mb-2 ${result && allLanded ? 'animate-fade-in' : 'invisible'}`}>
        <span
          className="chord-label font-bold font-[Caveat] select-none cursor-pointer hover:text-emerald-600 active:scale-95 transition-all duration-150"
          style={{ fontSize: compact ? '2.2rem' : '3rem', letterSpacing: '0.01em' }}
          onClick={() => {
            if (result && allLanded) {
              const notes = result.dice.map((d) => ({ note: d.note, octave: d.octave }));
              playArpeggio(notes);
            }
          }}
        >
          {result?.label || '\u00A0'}
        </span>
        <button
          className="btn-copy-dottl flex items-center justify-center w-5 h-5 rounded-full border border-slate-300 hover:border-emerald-400 hover:scale-110 active:scale-90 transition-all duration-150 cursor-pointer select-none"
          onClick={copyDottl}
          title="Copy as dottl"
          style={{ padding: '2px' }}
        >
          {copied ? (
            <span className="text-emerald-500 font-semibold text-xs leading-none">✓</span>
          ) : (
            <img src={dottlIcon} alt="Copy to dottl" className="dottl-icon w-full h-full" style={{ opacity: 0.6 }} />
          )}
        </button>
      </div>

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
            enharmonic={result.respelled}
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
