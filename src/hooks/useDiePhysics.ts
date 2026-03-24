import { useEffect, useRef, useState } from 'react';

export type PhysicsPhase = 'idle' | 'flying' | 'done';

interface PhysicsParams {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  omega: number;
  gravity: number;
  restitution: number;
  angularDamping: number;
  bounceCount: number;
  maxBounces: number;
  lastTime: number;
}

export function useDiePhysics(landed: boolean, dieIndex: number, onSettle?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<PhysicsPhase>(landed ? 'done' : 'idle');
  const [frameIndex, setFrameIndex] = useState(0);
  const paramsRef = useRef<PhysicsParams | null>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef<PhysicsPhase>(landed ? 'done' : 'idle');
  // Track whether landed was true on initial mount (page switch — skip animation)
  const wasLandedOnMountRef = useRef(landed);

  useEffect(() => {
    if (!landed || !containerRef.current) return;

    // If already landed on mount (e.g. page switch), skip physics entirely
    if (wasLandedOnMountRef.current) {
      wasLandedOnMountRef.current = false; // allow future rolls to animate
      phaseRef.current = 'done';
      setPhase('done');
      return;
    }

    // Initialize physics with stagger based on dieIndex
    const stagger = dieIndex * 0.15;
    const params: PhysicsParams = {
      x: -(350 + Math.random() * 200),
      y: -(80 + Math.random() * 60),
      vx: 0.8 + Math.random() * 0.3 + stagger * 0.1,
      vy: -0.2 - Math.random() * 0.15,
      angle: 0,
      omega: (8 + Math.random() * 8) * (Math.random() > 0.5 ? 1 : -1),
      gravity: 0.0018 + Math.random() * 0.0004,
      restitution: 0.3 + Math.random() * 0.2,
      angularDamping: 0.993 + Math.random() * 0.004,
      bounceCount: 0,
      maxBounces: 2 + Math.floor(Math.random() * 2),
      lastTime: performance.now(),
    };
    paramsRef.current = params;
    phaseRef.current = 'flying';
    setPhase('flying');

    const el = containerRef.current;
    let settleStart = 0;
    let settleFromX = 0;
    let settleFromY = 0;
    let settleFromAngle = 0;
    const settleDuration = 300 + Math.random() * 200;

    function tick(now: number) {
      const p = paramsRef.current!;
      const dt = Math.min(now - p.lastTime, 32);
      p.lastTime = now;

      if (phaseRef.current === 'flying') {
        // Apply gravity
        p.vy += p.gravity * dt;

        // Update position
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Update rotation
        p.angle += p.omega * dt;
        p.omega *= Math.pow(p.angularDamping, dt / 16);

        // Ground collision (y >= 0 means at rest position)
        if (p.y >= 0 && p.vy > 0) {
          p.y = 0;
          p.bounceCount++;

          if (p.bounceCount >= p.maxBounces || Math.abs(p.vy) < 0.05) {
            // Start settling
            settleStart = now;
            settleFromX = p.x;
            settleFromY = p.y;
            settleFromAngle = p.angle % 360;
            phaseRef.current = 'settling' as PhysicsPhase;
          } else {
            // Bounce
            p.vy = -p.vy * p.restitution;
            p.vx *= 0.7;
            p.omega *= 0.5;
          }
        }

        // Swap SVG frame based on rotation
        const newFrame = Math.floor(Math.abs(p.angle) / 180) % 2;
        setFrameIndex(prev => prev !== newFrame ? newFrame : prev);

        // Apply transform
        el.style.transform = `translateX(${p.x}px) translateY(${p.y}px) rotate(${p.angle}deg)`;
        el.style.opacity = Math.min(1, (now - (p.lastTime - dt) + 200) / 200).toString();

      } else {
        // Settling: lerp to final position
        const elapsed = now - settleStart;
        const t = Math.min(elapsed / settleDuration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);

        const cx = settleFromX * (1 - ease);
        const cy = settleFromY * (1 - ease);
        const ca = settleFromAngle * (1 - ease);

        el.style.transform = `translateX(${cx}px) translateY(${cy}px) rotate(${ca}deg)`;

        if (t >= 1) {
          el.style.transform = '';
          el.style.opacity = '';
          phaseRef.current = 'done';
          setPhase('done');
          onSettle?.();
          return; // Stop the loop
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    // Small delay for stagger between dice in a pair
    const startDelay = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, dieIndex * 80);

    return () => {
      clearTimeout(startDelay);
      cancelAnimationFrame(rafRef.current);
    };
  }, [landed, dieIndex]);

  // Reset when not landed
  useEffect(() => {
    if (!landed) {
      setPhase('idle');
      setFrameIndex(0);
      phaseRef.current = 'idle';
      wasLandedOnMountRef.current = false; // next landing should animate
      if (containerRef.current) {
        containerRef.current.style.transform = '';
        containerRef.current.style.opacity = '';
      }
    }
  }, [landed]);

  return { containerRef, phase, frameIndex };
}
