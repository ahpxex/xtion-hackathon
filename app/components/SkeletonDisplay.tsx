"use client";

import Image from "next/image";
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { skeletonLevelAtom } from '../store/atoms';

type SpritePosition = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

const DEFAULT_POSITION: SpritePosition = { x: 96, y: 96, rotation: 0, scale: 1 };

export default function SkeletonDisplay() {
  const [skeletonLevel] = useAtom(skeletonLevelAtom);

  const shouldShow = skeletonLevel > 0;
  const clampedLevel = Math.min(Math.max(skeletonLevel, 0), 8);
  const renderCount = Math.max(1, clampedLevel);
  const baseSize = 150;
  const size = Math.max(108, baseSize - (renderCount - 1) * 6);

  const [positions, setPositions] = useState<SpritePosition[]>([]);

  useEffect(() => {
    if (!shouldShow || typeof window === 'undefined') {
      return;
    }

    const margin = Math.max(36, 72 - skeletonLevel * 4);
    const maxRotation = 18 + skeletonLevel * 5;
    const maxScaleBonus = Math.min(0.32, 0.16 + skeletonLevel * 0.035);

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
        const scale = 0.82 + Math.random() * maxScaleBonus;
        return { x, y, rotation, scale };
      });

      setPositions(nextPositions);
    };

    updatePositions();

    const baseInterval = Math.max(1300, 3000 - skeletonLevel * 260);
    const interval = window.setInterval(updatePositions, baseInterval);
    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [renderCount, shouldShow, skeletonLevel, size]);

  if (!shouldShow) {
    return null;
  }

  const auraGradient =
    skeletonLevel < 3
      ? 'from-purple-300/20 via-transparent to-fuchsia-300/25'
      : skeletonLevel < 5
      ? 'from-purple-400/30 via-pink-300/20 to-rose-300/25'
      : 'from-fuchsia-500/35 via-purple-400/25 to-amber-300/20';

  return (
    <div className="pointer-events-none fixed inset-0 z-[9997]">
      <div className={`absolute inset-0 bg-gradient-to-tr ${auraGradient} blur-3xl opacity-35 transition-opacity duration-700`} />
      {Array.from({ length: renderCount }).map((_, index) => {
        const pos = positions[index] ?? DEFAULT_POSITION;
        const transitionMs = 1150 + index * 130 - skeletonLevel * 45;

        return (
          <div
            key={index}
            className="absolute top-0 left-0 drop-shadow-[0_0_34px_rgba(244,114,182,0.55)]"
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rotation}deg) scale(${pos.scale})`,
              transition: `transform ${Math.max(880, transitionMs)}ms cubic-bezier(0.45, 0.02, 0.21, 0.98)`
            }}
          >
            <Image
              src="/memes/skeleton-dancing.gif"
              alt={`Dancing Skeleton ${index + 1}`}
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
