'use client';

import { useAtom } from 'jotai';
import { clickCountAtom } from '../store/atoms';

interface CreditDisplayProps {
  size?: 'sm' | 'm' | 'l' | 'xl' | 'huge';
}

export default function CreditDisplay({ size = 'm' }: CreditDisplayProps) {
  const [clickCount] = useAtom(clickCountAtom);

  if (clickCount === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-sm',
    m: 'text-2xl',
    l: 'text-4xl',
    xl: 'text-6xl',
    huge: 'text-8xl'
  };

  return (
    <p className={`${sizeClasses[size]} font-bold`}>点数：{clickCount}</p>
  );
}
