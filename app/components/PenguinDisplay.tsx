'use client';

import Image from 'next/image';

export default function PenguinDisplay() {
  return (
    <div className="fixed bottom-8 left-8 z-[9997]">
      <Image
        src="/memes/penguin.gif"
        alt="Penguin"
        width={150}
        height={150}
        unoptimized
      />
    </div>
  );
}
