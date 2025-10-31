'use client';

import { useAtom } from 'jotai';
import { clickCountAtom } from '../store/atoms';
import ShopItem, { ShopItemData } from './ShopItem';

interface ShopProps {
  items: ShopItemData[];
}

export default function Shop({ items }: ShopProps) {
  const [clickCount] = useAtom(clickCountAtom);

  if (clickCount === 0) {
    return null;
  }

  const handlePurchase = (item: ShopItemData) => {
    console.log(`购买了: ${item.name}`);
  };

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {items.map(item => (
        <ShopItem
          key={item.id}
          item={item}
          onPurchase={handlePurchase}
        />
      ))}
    </div>
  );
}
