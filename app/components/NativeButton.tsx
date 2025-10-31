'use client';

import { ButtonHTMLAttributes, useState } from 'react';
import { useAtom } from 'jotai';
import { clickCountAtom, clickMultiplierAtom } from '../store/atoms';

interface NativeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  clickValue?: number;
}

interface FloatingNumber {
  id: number;
  value: number;
  x: number;
  y: number;
}

export default function NativeButton({ children, className = '', clickValue = 1, onClick, ...props }: NativeButtonProps) {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [clickCount, setClickCount] = useAtom(clickCountAtom);
  const [clickMultiplier] = useAtom(clickMultiplierAtom);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const actualValue = clickValue * clickMultiplier;

    const newNumber: FloatingNumber = {
      id: Date.now() + Math.random(),
      value: actualValue,
      x,
      y
    };

    setFloatingNumbers(prev => [...prev, newNumber]);
    setClickCount(prev => prev + actualValue);

    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(num => num.id !== newNumber.id));
    }, 1000);

    if (onClick) {
      onClick(e);
    }
  };

  const baseClasses = "px-2 py-1 border border-gray-400 bg-gray-200 text-black rounded-sm hover:bg-gray-300 active:bg-gray-400 cursor-pointer text-sm relative overflow-visible";
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <button className={combinedClasses} onClick={handleClick} {...props}>
      {children}
      {floatingNumbers.map(num => (
        <span
          key={num.id}
          className="absolute pointer-events-none font-bold text-blue-600 animate-float-up"
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
