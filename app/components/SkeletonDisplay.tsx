"use client";

import Image from "next/image";

export default function SkeletonDisplay() {
  return (
    <div className={`absolute bottom-8 right-8 z-9997`}>
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
