'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { clickCountAtom } from '../store/atoms';

export interface ShopItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  effect: string;
  icon: string;
  level: number; // 物品等级，最低为 1
}

interface ShopItemProps {
  item: ShopItemData;
  onPurchase?: (item: ShopItemData) => void;
}

export default function ShopItem({ item, onPurchase }: ShopItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useAtom(clickCountAtom);

  const canAfford = clickCount >= item.price;

  const handlePurchase = () => {
    if (canAfford) {
      setClickCount(prev => prev - item.price);
      if (onPurchase) {
        onPurchase(item);
      }
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handlePurchase}
        disabled={!canAfford}
        className={`
          w-16 h-16 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
          ${canAfford
            ? 'border-green-500 bg-green-50 hover:bg-green-100 hover:scale-110 cursor-pointer'
            : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
          }
        `}
      >
        <span className="text-3xl">{item.icon}</span>
      </button>

      {isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 min-w-64 animate-fade-in">
          <h3 className="font-bold text-lg mb-2">{item.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-semibold">等级：</span>
              <span className="text-purple-600">Lv.{item.level}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold">价格：</span>
              <span className={canAfford ? 'text-green-600' : 'text-red-600'}>
                {item.price} 点数
              </span>
            </p>
            <p className="text-sm">
              <span className="font-semibold">效果：</span>
              <span className="text-blue-600">{item.effect}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
