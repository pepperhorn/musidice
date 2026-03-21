import { useEffect, useMemo, useRef, useState } from 'react';
import { CRF_COLORS, noteLabel, BLACK_KEYS } from '../constants/music';
import { useDiceStore } from '../state/store';
import type { NoteName, RollingPhase } from '../types';
import blankDiceSvg from '../assets/blankdice.svg';
import diceV4Svg from '../assets/dice_v4.svg';
import diceDoneSvgUrl from '../assets/dicewithcenter.svg';

const SHAKE_FRAMES = [blankDiceSvg, diceV4Svg];
const ALL_COLORS = Object.values(CRF_COLORS);
const SHAKE_VARIANTS = ['animate-shake-1', 'animate-shake-2', 'animate-shake-3'];

// Global cache for the dicedone SVG text
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
}

export function Die({ note, landed, rollingPhase }: DieProps) {
  const accidentalMode = useDiceStore((s) => s.accidentalMode);

  const isShaking = rollingPhase === 'shaking' && !landed;
  const isLanding = landed;
  const showNote = landed && note;
  const isIdle = rollingPhase === 'idle' && !landed;

  // Each die gets a random shake variant + animation delay for desync
  const shakeVariantRef = useRef(SHAKE_VARIANTS[Math.floor(Math.random() * SHAKE_VARIANTS.length)]);
  const shakeDelayRef = useRef(`${Math.floor(Math.random() * 200)}ms`);

  // Shake frame + color cycling
  const [frameIndex, setFrameIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isShaking) {
      // Pick new shake variant each roll
      shakeVariantRef.current = SHAKE_VARIANTS[Math.floor(Math.random() * SHAKE_VARIANTS.length)];
      shakeDelayRef.current = `${Math.floor(Math.random() * 200)}ms`;
      // Stagger color start per die instance
      const offset = Math.floor(Math.random() * ALL_COLORS.length);
      setColorIndex(offset);
      // Randomize interval slightly per die (180-240ms)
      const interval = 180 + Math.floor(Math.random() * 60);
      intervalRef.current = setInterval(() => {
        setFrameIndex((i) => (i + 1) % SHAKE_FRAMES.length);
        setColorIndex((i) => (i + 1) % ALL_COLORS.length);
      }, interval);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setFrameIndex(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isShaking]);

  // Landed die: colored SVG + rotation
  const [svgText, setSvgText] = useState<string | null>(svgTextCache);
  const colorsRef = useRef<{ top: string; side: string } | null>(null);

  useEffect(() => {
    if (!svgText) {
      fetchSvgText().then(setSvgText);
    }
  }, [svgText]);

  // Pick random top/side colors and rotation when landing
  const baseRotationRef = useRef(Math.floor(Math.random() * 4) * 90 + (Math.random() * 20 - 10));
  // Random roll parameters: distance from left and spin
  const rollDistRef = useRef(`${250 + Math.random() * 200}px`);
  const rollSpinRef = useRef(`${-540 - Math.random() * 360}deg`);
  const settleRockRef = useRef(`${4 + Math.random() * 6}deg`);
  const settleDurationRef = useRef(`${0.4 + Math.random() * 0.3}s`);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    if (isLanding && note) {
      const faceColor = CRF_COLORS[note];
      baseRotationRef.current = Math.floor(Math.random() * 4) * 90 + (Math.random() * 20 - 10);
      rollDistRef.current = `${250 + Math.random() * 200}px`;
      rollSpinRef.current = `${-540 - Math.random() * 360}deg`;
      settleRockRef.current = `${4 + Math.random() * 6}deg`;
      settleDurationRef.current = `${0.4 + Math.random() * 0.3}s`;
      colorsRef.current = {
        top: randomColor(faceColor),
        side: darken(randomColor(faceColor)),
      };
      const t = setTimeout(() => {
        setSettling(true);
        setTimeout(() => setSettling(false), 700);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [isLanding, note]);

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
  const label = note ? noteLabel(note, accidentalMode) : '';
  const isBlack = note ? BLACK_KEYS.has(note) : false;
  const rotation = baseRotationRef.current;

  const animClasses = isShaking
    ? shakeVariantRef.current
    : isLanding
      ? 'animate-land'
      : '';

  return (
    // Outer wrapper: base rotation + settle rock (separate from inner roll animation)
    <div
      className={`w-28 h-28 sm:w-32 sm:h-32 ${settling ? 'animate-settle' : ''}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        filter: showNote ? `drop-shadow(0 0 8px ${color}40)` : undefined,
        '--settle-base': `${rotation}deg`,
        '--settle-rock': settleRockRef.current,
        '--settle-duration': settleDurationRef.current,
      } as React.CSSProperties}
    >
      {/* Inner: animations (shake/land/settle own the transform here) */}
      <div
        className={`relative w-full h-full ${animClasses}`}
        style={{
          animationDelay: isShaking ? shakeDelayRef.current : undefined,
          '--roll-dist': rollDistRef.current,
          '--roll-spin': rollSpinRef.current,
        } as React.CSSProperties}
      >
        {/* Dice SVG */}
        {showNote && landedSvgUrl ? (
          <img src={landedSvgUrl} alt="die" className="w-full h-full" />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={SHAKE_FRAMES[frameIndex]}
              alt="die"
              className="w-full h-full"
              style={frameIndex === 1 ? { filter: 'invert(1) brightness(2)' } : undefined}
            />
            {isShaking && (
              <div
                className="absolute inset-0 rounded-lg mix-blend-multiply opacity-50 transition-colors duration-150"
                style={{ backgroundColor: ALL_COLORS[colorIndex] }}
              />
            )}
          </div>
        )}

        {/* Note label / idle "?" centered on the face (coordinates from SVG red dot marker, adjusted for group transform) */}
        {(showNote || isIdle) && (
          <div
            className="absolute font-bold font-[Poppins]"
            style={{
              left: '55.74%',
              top: '57.05%',
              transform: 'translate(-50%, -50%)',
              lineHeight: 1,
              textAlign: 'center',
              color: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              backgroundColor: showNote
                ? (isBlack ? '#fff' : color)
                : '#888',
              fontSize: showNote
                ? (label.length > 2 ? '2.2rem' : '2.8rem')
                : '2.8rem',
              textShadow: showNote
                ? (isBlack
                    ? '2px 2px 3px rgba(255,255,255,0.85), 0 0 0 rgba(0,0,0,0.6)'
                    : '2px 2px 3px rgba(255,255,255,0.2), 0 0 0 rgba(0,0,0,0.6)')
                : '2px 2px 3px rgba(255,255,255,0.85), 0 0 0 rgba(0,0,0,0.4)',
            }}
          >
            {showNote ? label : '?'}
          </div>
        )}
      </div>
    </div>
  );
}
