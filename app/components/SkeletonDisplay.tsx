"use client";

import Image from "next/image";
import { useAtom } from 'jotai';
import { skeletonLevelAtom } from '../store/atoms';

export default function SkeletonDisplay() {
  const [skeletonLevel] = useAtom(skeletonLevelAtom);

  if (skeletonLevel <= 0) {
    return null;
  }

  const clampedLevel = Math.min(skeletonLevel, 8);
  const renderCount = Math.max(1, clampedLevel);
  const size = Math.max(110, 150 - (renderCount - 1) * 6);

  return (
    <div className="pointer-events-none fixed bottom-8 right-8 z-[9997] flex max-w-[55vw] flex-wrap-reverse gap-4 justify-end">
      {Array.from({ length: renderCount }).map((_, index) => (
        <div
          key={index}
          className="relative drop-shadow-[0_0_22px_rgba(147,51,234,0.45)]"
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
      ))}
    </div>
  );
}
