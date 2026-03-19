import { useDiceStore } from '../state/store';
import { useRollAnimation } from '../hooks/useRollAnimation';
import { DicePair } from './DicePair';
import { GoButton } from './GoButton';

export function DiceArea() {
  const pairCount = useDiceStore((s) => s.pairCount);
  const rollingPhase = useDiceStore((s) => s.rollingPhase);
  const results = useDiceStore((s) => s.results);
  const shuffling = useDiceStore((s) => s.shuffling);
  const { roll, isRolling } = useRollAnimation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div className={`flex flex-wrap items-center justify-center gap-8 ${shuffling ? 'animate-shuffle' : ''}`}>
        {Array.from({ length: pairCount }, (_, i) => (
          <DicePair
            key={i}
            result={results[i] ?? null}
            rollingPhase={rollingPhase}
          />
        ))}
      </div>
      <GoButton onClick={roll} disabled={isRolling} />
    </div>
  );
}
