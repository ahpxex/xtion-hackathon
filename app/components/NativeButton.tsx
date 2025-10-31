'use client';

import { ButtonHTMLAttributes, useState } from 'react';
import { useAtom } from 'jotai';
import { clickCountAtom, clickMultiplierAtom, clicksAtom, stageAtom, fancyButtonAtom, bonusLevelAtom } from '../store/atoms';

interface NativeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  clickValue?: number;
}

interface FloatingNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  isBonus?: boolean;
}

export default function NativeButton({ children, className = '', clickValue = 1, onClick, ...props }: NativeButtonProps) {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [clickCount, setClickCount] = useAtom(clickCountAtom);
  const [clickMultiplier] = useAtom(clickMultiplierAtom);
  const [, setClicks] = useAtom(clicksAtom);
  const [, setStage] = useAtom(stageAtom);
  const [isFancyButton] = useAtom(fancyButtonAtom);
  const [bonusLevel] = useAtom(bonusLevelAtom);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const baseValue = clickValue * clickMultiplier;
    const bonusChance = Math.min(bonusLevel * 0.1, 1);
    const isBonus = bonusLevel > 0 && Math.random() < bonusChance;
    const totalValue = isBonus ? baseValue * 2 : baseValue;

    const newNumber: FloatingNumber = {
      id: Date.now() + Math.random(),
      value: totalValue,
      x,
      y,
      isBonus,
    };

    setFloatingNumbers(prev => [...prev, newNumber]);
    setClickCount(prev => prev + totalValue);
    setClicks(prev => prev + 1); // 点击次数 +1
    setStage(prev => prev + totalValue); // stage 增加实际产生的点数

    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(num => num.id !== newNumber.id));
    }, 1000);

    if (onClick) {
      onClick(e);
    }
  };

  const baseClasses = "px-2 py-1 border border-gray-400 bg-gray-200 text-black rounded-sm hover:bg-gray-300 active:bg-gray-400 cursor-pointer text-sm relative overflow-visible";
  const fancyClasses =
    "relative overflow-visible px-6 py-3 text-lg font-bold text-white rounded-full border-2 border-white shadow-[0_0_18px_rgba(255,255,255,0.45)] bg-[length:300%_300%] bg-[linear-gradient(120deg,#ff7eb3,#ff758c,#ffce67,#82f3ff,#a17bff,#ff7eb3)] animate-rainbow transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_28px_rgba(255,255,255,0.6)] focus:outline-none focus:ring-4 focus:ring-white/60";

  const combinedClasses = [isFancyButton ? fancyClasses : baseClasses, className]
    .filter(Boolean)
    .join(' ');

  const floatingNumberClass = isFancyButton
    ? "absolute pointer-events-none font-bold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.85)] animate-float-up"
    : "absolute pointer-events-none font-bold text-blue-600 animate-float-up";

  return (
    <button className={combinedClasses} onClick={handleClick} {...props}>
      {isFancyButton && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[-8%] rounded-full border border-white/40 blur-md opacity-60"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_60%)] mix-blend-screen animate-[pulse_2.8s_ease-in-out_infinite]"
          />
        </>
      )}
      {children}
      {floatingNumbers.map(num => (
        <span
          key={num.id}
          className={`${floatingNumberClass} ${
            num.isBonus
              ? isFancyButton
                ? 'text-yellow-200'
                : 'text-amber-500'
              : ''
          }`}
          style={{
            left: `${num.x}px`,
            top: `${num.y}px`,
          }}
        >
          +{num.value}
        </span>
      ))}
    </button>
  );
}
