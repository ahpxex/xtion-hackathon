'use client';

import Image from 'next/image';
import { useAtom } from 'jotai';
import { penguinLevelAtom } from '../store/atoms';

export default function PenguinDisplay() {
  const [penguinLevel] = useAtom(penguinLevelAtom);

  if (penguinLevel <= 0) {
    return null;
  }

  const clampedLevel = Math.min(penguinLevel, 8);
  const renderCount = Math.max(1, clampedLevel);
  const size = Math.max(110, 150 - (renderCount - 1) * 6);

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
