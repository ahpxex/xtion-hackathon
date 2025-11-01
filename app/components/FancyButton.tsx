'use client';

import { ButtonHTMLAttributes, useState } from 'react';
import { useAtom } from 'jotai';
import { clickCountAtom, globalMultiplierAtom } from '../store/atoms';

interface FancyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  clickValue?: number;
}

interface FloatingNumber {
  id: number;
  value: number;
  x: number;
  y: number;
}

export default function FancyButton({
  children,
  className = '',
  variant = 'primary',
  clickValue = 1,
  onClick,
  ...props
}: FancyButtonProps) {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [clickCount, setClickCount] = useAtom(clickCountAtom);
  const [globalMultiplier] = useAtom(globalMultiplierAtom);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const reward = clickValue * globalMultiplier;

    const newNumber: FloatingNumber = {
      id: Date.now() + Math.random(),
      value: reward,
      x,
      y
    };

    setFloatingNumbers(prev => [...prev, newNumber]);
    setClickCount(prev => prev + reward);

    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(num => num.id !== newNumber.id));
    }, 1000);

    if (onClick) {
      onClick(e);
    }
  };

  const baseClasses = "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl relative overflow-visible";

  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:-translate-y-0.5",
    secondary: "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black hover:-translate-y-0.5",
    accent: "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 hover:-translate-y-0.5"
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button className={combinedClasses} onClick={handleClick} {...props}>
      <span className="relative z-10">{children}</span>
      {floatingNumbers.map(num => (
        <span
          key={num.id}
          className="absolute pointer-events-none font-bold text-yellow-300 text-xl animate-float-up z-20"
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
