import { useEffect, useMemo, useRef, useState } from 'react';
import { CRF_COLORS, noteLabel, BLACK_KEYS } from '../constants/music';
import { spellNote, spellNoteEnharmonic } from '../constants/chords';
import { useDiceStore } from '../state/store';
import type { NoteName, RollingPhase } from '../types';
import { useDiePhysics } from '../hooks/useDiePhysics';
import { playNote } from '../audio/engine';
import blankDiceSvg from '../assets/blankdice.svg';
import diceV4Svg from '../assets/dice_v4.svg';
import diceDoneSvgUrl from '../assets/dicewithcenter.svg';

const SHAKE_FRAMES = [blankDiceSvg, diceV4Svg];
const ALL_COLORS = Object.values(CRF_COLORS);
const SHAKE_VARIANTS = ['animate-shake-1', 'animate-shake-2', 'animate-shake-3'];

// Global cache for the landed SVG text
let svgTextCache: string | null = null;
let svgTextPromise: Promise<string> | null = null;

function fetchSvgText(): Promise<string> {
  if (svgTextCache) return Promise.resolve(svgTextCache);
  if (!svgTextPromise) {
    svgTextPromise = fetch(diceDoneSvgUrl)
      .then((r) => r.text())
      .then((text) => {
        svgTextCache = text;
        return text;
      });
  }
  return svgTextPromise;
}

function randomColor(exclude?: string): string {
  const choices = exclude ? ALL_COLORS.filter((c) => c !== exclude) : ALL_COLORS;
  return choices[Math.floor(Math.random() * choices.length)];
}

function darken(hex: string, amount = 0.25): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount)) | 0;
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount)) | 0;
  const b = Math.max(0, (n & 0xff) * (1 - amount)) | 0;
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface DieProps {
  note: NoteName | null;
  landed: boolean;
  rollingPhase: RollingPhase;
  dieIndex: number;
  octave?: number;
  playOnSettle?: boolean;
  onSettle?: () => void;
  spellingOverride?: 'sharp' | 'flat';
  enharmonic?: boolean;
}

export function Die({ note, landed, rollingPhase, dieIndex, octave = 4, playOnSettle = true, onSettle: onSettleProp, spellingOverride, enharmonic }: DieProps) {
  const accidentalMode = useDiceStore((s) => s.accidentalMode);

  const isShaking = rollingPhase === 'shaking' && !landed;
  const showNote = landed && note;
  const isIdle = rollingPhase === 'idle' && !landed;

  // Physics-driven landing animation — play note or notify parent when die settles
  const handleSettle = useRef(() => {
    if (playOnSettle && note) playNote(note, octave);
    onSettleProp?.();
  });
  handleSettle.current = () => {
    if (playOnSettle && note) playNote(note, octave);
    onSettleProp?.();
  };
  const { containerRef, phase: physicsPhase, frameIndex: physicsFrameIndex } = useDiePhysics(landed, dieIndex, () => handleSettle.current());
  const isFlying = physicsPhase === 'flying';
  const hasSettled = physicsPhase === 'done';

  // Shake variant + delay for desync
  const shakeVariantRef = useRef(SHAKE_VARIANTS[Math.floor(Math.random() * SHAKE_VARIANTS.length)]);
  const shakeDelayRef = useRef(`${Math.floor(Math.random() * 200)}ms`);

  // Shake color cycling
  const [colorIndex, setColorIndex] = useState(0);
  const [shakeFrameIndex, setShakeFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isShaking) {
      shakeVariantRef.current = SHAKE_VARIANTS[Math.floor(Math.random() * SHAKE_VARIANTS.length)];
      shakeDelayRef.current = `${Math.floor(Math.random() * 200)}ms`;
      const offset = Math.floor(Math.random() * ALL_COLORS.length);
      setColorIndex(offset);
      const interval = 180 + Math.floor(Math.random() * 60);
      intervalRef.current = setInterval(() => {
        setShakeFrameIndex((i) => (i + 1) % SHAKE_FRAMES.length);
        setColorIndex((i) => (i + 1) % ALL_COLORS.length);
      }, interval);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setShakeFrameIndex(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isShaking]);

  // Landed SVG colorization
  const [svgText, setSvgText] = useState<string | null>(svgTextCache);
  const colorsRef = useRef<{ top: string; side: string } | null>(null);
  const baseRotationRef = useRef(Math.floor(Math.random() * 4) * 90 + (Math.random() * 20 - 10));

  useEffect(() => {
    if (!svgText) {
      fetchSvgText().then(setSvgText);
    }
  }, [svgText]);

  useEffect(() => {
    if (landed && note) {
      const faceColor = CRF_COLORS[note];
      baseRotationRef.current = Math.floor(Math.random() * 4) * 90 + (Math.random() * 20 - 10);
      colorsRef.current = {
        top: randomColor(faceColor),
        side: darken(randomColor(faceColor)),
      };
    }
  }, [landed, note]);

  const landedSvgUrl = useMemo(() => {
    if (!svgText || !showNote || !note || !colorsRef.current) return null;
    const faceColor = CRF_COLORS[note];
    const { top, side } = colorsRef.current;
    const modified = svgText
      .replace('fill:#f0f', `fill:${faceColor}`)
      .replace('fill:#0f0', `fill:${top}`)
      .replace('fill:#00f', `fill:${side}`)
      .replace('fill:red;fill-opacity:.521569', 'fill:none;fill-opacity:0');
    return `data:image/svg+xml,${encodeURIComponent(modified)}`;
  }, [svgText, showNote, note, colorsRef.current]);

  const color = note ? CRF_COLORS[note] : '#666';
  const label = note
    ? (spellingOverride ? (enharmonic ? spellNoteEnharmonic(note, spellingOverride) : spellNote(note, spellingOverride)) : noteLabel(note, accidentalMode))
    : '';
  const isBlack = note ? BLACK_KEYS.has(note) : false;
  const rotation = baseRotationRef.current;

  // Which SVG frame to show
  const currentFrameIndex = isShaking ? shakeFrameIndex : physicsFrameIndex;

  // Show the landed colorized SVG only after physics settles
  const showLandedSvg = hasSettled && showNote && landedSvgUrl;

  // Shake CSS class (only during shake phase)
  const shakeClass = isShaking ? shakeVariantRef.current : '';

  return (
    <div
      className={`die w-28 h-28 sm:w-32 sm:h-32 select-none ${hasSettled && showNote ? 'cursor-pointer' : ''}`}
      style={{
        transform: hasSettled ? `rotate(${rotation}deg)` : undefined,
        filter: hasSettled && showNote ? `drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 0 10px ${color}30)` : undefined,
      }}
      onClick={() => { if (hasSettled && note) playNote(note, octave); }}
    >
      {/* Physics container: rAF controls transform during flight */}
      <div ref={containerRef} className="die-physics w-full h-full">
        {/* Shake animation wrapper */}
        <div
          className={`die-shake relative w-full h-full ${shakeClass}`}
          style={{
            animationDelay: isShaking ? shakeDelayRef.current : undefined,
          }}
        >
          {/* Landed colorized SVG */}
          {showLandedSvg ? (
            <img src={landedSvgUrl} alt="die" className="die-face-landed w-full h-full" />
          ) : (
            <div className="die-face-shaking relative w-full h-full">
              <img
                src={SHAKE_FRAMES[currentFrameIndex]}
                alt="die"
                className="die-frame w-full h-full"
                style={currentFrameIndex === 1 ? { filter: 'invert(1) brightness(2)' } : undefined}
              />
              {(isShaking || isFlying) && (
                <div
                  className="die-color-overlay absolute inset-0 rounded-lg mix-blend-multiply opacity-50 transition-colors duration-150"
                  style={{ backgroundColor: ALL_COLORS[isFlying ? physicsFrameIndex : colorIndex] }}
                />
              )}
            </div>
          )}

          {/* Note label / idle "?" */}
          {(showLandedSvg || isIdle) && (
            <div
              className="die-note-label absolute font-bold font-[Poppins]"
              style={{
                left: '55.74%',
                top: '57.05%',
                transform: 'translate(-50%, -50%)',
                lineHeight: 1,
                textAlign: 'center',
                color: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                backgroundColor: showLandedSvg
                  ? (isBlack ? '#fff' : color)
                  : '#888',
                fontSize: showLandedSvg
                  ? (label.length > 2 ? '2.2rem' : '2.8rem')
                  : '2.8rem',
                textShadow: showLandedSvg
                  ? (isBlack
                      ? '2px 2px 3px rgba(255,255,255,0.85), 0 0 0 rgba(0,0,0,0.6)'
                      : '2px 2px 3px rgba(255,255,255,0.2), 0 0 0 rgba(0,0,0,0.6)')
                  : '2px 2px 3px rgba(255,255,255,0.85), 0 0 0 rgba(0,0,0,0.4)',
              }}
            >
              {showLandedSvg ? label : '?'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
