'use client';

import Image from 'next/image';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { penguinLevelAtom } from '../store/atoms';

export default function PenguinDisplay() {
  const [penguinLevel] = useAtom(penguinLevelAtom);

  const MAX_LEVEL = 5;
  const clampedLevel = Math.min(Math.max(penguinLevel, 0), 8);
  const renderCount = Math.max(1, clampedLevel);
  const size = Math.max(110, 150 - (renderCount - 1) * 6);
  const isMaxLevel = penguinLevel >= MAX_LEVEL;
  const shouldShow = penguinLevel > 0;

  type SpritePosition = { x: number; y: number; rotation: number; scale: number };
  const [positions, setPositions] = useState<SpritePosition[]>([]);

  useEffect(() => {
    if (!shouldShow || !isMaxLevel || typeof window === 'undefined') {
      return;
    }

    const margin = 72;

    const updatePositions = () => {
      if (typeof window === 'undefined') return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const effectiveWidth = Math.max(viewportWidth - size - margin * 2, 0);
      const effectiveHeight = Math.max(viewportHeight - size - margin * 2, 0);

      const nextPositions = Array.from({ length: renderCount }).map(() => {
        const x = margin + Math.random() * (effectiveWidth || 1);
        const y = margin + Math.random() * (effectiveHeight || 1);
        const rotation = (Math.random() - 0.5) * 24;
        const scale = 0.92 + Math.random() * 0.18;
        return { x, y, rotation, scale };
      });

      setPositions(nextPositions);
    };

    updatePositions();

    const interval = window.setInterval(updatePositions, 2600);
    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMaxLevel, renderCount, shouldShow, size]);

  if (!shouldShow) {
    return null;
  }

  if (isMaxLevel) {
    const fallbackPosition: SpritePosition = { x: 80, y: 80, rotation: 0, scale: 1 };

    return (
      <div className="pointer-events-none fixed inset-0 z-[9997]">
        {Array.from({ length: renderCount }).map((_, index) => {
          const pos = positions[index] ?? fallbackPosition;
          const transitionMs = 1500 + index * 120;

          return (
            <div
              key={index}
              className="absolute top-0 left-0 drop-shadow-[0_0_28px_rgba(59,130,246,0.45)]"
              style={{
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rotation}deg) scale(${pos.scale})`,
                transition: `transform ${transitionMs}ms cubic-bezier(0.4, 0.0, 0.2, 1)`
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

  return (
    <div className="pointer-events-none fixed bottom-8 left-8 z-[9997] flex max-w-[55vw] flex-wrap gap-4">
      {Array.from({ length: renderCount }).map((_, index) => (
        <div
          key={index}
          className="relative drop-shadow-[0_0_20px_rgba(59,130,246,0.45)]"
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
      ))}
    </div>
  );
}
