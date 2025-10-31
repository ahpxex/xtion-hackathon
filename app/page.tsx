'use client';

import NativeButton from "./components/NativeButton";
import FancyButton from "./components/FancyButton";
import { useAtom } from 'jotai';
import { clickCountAtom } from './store/atoms';

export default function Home() {
  const [clickCount] = useAtom(clickCountAtom);

  return (
    <div className="h-screen flex flex-col gap-4 justify-center items-center">
      {clickCount > 0 && (
        <p className="text-2xl font-bold">点数：{clickCount}</p>
      )}
      <NativeButton clickValue={1}>Native Button</NativeButton>
    </div>
  );
}
