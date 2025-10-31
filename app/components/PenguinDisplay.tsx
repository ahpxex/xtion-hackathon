'use client';

import Image from 'next/image';
import { useAtom } from 'jotai';
import { showPenguinAtom } from '../store/atoms';

export default function PenguinDisplay() {
  const [showPenguin] = useAtom(showPenguinAtom);

  if (!showPenguin) {
    return null;
  }

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
