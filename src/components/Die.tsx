import { CRF_COLORS, noteLabel, BLACK_KEYS } from '../constants/music';
import { useDiceStore } from '../state/store';
import type { NoteName, RollingPhase } from '../types';

interface DieProps {
  note: NoteName | null;
  landed: boolean;
  rollingPhase: RollingPhase;
}

export function Die({ note, landed, rollingPhase }: DieProps) {
  const accidentalMode = useDiceStore((s) => s.accidentalMode);

  const isShaking = rollingPhase === 'shaking' && !landed;
  const isLanding = landed;
  const showNote = landed && note;

  const color = note ? CRF_COLORS[note] : '#666';
  const label = note ? noteLabel(note, accidentalMode) : '';
  const isBlack = note ? BLACK_KEYS.has(note) : false;

  return (
    <div
      className={`relative w-28 h-28 sm:w-32 sm:h-32 ${isShaking ? 'animate-shake' : ''} ${isLanding ? 'animate-land' : ''}`}
    >
      {/* Dice SVG outline */}
      <img
        src="/dice_v4.svg"
        alt="die"
        className="w-full h-full"
        style={{ filter: 'invert(1) brightness(2)' }}
      />

      {/* Colored note face overlay on the front face */}
      {showNote && (
        <div
          className="absolute flex items-center justify-center rounded-lg font-bold font-[Poppins]"
          style={{
            backgroundColor: color,
            color: isBlack ? '#fff' : '#1a1a2e',
            top: '35%',
            left: '8%',
            width: '52%',
            height: '42%',
            fontSize: label.length > 2 ? '1.1rem' : '1.4rem',
            textShadow: isBlack ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
