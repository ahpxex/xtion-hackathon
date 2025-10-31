"use client";

import Image from "next/image";
import { useAtom } from 'jotai';
import { showSkeletonAtom } from '../store/atoms';

export default function SkeletonDisplay() {
  const [showSkeleton] = useAtom(showSkeletonAtom);

  if (!showSkeleton) {
    return null;
  }

  return (
    <div className={`fixed bottom-8 right-8 z-[9997]`}>
      <Image
        src="/memes/skeleton-dancing.gif"
        alt="Dancing Skeleton"
        width={150}
        height={150}
        unoptimized
      />
    </div>
  );
}
