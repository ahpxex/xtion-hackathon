'use client';

import Image from 'next/image';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { penguinLevelAtom } from '../store/atoms';

type SpritePosition = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

const DEFAULT_POSITION: SpritePosition = { x: 96, y: 96, rotation: 0, scale: 1 };

export default function PenguinDisplay() {
  const [penguinLevel] = useAtom(penguinLevelAtom);

  const shouldShow = penguinLevel > 0;
  const clampedLevel = Math.min(Math.max(penguinLevel, 0), 8);
  const renderCount = Math.max(1, clampedLevel);
  const baseSize = 150;
  const size = Math.max(108, baseSize - (renderCount - 1) * 6);

  const [positions, setPositions] = useState<SpritePosition[]>([]);

  useEffect(() => {
    if (!shouldShow || typeof window === 'undefined') {
      return;
    }

    const margin = Math.max(36, 72 - penguinLevel * 4);
    const maxRotation = 16 + penguinLevel * 4;
    const maxScaleBonus = Math.min(0.28, 0.14 + penguinLevel * 0.03);
    const updatePositions = () => {
      if (typeof window === 'undefined') return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const usableWidth = Math.max(viewportWidth - size - margin * 2, 1);
      const usableHeight = Math.max(viewportHeight - size - margin * 2, 1);

      const nextPositions = Array.from({ length: renderCount }).map(() => {
        const x = margin + Math.random() * usableWidth;
        const y = margin + Math.random() * usableHeight;
        const rotation = (Math.random() - 0.5) * maxRotation;
        const scale = 0.85 + Math.random() * maxScaleBonus;
        return { x, y, rotation, scale };
      });

      setPositions(nextPositions);
    };

    updatePositions();

    const baseInterval = Math.max(1400, 3200 - penguinLevel * 280);
    const interval = window.setInterval(updatePositions, baseInterval);
    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [penguinLevel, renderCount, shouldShow, size]);

  if (!shouldShow) {
    return null;
  }

  const shimmerGradient =
    penguinLevel < 3
      ? 'from-sky-200/30 via-transparent to-sky-300/20'
      : penguinLevel < 5
      ? 'from-sky-300/40 via-cyan-200/20 to-indigo-200/30'
      : 'from-indigo-300/50 via-sky-200/30 to-cyan-300/40';

  return (
    <div className="pointer-events-none fixed inset-0 z-[9997]">
      <div className={`absolute inset-0 bg-gradient-to-br ${shimmerGradient} blur-3xl opacity-40 transition-opacity duration-700`} />
      {Array.from({ length: renderCount }).map((_, index) => {
        const pos = positions[index] ?? DEFAULT_POSITION;
        const transitionMs = 1200 + index * 110 - penguinLevel * 40;

        return (
          <div
            key={index}
            className="absolute top-0 left-0 drop-shadow-[0_0_26px_rgba(56,189,248,0.55)]"
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rotation}deg) scale(${pos.scale})`,
              transition: `transform ${Math.max(900, transitionMs)}ms cubic-bezier(0.43, 0.13, 0.23, 0.96)`
            }}
          >
            <Image
              src="/memes/penguin.gif"
              alt={`Penguin ${index + 1}`}
              width={size}
              height={size}
              unoptimized
              priority={index === 0}
            />
          </div>
        );
      })}
    </div>
  );
}
