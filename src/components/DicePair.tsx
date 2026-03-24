import { Die } from './Die';
import type { DicePairResult, RollingPhase } from '../types';

interface DicePairProps {
  result: DicePairResult | null;
  rollingPhase: RollingPhase;
}

export function DicePair({ result, rollingPhase }: DicePairProps) {
  return (
    <div className="dice-pair flex items-center gap-4">
      <Die
        note={result?.die1.note ?? null}
        landed={result?.die1.landed ?? false}
        rollingPhase={rollingPhase}
        dieIndex={0}
      />
      <Die
        note={result?.die2.note ?? null}
        landed={result?.die2.landed ?? false}
        rollingPhase={rollingPhase}
        dieIndex={1}
      />
    </div>
  );
}
